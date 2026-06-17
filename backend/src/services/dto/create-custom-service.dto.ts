import { IsString, IsOptional, IsNumber, IsObject, IsArray } from 'class-validator';

/** Wizard-generated workflow attached to a new service (self-serve flow). */
export class ServiceWorkflowDto {
  @IsString()
  serviceMode: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  paymentTiming?: string;

  // steps / transitions / serviceConfig are JSON blobs produced by the wizard's
  // /workflow/templates/generate call — passed straight through to the template.
  steps: unknown[];

  transitions: unknown[];

  @IsOptional()
  @IsObject()
  serviceConfig?: Record<string, unknown>;
}

export class CreateCustomServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  iconKey?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // When present (self-serve wizard), the service is created WITH this workflow
  // — published, provider-owned, and linked — so it's instantly bookable
  // without a regional admin pre-authoring a template.
  @IsOptional()
  @IsObject()
  workflow?: ServiceWorkflowDto;

  // Alternative to `workflow`: link the new service to EXISTING workflow
  // templates the provider picked (appointment types) instead of generating one.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workflowTemplateIds?: string[];
}
