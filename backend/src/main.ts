import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ResponseTransformInterceptor } from './shared/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';
import { join, resolve } from 'path';
import { existsSync, readFileSync, mkdirSync } from 'fs';

// Sentry error monitoring — init before any async code so all exceptions are captured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

// Load root .env so NestJS uses the same JWT_SECRET as Next.js
const envPath = resolve(__dirname, '../../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    // Only set if not already in environment (env vars take precedence)
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global prefix: all HTTP routes start with /api
  app.setGlobalPrefix('api');

  // ─── Serve uploaded files ─────────────────────────────────────────
  // Files written by /api/upload land in `backend/public/uploads/<file>`
  // (see `upload.controller.ts`). Expose them at `/uploads/<file>` so
  // user avatars / covers / receipts become fetchable by the frontend
  // (which proxies `/uploads/*` → backend via next.config.ts rewrites).
  const publicDir = join(process.cwd(), 'public');
  const uploadsDir = join(publicDir, 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(publicDir, { prefix: '/' });

  // URI versioning — routes resolve under BOTH /api/* and /api/v1/*
  // without any controller annotation changes. This preserves the existing
  // frontend/mobile clients (calling /api/...) while introducing versioning
  // as the contract for future breaking changes.
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL, '1'],
    prefix: 'v',
  });

  // Security headers — allow cross-origin resource access so the Flutter
  // web app (different port) can read API responses. Other Helmet defaults
  // (X-Frame-Options, CSP, HSTS, etc.) stay on.
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));

  // Parse cookies (JWT lives in mediwyz_token cookie)
  app.use(cookieParser());

  // Global pipes, filters, interceptors — enterprise-grade request handling
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // Strip unknown properties from DTOs
    transform: true,       // Auto-transform payloads to DTO instances
    forbidNonWhitelisted: false, // Don't reject unknown fields (backward compat)
  }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseTransformInterceptor());

  // CORS — dev allows any origin; prod uses CORS_ALLOWED_ORIGINS (comma-separated) or NEXT_PUBLIC_APP_URL
  const isProd = process.env.NODE_ENV === 'production';
  const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  app.enableCors({
    origin: isProd ? (envOrigins.length > 0 ? envOrigins : false) : true,
    credentials: true,
  });

  // ─── Swagger / OpenAPI Documentation ──────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MediWyz API')
    .setDescription(
      'MediWyz healthcare platform API — dynamic provider roles, workflow engine, ' +
      'health shop, insurance-company contributions, AI health tracker.\n\n' +
      'All endpoints are reachable at both `/api/*` (current) and `/api/v1/*` (versioned). ' +
      'Future breaking changes will land as `/api/v2/*`.',
    )
    .setVersion('1.0')
    .setContact('MediWyz', 'https://mediwyz.com', 'dev@mediwyz.com')
    .setLicense('Proprietary', '')
    .addServer('http://localhost:3001', 'Local')
    .addCookieAuth('mediwyz_token', { type: 'apiKey', in: 'cookie', name: 'mediwyz_token' })
    .addBearerAuth()
    .addTag('Auth', 'Login, registration, session management')
    .addTag('Bookings', 'Unified booking flow for any provider type')
    .addTag('Providers', 'Generic provider endpoints (any role)')
    .addTag('Corporate', 'Companies + insurance capability — owner actions')
    .addTag('Inventory', 'Provider inventory + Health Shop + orders')
    .addTag('Workflow', 'Status workflow engine')
    .addTag('AI', 'AI assistant chat + health tracker')
    .addTag('CMS', 'Hero slides, testimonials, site sections')
    .addTag('Admin', 'Super-admin controls')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, defaultModelsExpandDepth: -1 },
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`MediWyz API running on http://localhost:${port}`);
  console.log(`API docs available at http://localhost:${port}/api/docs`);
  console.log(`Socket.IO gateway active on ws://localhost:${port}`);
}

bootstrap();
