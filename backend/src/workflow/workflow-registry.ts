import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Template resolution — specificity wins first.
 *
 * Prior bug: a provider cloning a library template with mismatched step
 * labels (e.g. a home-visit flow cloned with `serviceMode: video`) could
 * override the correct system default for every one of that provider's
 * bookings for that mode, because the resolver accepted any provider
 * custom template keyed only on `providerType + serviceMode`. Made
 * Emma's video consultation run home-visit labels.
 *
 * New rule: provider-custom templates ONLY apply when explicitly linked
 * to a platformServiceId. Without a link, they are considered drafts and
 * the default takes precedence. Authors who want a workflow to apply
 * broadly must link it to the relevant service catalog entry.
 */
@Injectable()
export class WorkflowRegistry {
  constructor(private prisma: PrismaService) {}

  async resolveTemplate(params: {
    platformServiceId?: string | null; providerUserId: string;
    providerType: string; serviceMode: string; regionCode?: string | null;
  }) {
    const { platformServiceId, providerUserId, providerType, serviceMode, regionCode } = params;

    // Published-only filter — drafts are invisible to the booking engine.
    const published = { isDraft: false };

    // 1. Provider's custom template explicitly linked to THIS service
    if (platformServiceId) {
      const t = await this.prisma.workflowTemplate.findFirst({
        where: { platformServiceId, createdByProviderId: providerUserId, serviceMode, isActive: true, ...published },
      });
      if (t) return t;
    }

    // 2. Regional admin template linked to THIS service
    if (platformServiceId && regionCode) {
      const t = await this.prisma.workflowTemplate.findFirst({
        where: { platformServiceId, createdByAdminId: { not: null }, regionCode, serviceMode, isActive: true, ...published },
      });
      if (t) return t;
    }

    // 3. System default linked to THIS specific service
    if (platformServiceId) {
      const t = await this.prisma.workflowTemplate.findFirst({
        where: { platformServiceId, isDefault: true, serviceMode, isActive: true },
        // System defaults are never drafts — no isDraft filter needed
      });
      if (t) return t;
    }

    // Levels 4-6 are generic fallbacks (no platformServiceId link).
    // If a platformServiceId was given but nothing matched levels 1-3, fall
    // through to the generic providerType+serviceMode defaults so bookings
    // always have a runnable workflow. Services that need a distinct flow can
    // be explicitly linked at levels 1-3.

    // 4. Regional admin generic template for provider type + mode (region-scoped)
    if (regionCode) {
      const t = await this.prisma.workflowTemplate.findFirst({
        where: { createdByAdminId: { not: null }, providerType, serviceMode, regionCode, isActive: true, platformServiceId: null, ...published },
      });
      if (t) return t;
    }

    // 5. System default for provider type + mode
    const systemDefault = await this.prisma.workflowTemplate.findFirst({
      where: { providerType, serviceMode, isDefault: true, isActive: true, platformServiceId: null },
    });
    if (systemDefault) return systemDefault;

    // 6. Last resort — provider's generic published template (no platformServiceId).
    //    Only if NO default covers this (providerType, mode) pair. This
    //    keeps the old escape hatch alive for roles with no seeded default.
    return this.prisma.workflowTemplate.findFirst({
      where: { createdByProviderId: providerUserId, providerType, serviceMode, platformServiceId: null, isActive: true, ...published },
    });
  }
}
