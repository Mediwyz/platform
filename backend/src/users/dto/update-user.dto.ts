import { IsString, IsOptional, IsDateString, IsArray, IsNumber, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() profileImage?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;

  // ── Extended personal profile (all optional) ──────────────────────────
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() preferredName?: string;
  @IsOptional() @IsString() pronouns?: string;
  @IsOptional() @IsString() maritalStatus?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() secondaryPhone?: string;
  @IsOptional() @IsEmail() secondaryEmail?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() stateRegion?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() employer?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() emergencyContactRelationship?: string;
  @IsOptional() @IsString() linkedinUrl?: string;
  @IsOptional() @IsString() twitterUrl?: string;
  @IsOptional() @IsString() facebookUrl?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsNumber() heightCm?: number;
  @IsOptional() @IsNumber() weightKg?: number;
}
