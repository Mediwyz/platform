import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionalService {
  constructor(private prisma: PrismaService) {}

  async getCountryCode(userId: string): Promise<string | undefined> {
    const profile = await this.prisma.regionalAdminProfile.findUnique({ where: { userId }, select: { countryCode: true } });
    return profile?.countryCode || undefined;
  }

  async listPlans(countryCode?: string) {
    return this.prisma.subscriptionPlan.findMany({
      where: { countryCode },
      include: { planServices: { include: { platformService: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(body: any, countryCode: string | undefined, adminUserId: string) {
    return this.prisma.subscriptionPlan.create({
      data: { name: body.name, slug: body.slug, description: body.description, type: body.type || 'individual', price: body.price || 0, currency: body.currency || 'MUR', countryCode, isActive: true, createdByAdminId: adminUserId },
    });
  }

  async updatePlan(id: string, body: any) {
    const data: any = {};
    for (const k of ['name', 'description', 'price', 'isActive', 'features']) { if (body[k] !== undefined) data[k] = body[k]; }
    return this.prisma.subscriptionPlan.update({ where: { id }, data });
  }

  async listServiceGroups(countryCode?: string) {
    return this.prisma.serviceGroup.findMany({
      where: { countryCode },
      include: { items: { include: { platformService: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async listRoles(countryCode?: string) {
    return this.prisma.providerRole.findMany({
      where: { OR: [{ regionCode: countryCode }, { regionCode: null }] },
      include: { verificationDocs: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createRole(body: any, countryCode?: string) {
    return this.prisma.providerRole.create({
      data: {
        code: body.code?.toUpperCase(), label: body.label, singularLabel: body.singularLabel || body.label,
        slug: body.slug, icon: body.icon || 'FaUser', iconKey: body.iconKey, color: body.color || '#0C6780',
        cardImage: body.cardImage,
        description: body.description, searchEnabled: body.searchEnabled ?? true,
        bookingEnabled: body.bookingEnabled ?? true, inventoryEnabled: body.inventoryEnabled ?? false,
        isProvider: true, isActive: true, urlPrefix: body.urlPrefix || `/${body.slug}`,
        cookieValue: body.cookieValue || body.slug, regionCode: countryCode,
        verificationDocs: body.verificationDocs?.length ? {
          create: body.verificationDocs.map((d: any, i: number) => ({
            documentName: d.documentName, description: d.description, isRequired: d.isRequired ?? true, displayOrder: i + 1,
          })),
        } : undefined,
      },
      include: { verificationDocs: true },
    });
  }

  async updateRole(id: string, body: any) {
    const data: any = {};
    for (const k of ['label', 'singularLabel', 'slug', 'icon', 'iconKey', 'color', 'cardImage', 'description', 'searchEnabled', 'bookingEnabled', 'inventoryEnabled', 'isActive', 'urlPrefix']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.code) data.code = body.code.toUpperCase();
    return this.prisma.providerRole.update({ where: { id }, data, include: { verificationDocs: true } });
  }

  async deactivateRole(id: string) {
    await this.prisma.providerRole.update({ where: { id }, data: { isActive: false } });
  }

  // ── Organisation categories ───────────────────────────────────────────────
  async listOrgCategories() {
    return (this.prisma as any).organisationCategory.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async createOrgCategory(body: any) {
    const key = (body.key || body.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    return (this.prisma as any).organisationCategory.create({
      data: {
        key, label: body.label, blurb: body.blurb || null,
        icon: body.icon || 'FaBuilding', displayOrder: body.displayOrder ?? 100,
        isActive: body.isActive ?? true,
      },
    });
  }

  async updateOrgCategory(id: string, body: any) {
    const data: any = {};
    for (const k of ['label', 'blurb', 'icon', 'displayOrder', 'isActive']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    return (this.prisma as any).organisationCategory.update({ where: { id }, data });
  }

  async deactivateOrgCategory(id: string) {
    await (this.prisma as any).organisationCategory.update({ where: { id }, data: { isActive: false } });
  }
}
