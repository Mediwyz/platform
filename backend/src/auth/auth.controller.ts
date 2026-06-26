import { Controller, Post, Get, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './jwt.strategy';
import { z } from 'zod';

// ─── Validation schemas (from lib/auth/schemas.ts) ─────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().min(5, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().min(1, 'Address is required'),
  userType: z.enum([
    'patient', 'doctor', 'nurse', 'nanny', 'pharmacist', 'lab', 'emergency',
    'insurance', 'corporate', 'referral-partner', 'regional-admin',
    'caregiver', 'physiotherapist', 'dentist', 'optometrist', 'nutritionist',
  ]),
  referralCode: z.string().optional().default(''),
  doctorCategory: z.enum(['general_practitioner', 'specialist']).optional(),
  enrolledInCompany: z.boolean().optional().default(false),
  companyId: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialization: z.string().optional(),
  institution: z.string().optional(),
  experience: z.string().optional(),
  companyName: z.string().optional(),
  companyRegistrationNumber: z.string().optional(),
  targetCountry: z.string().optional(),
  targetRegion: z.string().optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  businessType: z.string().optional(),
  emergencyContactName: z.string().optional().default(''),
  emergencyContactPhone: z.string().optional().default(''),
  emergencyContactRelation: z.string().optional().default(''),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
  agreeToDisclaimer: z.boolean().refine(val => val === true, 'You must agree to the medical disclaimer'),
  regionId: z.string().optional(),
  profileImage: z.string().optional(),
  documentUrls: z.array(z.object({
    name: z.string().min(1), type: z.string().min(1), url: z.string().min(1), size: z.number().optional(),
  })).optional().default([]),
  documentVerifications: z.array(z.object({
    documentId: z.string(), verified: z.boolean(), confidence: z.number(),
  })).optional().default([]),
  skippedDocuments: z.array(z.string()).optional().default([]),
  trackingId: z.string().optional(),
  selectedPlanId: z.string().optional(),
  selectedBusinessPlanId: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─── Cookie config (matches lib/auth/cookies.ts) ───────────────────────────

// Dev/cross-origin dev between Flutter web (:8080) and NestJS (:3001) needs
// SameSite=None so the auth cookie flows across origins. Browsers require
// Secure=true for SameSite=None — localhost is exempt.
const IS_PROD = process.env.NODE_ENV === 'production';
const IS_HTTPS = IS_PROD && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_HTTPS || !IS_PROD,
  sameSite: IS_PROD ? ('lax' as const) : ('none' as const),
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms (express uses ms, not seconds)
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    try {
      const result = await this.authService.login(parsed.data.email, parsed.data.password);

      // Set auth cookies (same as Next.js setAuthCookies)
      res.cookie('mediwyz_token', result.token, COOKIE_OPTIONS);
      res.cookie('mediwyz_userType', result.cookieUserType, { ...COOKIE_OPTIONS, httpOnly: false });
      res.cookie('mediwyz_user_id', result.user.id, { ...COOKIE_OPTIONS, httpOnly: false });

      return {
        success: true,
        user: result.user,
        redirectPath: result.redirectPath,
        message: 'Login successful',
      };
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status);
      return { success: false, message: error.message || 'An error occurred during login' };
    }
  }

  @Public()
  @Post('register')
  @Throttle({ medium: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400);
      return { success: false, message: parsed.error.issues[0].message };
    }

    try {
      const result = await this.authService.register(parsed.data);

      // Auto-login for immediately active accounts so the user lands on
      // their feed without having to log in again.
      if (result.accountStatus === 'active') {
        const loginResult = await this.authService.login(
          parsed.data.email,
          parsed.data.password,
        );
        res.cookie('mediwyz_token', loginResult.token, COOKIE_OPTIONS);
        res.cookie('mediwyz_userType', loginResult.cookieUserType, { ...COOKIE_OPTIONS, httpOnly: false });
        res.cookie('mediwyz_user_id', loginResult.user.id, { ...COOKIE_OPTIONS, httpOnly: false });
        return {
          success: true,
          ...result,
          user: loginResult.user,
          redirectPath: loginResult.redirectPath,
        };
      }

      return { success: true, ...result };
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status);
      return { success: false, message: error.message || 'An error occurred during registration. Please try again.' };
    }
  }

  @Get('me')
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  async me(@CurrentUser() user: JwtPayload) {
    const userData = await this.authService.getMe(user);
    return { success: true, user: userData };
  }

  // ─── Activate a service-provider category for the current member ──────────
  // Any member can become a provider from their profile; we re-issue the auth
  // cookies with the new userType so they land on the provider dashboard.
  @Post('activate-provider')
  @HttpCode(HttpStatus.OK)
  async activateProvider(
    @Body() body: { providerType?: string },
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.activateProvider(user.sub, body?.providerType ?? '');
      res.cookie('mediwyz_token', result.token, COOKIE_OPTIONS);
      res.cookie('mediwyz_userType', result.cookieUserType, { ...COOKIE_OPTIONS, httpOnly: false });
      res.cookie('mediwyz_user_id', result.user.id, { ...COOKIE_OPTIONS, httpOnly: false });
      return { success: true, user: result.user, redirectPath: result.redirectPath };
    } catch (error: any) {
      res.status(error.status || 400);
      return { success: false, message: error.message || 'Activation failed' };
    }
  }

  // ─── In-app password reset (no email provider required) ──────────────

  /** Step 1: look up the user's security question. Enumeration-safe. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password/question')
  @HttpCode(HttpStatus.OK)
  async forgotPasswordQuestion(@Body() body: { email: string }) {
    const parsed = z.string().email().safeParse(body?.email);
    if (!parsed.success) {
      return { success: true, question: 'What is your favourite colour?' };
    }
    const { question } = await this.authService.getSecurityQuestion(parsed.data);
    return { success: true, question };
  }

  /** Step 2: verify the security answer. Returns a short-lived reset token on success. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password/verify')
  @HttpCode(HttpStatus.OK)
  async forgotPasswordVerify(@Body() body: { email: string; answer: string }) {
    const result = await this.authService.verifySecurityAnswerAndIssueToken(
      body?.email || '',
      body?.answer || '',
    );
    if (!result.verified) {
      // Keep generic — never leak whether the email exists or answer was wrong
      return { success: false, message: 'Incorrect answer. Please try again.' };
    }
    return { success: true, resetToken: result.resetToken };
  }

  /** Step 3: set the new password using the verified token. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.authService.resetPassword(body?.token, body?.password);
    return { success: true, message: 'Password updated. You can now log in.' };
  }

  /** Authenticated user can set/change their security question. */
  @Post('security-question')
  @HttpCode(HttpStatus.OK)
  async setSecurityQuestion(
    @Body() body: { question: string; answer: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.authService.setSecurityQuestion(user.sub, body?.question, body?.answer);
    return { success: true, message: 'Security question updated.' };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const clearOptions = { ...COOKIE_OPTIONS, maxAge: 0 };
    res.cookie('mediwyz_token', '', clearOptions);
    res.cookie('mediwyz_userType', '', { ...clearOptions, httpOnly: false });
    res.cookie('mediwyz_user_id', '', { ...clearOptions, httpOnly: false });
    return { success: true, message: 'Logged out' };
  }
}
