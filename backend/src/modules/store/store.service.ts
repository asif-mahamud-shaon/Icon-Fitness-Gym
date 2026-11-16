import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DiscountType, PaymentMethod, Role, StoreOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { getDhakaEndOfDayCutoff } from '../access-control/timezone.util';
import {
  CreateStoreDiscountCodeDto,
  CreateStoreOrderDto,
  CreateStoreProductDto,
  UpdateStoreDiscountCodeDto,
  UpdateStoreProductDto,
  ValidateStoreDiscountDto,
} from './dto/store.dto';

const DEFAULT_STORE_PRODUCTS: Array<{
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  description: string;
  buyingPriceBdt: number;
  priceBdt: number;
  compareAtBdt?: number;
  stockQty: number;
  unitLabel: string;
  imageUrl: string;
  badgeText?: string;
  isFeatured: boolean;
}> = [
    {
      name: 'Icon Insulated Steel Water Bottle',
      slug: 'icon-insulated-steel-bottle-1l',
      sku: 'IFG-BTL-001',
      category: 'BOTTLES',
      brand: 'Icon Pro Gear',
      description:
        'Double-wall vacuum insulated stainless steel gym bottle with matte powder finish, wide ice mouth, and carry loop. Keeps water ice-cold through full Ashkona training sessions.',
      buyingPriceBdt: 550,
      priceBdt: 850,
      compareAtBdt: 1050,
      stockQty: 24,
      unitLabel: '1000ml (1L)',
      imageUrl: '/images/store/bottle-steel.jpg',
      badgeText: 'Bestseller',
      isFeatured: true,
    },
    {
      name: 'Pro Vortex Shaker Bottle',
      slug: 'pro-vortex-shaker-700ml',
      sku: 'IFG-BTL-002',
      category: 'BOTTLES',
      brand: 'Icon Pro Gear',
      description:
        'BPA-free leak-proof protein & pre-workout shaker featuring a surgical-grade mixing whisk ball and measurement scale up to 700ml.',
      buyingPriceBdt: 290,
      priceBdt: 480,
      compareAtBdt: 600,
      stockQty: 30,
      unitLabel: '700ml Shaker',
      imageUrl: '/images/store/bottle-shaker.jpg',
      badgeText: 'Essential',
      isFeatured: false,
    },
    {
      name: 'Pro Grip Padded Gym Gloves',
      slug: 'pro-grip-padded-gym-gloves',
      sku: 'IFG-GLV-001',
      category: 'GLOVES',
      brand: 'IronGrip',
      description:
        'Heavy-duty breathable microfiber training gloves with anti-slip silicone palm padding and dual-wrap wrist stabilizer velcro straps for barbells and dumbbells.',
      buyingPriceBdt: 600,
      priceBdt: 950,
      compareAtBdt: 1150,
      stockQty: 18,
      unitLabel: '1 Pair (M / L / XL)',
      imageUrl: '/images/store/gym-gloves.jpg',
      badgeText: 'Top Rated',
      isFeatured: true,
    },
    {
      name: '10mm Leather Powerlifting Belt',
      slug: 'leather-powerlifting-belt-10mm',
      sku: 'IFG-BLT-001',
      category: 'BELTS',
      brand: 'IronStrength',
      description:
        'Competition-grade 10mm reinforced suede leather lifting belt engineered for maximum intra-abdominal bracing on heavy squats, deadlifts, and overhead presses.',
      buyingPriceBdt: 1950,
      priceBdt: 2850,
      compareAtBdt: 3300,
      stockQty: 10,
      unitLabel: '10mm Heavy Gauge',
      imageUrl: '/images/store/lifting-belt.jpg',
      badgeText: 'Pro Gear',
      isFeatured: true,
    },
    {
      name: 'Gold Standard Whey Isolate Protein',
      slug: 'gold-standard-whey-isolate-2lbs',
      sku: 'IFG-SUP-001',
      category: 'SUPPLEMENTS',
      brand: 'Optimum Fuel',
      description:
        'Authentic fast-absorbing whey protein isolate delivering 24g ultra-pure protein, 5.5g BCAAs, and minimal sugar per scoop for rapid post-workout recovery.',
      buyingPriceBdt: 5200,
      priceBdt: 6400,
      compareAtBdt: 6900,
      stockQty: 12,
      unitLabel: '2 lbs (907g)',
      imageUrl: '/images/store/whey-protein.jpg',
      badgeText: 'Authentic',
      isFeatured: true,
    },
    {
      name: 'Micronized Creatine Monohydrate',
      slug: 'micronized-creatine-300g',
      sku: 'IFG-SUP-002',
      category: 'SUPPLEMENTS',
      brand: 'PureLab Nutrition',
      description:
        '100% pure unflavored micronized creatine monohydrate (5g per serving) to boost explosive strength, power output, and muscular endurance.',
      buyingPriceBdt: 1600,
      priceBdt: 2200,
      stockQty: 15,
      unitLabel: '300g (60 Servings)',
      imageUrl: '/images/store/creatine-300g.jpg',
      badgeText: 'Clean Formula',
      isFeatured: false,
    },
    {
      name: 'Heavy Cotton Lifting Straps & Wrist Wraps',
      slug: 'lifting-straps-wrist-wraps-combo',
      sku: 'IFG-ACC-001',
      category: 'ACCESSORIES',
      brand: 'Icon Pro Gear',
      description:
        'Padded cotton figure-8 / loop lifting straps paired with rigid thumb-loop wrist wraps to lock in grip on heavy rows, pull-ups, and bench press sets.',
      buyingPriceBdt: 380,
      priceBdt: 650,
      compareAtBdt: 800,
      stockQty: 22,
      unitLabel: '1 Combo Pair',
      imageUrl: '/images/store/straps-wraps.jpg',
      isFeatured: false,
    },
    {
      name: 'Icon Athletic Dry-Fit Training Tee',
      slug: 'icon-athletic-dryfit-tee',
      sku: 'IFG-APR-001',
      category: 'APPAREL',
      brand: 'Icon Apparel',
      description:
        'Sweat-wicking four-way stretch athletic performance t-shirt in obsidian black with signature lime trim designed for high-intensity conditioning.',
      buyingPriceBdt: 480,
      priceBdt: 790,
      stockQty: 20,
      unitLabel: 'Sizes M / L / XL',
      imageUrl: '/images/store/dryfit-tee.jpg',
      badgeText: 'New Arrival',
      isFeatured: false,
    },
  ];

@Injectable()
export class StoreService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  async onModuleInit() {
    try {
      const count = await this.prisma.storeProduct.count();
      if (count === 0) {
        await this.prisma.storeProduct.createMany({
          data: DEFAULT_STORE_PRODUCTS.map((p) => ({
            ...p,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      } else {
        // Backfill default studio product images (and heal legacy .png paths) + default cost prices
        for (const item of DEFAULT_STORE_PRODUCTS) {
          const legacyPngUrl = item.imageUrl.replace(/\.jpg$/i, '.png');
          await this.prisma.storeProduct.updateMany({
            where: {
              sku: item.sku,
              OR: [{ imageUrl: null }, { imageUrl: legacyPngUrl }],
            },
            data: { imageUrl: item.imageUrl },
          });
          await this.prisma.storeProduct.updateMany({
            where: { sku: item.sku, buyingPriceBdt: null },
            data: { buyingPriceBdt: item.buyingPriceBdt },
          });
        }
      }
    } catch {
      // Non-fatal if DB schema hasn't pushed yet during isolated unit test boot
    }
  }

  private slugify(text: string): string {
    const base = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${base || 'product'}-${suffix}`;
  }

  private sanitizeImageUrl(url?: string | null): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (
      /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) &&
      trimmed.length <= 4_000_000
    ) {
      return trimmed;
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed.slice(0, 1024);
    }
    return undefined;
  }

  private readonly publicProductSelect = {
    id: true,
    name: true,
    slug: true,
    sku: true,
    category: true,
    brand: true,
    description: true,
    priceBdt: true,
    compareAtBdt: true,
    stockQty: true,
    unitLabel: true,
    imageUrl: true,
    badgeText: true,
    isFeatured: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  private normalizeCategory(raw?: string | null): string {
    const cleaned = String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    return cleaned || 'ACCESSORIES';
  }

  async findPublicProducts(params: {
    category?: string;
    search?: string;
  }) {
    const where: Record<string, any> = { isActive: true };
    if (params.category) {
      where.category = this.normalizeCategory(params.category);
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Public storefront exposes selling prices & stock, NEVER internal buyingPriceBdt
    return this.prisma.storeProduct.findMany({
      where,
      select: this.publicProductSelect,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findPublicProductBySlug(slugOrId: string) {
    const key = (slugOrId || '').trim();
    if (!key) {
      throw new NotFoundException('Store product not found.');
    }

    const product = await this.prisma.storeProduct.findFirst({
      where: {
        isActive: true,
        OR: [{ slug: key }, { id: key }],
      },
      select: this.publicProductSelect,
    });

    if (!product) {
      throw new NotFoundException('Store product not found or unavailable.');
    }

    const sameCategory = await this.prisma.storeProduct.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        category: product.category,
      },
      select: this.publicProductSelect,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: 4,
    });

    let relatedProducts = sameCategory;
    if (relatedProducts.length < 4) {
      const excludeIds = [product.id, ...relatedProducts.map((p) => p.id)];
      const extra = await this.prisma.storeProduct.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeIds },
        },
        select: this.publicProductSelect,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 4 - relatedProducts.length,
      });
      relatedProducts = [...relatedProducts, ...extra];
    }

    return { product, relatedProducts };
  }

  async findAllAdmin(params: {
    category?: string;
    search?: string;
  }) {
    const where: Record<string, any> = {};
    if (params.category) {
      where.category = this.normalizeCategory(params.category);
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, activeOrders] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.storeOrder.findMany({
        where: { status: { not: StoreOrderStatus.CANCELLED } },
        include: { items: true },
      }),
    ]);

    const totalInventoryValueBdt = items
      .filter((p) => p.isActive)
      .reduce((sum, p) => sum + Number(p.priceBdt || 0) * p.stockQty, 0);

    const totalInventoryCostBdt = items
      .filter((p) => p.isActive)
      .reduce((sum, p) => sum + Number(p.buyingPriceBdt || 0) * p.stockQty, 0);

    let realizedStoreRevenueBdt = 0;
    let realizedStoreProfitBdt = 0;
    for (const order of activeOrders) {
      realizedStoreRevenueBdt += Number(order.totalAmountBdt || 0);
      const orderCostBdt = order.items.reduce(
        (sum, item) => sum + Number(item.unitCostBdt || 0) * item.quantity,
        0,
      );
      realizedStoreProfitBdt += Number(order.totalAmountBdt || 0) - orderCostBdt;
    }

    const summary = {
      totalProducts: items.length,
      activeProducts: items.filter((p) => p.isActive).length,
      lowStockCount: items.filter((p) => p.isActive && p.stockQty <= 5).length,
      outOfStockCount: items.filter((p) => p.isActive && p.stockQty === 0).length,
      totalInventoryValueBdt,
      totalInventoryCostBdt,
      potentialInventoryProfitBdt: totalInventoryValueBdt - totalInventoryCostBdt,
      realizedStoreRevenueBdt,
      realizedStoreProfitBdt,
    };

    return { items, summary };
  }

  async createProduct(actor: AuthenticatedUser, dto: CreateStoreProductDto) {
    const safeImageUrl = this.sanitizeImageUrl(dto.imageUrl);
    const product = await this.prisma.storeProduct.create({
      data: {
        name: dto.name.trim(),
        slug: this.slugify(dto.name),
        sku: dto.sku?.trim() || undefined,
        category: this.normalizeCategory(dto.category),
        brand: dto.brand?.trim() || 'Icon Fitness Gear',
        description: dto.description.trim(),
        buyingPriceBdt: dto.buyingPriceBdt ?? null,
        priceBdt: dto.priceBdt,
        compareAtBdt: dto.compareAtBdt ?? null,
        stockQty: dto.stockQty,
        unitLabel: dto.unitLabel?.trim() || '1 pc',
        imageUrl: safeImageUrl ?? null,
        badgeText: dto.badgeText?.trim() || null,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_PRODUCT_CREATED',
      entityType: 'StoreProduct',
      entityId: product.id,
      summary: `Added store item "${product.name}" (${product.category}) at ৳${product.priceBdt}`,
    });

    return product;
  }

  async updateProduct(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateStoreProductDto,
  ) {
    const existing = await this.prisma.storeProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Store product not found.');
    }

    const safeImageUrl =
      dto.imageUrl === ''
        ? null
        : dto.imageUrl !== undefined
          ? this.sanitizeImageUrl(dto.imageUrl)
          : undefined;

    const updated = await this.prisma.storeProduct.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.category !== undefined
          ? { category: this.normalizeCategory(dto.category) }
          : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.priceBdt !== undefined ? { priceBdt: dto.priceBdt } : {}),
        ...(dto.buyingPriceBdt !== undefined
          ? { buyingPriceBdt: dto.buyingPriceBdt }
          : {}),
        ...(dto.compareAtBdt !== undefined
          ? { compareAtBdt: dto.compareAtBdt }
          : {}),
        ...(dto.stockQty !== undefined ? { stockQty: dto.stockQty } : {}),
        ...(dto.unitLabel !== undefined
          ? { unitLabel: dto.unitLabel.trim() }
          : {}),
        ...(safeImageUrl !== undefined ? { imageUrl: safeImageUrl } : {}),
        ...(dto.badgeText !== undefined
          ? { badgeText: dto.badgeText.trim() || null }
          : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_PRODUCT_UPDATED',
      entityType: 'StoreProduct',
      entityId: updated.id,
      summary: `Updated store item "${updated.name}" (Stock: ${updated.stockQty}, Price: ৳${updated.priceBdt})`,
    });

    return updated;
  }

  private assertAdminOnly(actor: AuthenticatedUser, actionLabel: string) {
    if (!([Role.SUPER_ADMIN, Role.ADMIN] as Role[]).includes(actor.role)) {
      throw new ForbiddenException(
        `Only ADMIN or SUPER_ADMIN can ${actionLabel}.`,
      );
    }
  }

  private normalizePhoneDigits(phone?: string | null): string {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  private maskPhone(phone?: string | null): string {
    const str = String(phone || '').trim();
    if (str.length < 7) return str;
    return `${str.slice(0, 5)}****${str.slice(-3)}`;
  }

  private maskRef(ref?: string | null): string | null {
    const str = String(ref || '').trim();
    if (!str) return null;
    if (str.length <= 4) return '****';
    return `****${str.slice(-4)}`;
  }

  async removeProduct(actor: AuthenticatedUser, id: string) {
    this.assertAdminOnly(actor, 'remove or archive store products');
    const existing = await this.prisma.storeProduct.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Store product not found.');
    }

    if (existing._count.orderItems > 0) {
      const archived = await this.prisma.storeProduct.update({
        where: { id },
        data: { isActive: false },
      });
      await this.auditLogsService.log({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: 'STORE_PRODUCT_ARCHIVED',
        entityType: 'StoreProduct',
        entityId: id,
        summary: `Archived store item "${existing.name}" because it has past orders`,
      });
      return { archived: true, product: archived };
    }

    await this.prisma.storeProduct.delete({ where: { id } });
    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_PRODUCT_DELETED',
      entityType: 'StoreProduct',
      entityId: id,
      summary: `Deleted store item "${existing.name}"`,
    });
    return { deleted: true };
  }

  private normalizePromoCode(raw?: string | null): string {
    return String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
  }

  private generatePromoCode(discountType: DiscountType, discountValue: number): string {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const valPart = Math.round(discountValue);
    return discountType === DiscountType.PERCENTAGE
      ? `IFG${valPart}-${suffix}`
      : `IFG${valPart}TK-${suffix}`;
  }

  private async evaluateDiscountCode(
    client: Pick<PrismaService, 'storeDiscountCode'>,
    rawCode: string,
    subtotalBdt: number,
  ) {
    const normalized = this.normalizePromoCode(rawCode);
    if (!normalized) {
      throw new BadRequestException('Please enter a valid promo code.');
    }

    const promo = await client.storeDiscountCode.findUnique({
      where: { code: normalized },
    });

    if (!promo) {
      throw new BadRequestException(`Promo code "${normalized}" was not found.`);
    }
    if (!promo.isActive) {
      throw new BadRequestException(`Promo code "${normalized}" is currently paused.`);
    }

    const now = new Date();
    if (now < promo.validFrom) {
      throw new BadRequestException(`Promo code "${normalized}" is not active yet.`);
    }
    if (now > promo.expiresAt) {
      throw new BadRequestException(`Promo code "${normalized}" has expired.`);
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException(
        `Promo code "${normalized}" has reached its maximum usage limit.`,
      );
    }

    const minOrder = promo.minOrderBdt ? Number(promo.minOrderBdt) : 0;
    if (minOrder > 0 && subtotalBdt < minOrder) {
      throw new BadRequestException(
        `Minimum order of ৳${minOrder.toLocaleString()} required to apply "${normalized}".`,
      );
    }

    let discountAmountBdt = 0;
    const val = Number(promo.discountValue);
    if (promo.discountType === DiscountType.PERCENTAGE) {
      discountAmountBdt = Math.round((subtotalBdt * val) / 100);
      if (promo.maxDiscountBdt !== null && promo.maxDiscountBdt !== undefined) {
        discountAmountBdt = Math.min(discountAmountBdt, Number(promo.maxDiscountBdt));
      }
    } else {
      discountAmountBdt = Math.round(val);
    }

    discountAmountBdt = Math.max(0, Math.min(subtotalBdt, discountAmountBdt));
    const finalTotalBdt = Math.max(0, subtotalBdt - discountAmountBdt);

    return {
      promo,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: val,
      discountAmountBdt,
      finalTotalBdt,
    };
  }

  async validateDiscountCode(dto: ValidateStoreDiscountDto) {
    const result = await this.evaluateDiscountCode(
      this.prisma,
      dto.code,
      Number(dto.subtotalBdt || 0),
    );

    return {
      valid: true,
      code: result.code,
      description: result.promo.description,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountAmountBdt: result.discountAmountBdt,
      finalTotalBdt: result.finalTotalBdt,
      expiresAt: result.promo.expiresAt,
      validDays: result.promo.validDays,
    };
  }

  async findAllDiscountCodesAdmin(actor?: AuthenticatedUser) {
    if (actor) {
      this.assertAdminOnly(actor, 'view store promo codes');
    }
    const codes = await this.prisma.storeDiscountCode.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    const now = new Date();
    return codes.map((c) => {
      const isExpired = now > c.expiresAt;
      const limitReached = c.maxUses !== null && c.usedCount >= c.maxUses;
      const effectiveStatus = !c.isActive
        ? 'PAUSED'
        : isExpired
          ? 'EXPIRED'
          : limitReached
            ? 'LIMIT_REACHED'
            : 'ACTIVE';
      return {
        ...c,
        isExpired,
        limitReached,
        effectiveStatus,
      };
    });
  }

  async createDiscountCode(
    actor: AuthenticatedUser,
    dto: CreateStoreDiscountCodeDto,
  ) {
    this.assertAdminOnly(actor, 'create store promo codes');
    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      Number(dto.discountValue) > 100
    ) {
      throw new BadRequestException(
        'Percentage discount cannot exceed 100%.',
      );
    }

    const code = dto.code?.trim()
      ? this.normalizePromoCode(dto.code)
      : this.generatePromoCode(dto.discountType, dto.discountValue);

    if (code.length < 3) {
      throw new BadRequestException('Promo code must be at least 3 characters.');
    }

    const existing = await this.prisma.storeDiscountCode.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Promo code "${code}" already exists.`);
    }

    const validFrom = new Date();
    const expiresAt = new Date(
      validFrom.getTime() + Number(dto.validDays) * 24 * 60 * 60 * 1000,
    );

    const created = await this.prisma.storeDiscountCode.create({
      data: {
        code,
        description: dto.description?.trim() || null,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderBdt: dto.minOrderBdt ?? null,
        maxDiscountBdt: dto.maxDiscountBdt ?? null,
        maxUses: dto.maxUses ?? null,
        validFrom,
        validDays: dto.validDays,
        expiresAt,
        isActive: dto.isActive ?? true,
        createdByUserId: actor.id,
        createdByName: actor.fullName || actor.role,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_DISCOUNT_CODE_CREATED',
      entityType: 'StoreDiscountCode',
      entityId: created.id,
      summary: `Generated store promo code ${created.code} (${created.discountType === DiscountType.PERCENTAGE ? `${created.discountValue}%` : `৳${created.discountValue}`}, valid ${created.validDays} days)`,
    });

    return created;
  }

  async updateDiscountCode(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateStoreDiscountCodeDto,
  ) {
    this.assertAdminOnly(actor, 'update store promo codes');
    const existing = await this.prisma.storeDiscountCode.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Discount code not found.');
    }

    let nextExpiresAt = existing.expiresAt;
    let nextValidDays = existing.validDays;
    if (dto.validDays !== undefined) {
      nextValidDays = dto.validDays;
      nextExpiresAt = new Date(
        Date.now() + Number(dto.validDays) * 24 * 60 * 60 * 1000,
      );
    }

    const updated = await this.prisma.storeDiscountCode.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.maxUses !== undefined ? { maxUses: dto.maxUses } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.validDays !== undefined
          ? { validDays: nextValidDays, expiresAt: nextExpiresAt }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_DISCOUNT_CODE_UPDATED',
      entityType: 'StoreDiscountCode',
      entityId: id,
      summary: `Updated store promo code ${updated.code} (active=${updated.isActive}, validDays=${updated.validDays})`,
    });

    return updated;
  }

  async deleteDiscountCode(actor: AuthenticatedUser, id: string) {
    this.assertAdminOnly(actor, 'delete store promo codes');
    const existing = await this.prisma.storeDiscountCode.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Discount code not found.');
    }

    await this.prisma.storeDiscountCode.delete({ where: { id } });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_DISCOUNT_CODE_DELETED',
      entityType: 'StoreDiscountCode',
      entityId: id,
      summary: `Deleted store promo code ${existing.code}`,
    });

    return { deleted: true, code: existing.code };
  }

  private normalizeMemberCode(rawCode?: string | null): string {
    return String(rawCode || '')
      .trim()
      .replace(/^(?:GYM\s*)?(?:MEMBER\s*)?ID\s*[:#-]?\s*/i, '')
      .replace(/^#+\s*/, '')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  private async lookupRunningMember(
    client: Pick<PrismaService, 'memberProfile'>,
    rawCode?: string | null,
  ) {
    const cleanCode = this.normalizeMemberCode(rawCode);
    if (!cleanCode || cleanCode.length < 3) {
      return {
        verified: false,
        memberCode: cleanCode,
        reason: 'Please enter a valid Gym Member ID (e.g. IFG-2026-0001).',
      };
    }

    const now = new Date();
    const member = await client.memberProfile.findFirst({
      where: {
        memberCode: { equals: cleanCode, mode: 'insensitive' },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
            deletedAt: true,
          },
        },
        memberships: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: { endDate: 'desc' },
          take: 5,
          include: {
            plan: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!member || !member.user || member.user.deletedAt) {
      return {
        verified: false,
        memberCode: cleanCode,
        reason: `Gym ID "${cleanCode}" was not found in our database.`,
      };
    }

    if (member.user.status !== 'ACTIVE') {
      return {
        verified: false,
        memberCode: member.memberCode,
        reason: `Account for "${member.memberCode}" is currently ${member.user.status.toLowerCase()}.`,
      };
    }

    const activeMembership = (member.memberships || []).find(
      (m) => getDhakaEndOfDayCutoff(m.endDate) >= now,
    );
    if (!activeMembership) {
      return {
        verified: false,
        memberCode: member.memberCode,
        reason: `Member "${member.memberCode}" does not have an active running gym membership. Ensure your plan payment is verified by Admin before ordering without advance.`,
      };
    }

    return {
      verified: true,
      memberProfileId: member.id,
      userId: member.user.id,
      memberCode: member.memberCode,
      fullName: member.user.fullName,
      phone: member.user.phone || '',
      email: member.user.email || '',
      address: member.address || '',
      planName: activeMembership.plan?.name || 'Active Membership',
      validUntil: activeMembership.endDate,
    };
  }

  async verifyRunningMemberCode(code?: string) {
    const result = await this.lookupRunningMember(this.prisma, code);
    if (!result.verified) {
      return {
        verified: false,
        memberCode: result.memberCode,
        reason:
          'Gym ID was not found or does not have an active running membership.',
      };
    }
    // Public verification endpoint NEVER exposes raw phone, email, address, or internal IDs
    return {
      verified: true,
      memberCode: result.memberCode,
      fullName: result.fullName,
      maskedPhone: this.maskPhone(result.phone),
      planName: result.planName,
      validUntil: result.validUntil,
    };
  }

  async verifyRunningMemberCodeAuthenticated(
    actor: AuthenticatedUser,
    code?: string,
  ) {
    const result = await this.lookupRunningMember(this.prisma, code);
    if (!result.verified) {
      return result;
    }

    const isStaffOrAdmin = ([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] as Role[]).includes(
      actor.role,
    );
    if (!isStaffOrAdmin && result.userId !== actor.id) {
      throw new ForbiddenException(
        'You can only verify and auto-fill your own Gym Member ID.',
      );
    }

    return {
      verified: true,
      memberCode: result.memberCode,
      fullName: result.fullName,
      phone: result.phone,
      email: result.email,
      address: result.address,
      planName: result.planName,
      validUntil: result.validUntil,
    };
  }

  async createOrder(
    dto: CreateStoreOrderDto,
    authenticatedUser?: AuthenticatedUser,
  ) {
    // Deduplicate product quantities so duplicate cart entries cannot double-bypass checks
    const requestedMap = new Map<string, number>();
    for (const item of dto.items) {
      requestedMap.set(
        item.productId,
        (requestedMap.get(item.productId) || 0) + Number(item.quantity || 1),
      );
    }

    const productIds = Array.from(requestedMap.keys());
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Verify Running Gym Student status against PostgreSQL if a Gym Member ID was provided
      const rawMemberCode = this.normalizeMemberCode(dto.memberCode);
      let isMemberVerified = false;
      let canonicalMemberCode: string | null = null;

      if (rawMemberCode) {
        const verification = await this.lookupRunningMember(tx, rawMemberCode);
        if (!verification.verified) {
          throw new BadRequestException(
            verification.reason ||
            'Gym Member ID could not be verified in database.',
          );
        }
        const isPrivilegedActor =
          authenticatedUser &&
          ([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] as Role[]).includes(
            authenticatedUser.role,
          );
        const isOwnerUser =
          authenticatedUser && verification.userId === authenticatedUser.id;
        if (!isPrivilegedActor && !isOwnerUser) {
          const suppliedPhone = this.normalizePhoneDigits(dto.customerPhone);
          const registeredPhone = this.normalizePhoneDigits(verification.phone);
          if (
            !suppliedPhone ||
            !registeredPhone ||
            suppliedPhone !== registeredPhone
          ) {
            throw new BadRequestException(
              'Phone number must match the registered student profile for this Gym Member ID (or sign in to your member account).',
            );
          }
        }
        isMemberVerified = true;
        canonicalMemberCode = verification.memberCode;
      }

      const products = await tx.storeProduct.findMany({
        where: { id: { in: productIds }, isActive: true },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'One or more selected products are unavailable or inactive.',
        );
      }

      let subtotalOrderBdt = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        unitCostBdt: number;
        unitPriceBdt: number;
        quantity: number;
        subtotalBdt: number;
        profitBdt: number;
      }> = [];

      for (const product of products) {
        const qty = requestedMap.get(product.id) || 0;
        if (qty <= 0) {
          throw new BadRequestException(`Invalid quantity for ${product.name}.`);
        }

        // Atomic conditional stock decrement prevents concurrent overselling
        const updatedCount = await tx.storeProduct.updateMany({
          where: {
            id: product.id,
            isActive: true,
            stockQty: { gte: qty },
          },
          data: {
            stockQty: { decrement: qty },
          },
        });

        if (updatedCount.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Only ${product.stockQty} left.`,
          );
        }

        const unitPrice = Number(product.priceBdt);
        const unitCost = Number(product.buyingPriceBdt || 0);
        const subtotal = unitPrice * qty;
        const profit = subtotal - unitCost * qty;
        subtotalOrderBdt += subtotal;
        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          unitCostBdt: unitCost,
          unitPriceBdt: unitPrice,
          quantity: qty,
          subtotalBdt: subtotal,
          profitBdt: profit,
        });
      }

      let appliedCode: string | null = null;
      let discountAmountBdt = 0;
      let discountedSubtotalBdt = subtotalOrderBdt;

      if (dto.discountCode?.trim()) {
        const discountResult = await this.evaluateDiscountCode(
          tx,
          dto.discountCode,
          subtotalOrderBdt,
        );
        // Atomically claim a usage slot if maxUses limit is configured
        if (discountResult.promo.maxUses !== null) {
          const claimed = await tx.storeDiscountCode.updateMany({
            where: {
              id: discountResult.promo.id,
              isActive: true,
              usedCount: { lt: discountResult.promo.maxUses },
            },
            data: { usedCount: { increment: 1 } },
          });
          if (claimed.count === 0) {
            throw new BadRequestException(
              `Promo code "${discountResult.code}" has reached its maximum usage limit.`,
            );
          }
        } else {
          await tx.storeDiscountCode.update({
            where: { id: discountResult.promo.id },
            data: { usedCount: { increment: 1 } },
          });
        }
        appliedCode = discountResult.code;
        discountAmountBdt = discountResult.discountAmountBdt;
        discountedSubtotalBdt = discountResult.finalTotalBdt;
      }

      const fulfillmentType =
        dto.fulfillmentType === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';
      let deliveryArea: string | null = null;
      let deliveryAddress: string | null = null;
      let deliveryFeeBdt = 0;

      if (fulfillmentType === 'DELIVERY') {
        const cleanAddress = String(dto.deliveryAddress || '').trim();
        if (cleanAddress.length < 8) {
          throw new BadRequestException(
            'Please provide a complete delivery address (House, Road, Area, Thana) for online delivery.',
          );
        }
        deliveryAddress = cleanAddress;
        deliveryArea =
          dto.deliveryArea === 'OUTSIDE_DHAKA' ? 'OUTSIDE_DHAKA' : 'DHAKA_METRO';
        deliveryFeeBdt = deliveryArea === 'OUTSIDE_DHAKA' ? 150 : 80;
      }

      const finalTotalBdt = discountedSubtotalBdt + deliveryFeeBdt;

      const minRequiredAdvanceBdt = isMemberVerified
        ? 0
        : Math.min(500, finalTotalBdt);
      const requestedAdvanceBdt = Number(dto.advanceAmountBdt ?? 0);

      let advancePaidBdt = 0;
      if (!isMemberVerified && finalTotalBdt > 0) {
        if (dto.paymentMethod === PaymentMethod.CASH) {
          throw new BadRequestException(
            `Non-member orders require a minimum advance of ৳${minRequiredAdvanceBdt.toLocaleString()} via bKash, Nagad, Rocket, Bank, or Card. Only verified running gym students can order with Cash without advance.`,
          );
        }
        if (
          !Number.isFinite(requestedAdvanceBdt) ||
          requestedAdvanceBdt < minRequiredAdvanceBdt
        ) {
          throw new BadRequestException(
            `Minimum advance payment of ৳${minRequiredAdvanceBdt.toLocaleString()} is required before processing a non-member order.`,
          );
        }
        if (requestedAdvanceBdt > finalTotalBdt) {
          throw new BadRequestException(
            'Advance payment cannot exceed total payable amount.',
          );
        }
        if (
          !dto.transactionReference?.trim() ||
          dto.transactionReference.trim().length < 4
        ) {
          throw new BadRequestException(
            'Please provide a valid Payment Transaction Reference (TrxID) for your advance payment.',
          );
        }
        advancePaidBdt = Math.round(requestedAdvanceBdt);
      } else {
        advancePaidBdt = Math.min(
          finalTotalBdt,
          Math.max(0, Math.round(requestedAdvanceBdt || 0)),
        );
      }

      const count = await tx.storeOrder.count();
      const rand = Math.floor(100 + Math.random() * 900);
      const orderNumber = `IFG-ORD-${ym}-${String(count + 1).padStart(4, '0')}-${rand}`;

      return tx.storeOrder.create({
        data: {
          orderNumber,
          userId: authenticatedUser?.id || null,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone.trim(),
          customerEmail: dto.customerEmail?.trim().toLowerCase() || null,
          memberCode: canonicalMemberCode,
          isMemberVerified,
          fulfillmentType,
          deliveryArea,
          deliveryAddress,
          deliveryFeeBdt,
          advancePaidBdt,
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference?.trim() || null,
          subtotalBdt: subtotalOrderBdt,
          discountCode: appliedCode,
          discountAmountBdt,
          totalAmountBdt: finalTotalBdt,
          pickupNote: dto.pickupNote?.trim() || null,
          status: StoreOrderStatus.PENDING,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    if (authenticatedUser) {
      await this.auditLogsService.log({
        actorUserId: authenticatedUser.id,
        actorRole: authenticatedUser.role,
        action: 'STORE_ORDER_PLACED',
        entityType: 'StoreOrder',
        entityId: createdOrder.id,
        summary: `Placed gym gear order ${createdOrder.orderNumber} for ৳${createdOrder.totalAmountBdt}${createdOrder.discountCode ? ` (Promo ${createdOrder.discountCode}: -৳${createdOrder.discountAmountBdt})` : ''}`,
      });
    }

    // Expose order totals and selling prices, keeping cost/profit internal to admin
    return {
      id: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      customerName: createdOrder.customerName,
      customerPhone: createdOrder.customerPhone,
      memberCode: createdOrder.memberCode,
      paymentMethod: createdOrder.paymentMethod,
      transactionReference: createdOrder.transactionReference,
      isMemberVerified: createdOrder.isMemberVerified,
      fulfillmentType: createdOrder.fulfillmentType,
      deliveryArea: createdOrder.deliveryArea,
      deliveryAddress: createdOrder.deliveryAddress,
      deliveryFeeBdt: createdOrder.deliveryFeeBdt,
      advancePaidBdt: createdOrder.advancePaidBdt,
      pickupNote: createdOrder.pickupNote,
      subtotalBdt: createdOrder.subtotalBdt,
      discountCode: createdOrder.discountCode,
      discountAmountBdt: createdOrder.discountAmountBdt,
      totalAmountBdt: createdOrder.totalAmountBdt,
      status: createdOrder.status,
      createdAt: createdOrder.createdAt,
      items: createdOrder.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPriceBdt: item.unitPriceBdt,
        quantity: item.quantity,
        subtotalBdt: item.subtotalBdt,
      })),
    };
  }

  private computeSlipNumber(orderNumber: string, status: StoreOrderStatus): string | null {
    if (status !== StoreOrderStatus.COMPLETED) return null;
    return orderNumber.startsWith('IFG-ORD-')
      ? orderNumber.replace('IFG-ORD-', 'IFG-SLIP-')
      : `IFG-SLIP-${orderNumber}`;
  }

  private async mapProcessors(
    userIds: Array<string | null | undefined>,
  ): Promise<Map<string, { id: string; fullName: string; role: string }>> {
    const uniqueIds = Array.from(
      new Set(userIds.filter((id): id is string => Boolean(id))),
    );
    if (uniqueIds.length === 0) return new Map();
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, fullName: true, role: true },
    });
    return new Map(users.map((u) => [u.id, u]));
  }

  async findMyOrders(userId: string) {
    const orders = await this.prisma.storeOrder.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                slug: true,
                unitLabel: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const processorMap = await this.mapProcessors(
      orders.map((o) => o.processedByUserId),
    );

    return orders.map((ord) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      slipNumber: this.computeSlipNumber(ord.orderNumber, ord.status),
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      customerEmail: ord.customerEmail,
      memberCode: ord.memberCode,
      isMemberVerified: ord.isMemberVerified,
      fulfillmentType: ord.fulfillmentType,
      deliveryArea: ord.deliveryArea,
      deliveryAddress: ord.deliveryAddress,
      deliveryFeeBdt: ord.deliveryFeeBdt ?? 0,
      advancePaidBdt: ord.advancePaidBdt ?? 0,
      paymentMethod: ord.paymentMethod,
      transactionReference: ord.transactionReference,
      pickupNote: ord.pickupNote,
      subtotalBdt: ord.subtotalBdt ?? ord.totalAmountBdt,
      discountCode: ord.discountCode,
      discountAmountBdt: ord.discountAmountBdt ?? 0,
      totalAmountBdt: ord.totalAmountBdt,
      status: ord.status,
      processedByUser: ord.processedByUserId
        ? processorMap.get(ord.processedByUserId) || null
        : null,
      createdAt: ord.createdAt,
      updatedAt: ord.updatedAt,
      items: ord.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPriceBdt: item.unitPriceBdt,
        quantity: item.quantity,
        subtotalBdt: item.subtotalBdt,
        product: item.product,
      })),
    }));
  }

  private serializeAdminOrder(
    ord: any,
    processorMap: Map<string, { id: string; fullName: string; role: string }>,
  ) {
    const totalCostBdt = (ord.items || []).reduce(
      (sum: number, item: any) => sum + Number(item.unitCostBdt || 0) * item.quantity,
      0,
    );
    const profitBdt =
      Number(ord.totalAmountBdt || 0) -
      Number(ord.deliveryFeeBdt || 0) -
      totalCostBdt;
    return {
      ...ord,
      slipNumber: this.computeSlipNumber(ord.orderNumber, ord.status),
      processedByUser: ord.processedByUserId
        ? processorMap.get(ord.processedByUserId) || null
        : null,
      totalCostBdt,
      profitBdt,
    };
  }

  async verifyOrderByCode(rawCode: string) {
    const clean = String(rawCode || '').trim().toUpperCase();
    if (!clean) {
      throw new NotFoundException('Order or slip reference code is required.');
    }
    const altOrderNumber = clean.startsWith('IFG-SLIP-')
      ? clean.replace('IFG-SLIP-', 'IFG-ORD-')
      : clean;

    const ord = await this.prisma.storeOrder.findFirst({
      where: {
        OR: [{ orderNumber: clean }, { orderNumber: altOrderNumber }],
      },
      include: {
        items: {
          include: {
            product: {
              select: { sku: true, unitLabel: true },
            },
          },
        },
      },
    });

    if (!ord) {
      throw new NotFoundException(`Order / Slip "${clean}" was not found.`);
    }

    const processorMap = await this.mapProcessors([ord.processedByUserId]);
    const phoneDigits = String(ord.customerPhone || '');
    const maskedPhone =
      phoneDigits.length >= 7
        ? `${phoneDigits.slice(0, 5)}****${phoneDigits.slice(-3)}`
        : phoneDigits;
    const totalAmountBdt = Number(ord.totalAmountBdt || 0);
    const advancePaidBdt = Number(ord.advancePaidBdt || 0);
    const balanceDueBdt =
      ord.status === StoreOrderStatus.COMPLETED
        ? 0
        : Math.max(0, totalAmountBdt - advancePaidBdt);

    return {
      verified: true,
      orderNumber: ord.orderNumber,
      slipNumber: this.computeSlipNumber(ord.orderNumber, ord.status),
      status: ord.status,
      isMemberVerified: ord.isMemberVerified,
      memberCode: ord.memberCode,
      customerName: ord.customerName,
      maskedPhone,
      fulfillmentType: ord.fulfillmentType,
      deliveryArea: ord.deliveryArea,
      paymentMethod: ord.paymentMethod,
      transactionReference: this.maskRef(ord.transactionReference),
      subtotalBdt: Number(ord.subtotalBdt ?? ord.totalAmountBdt),
      discountCode: ord.discountCode,
      discountAmountBdt: Number(ord.discountAmountBdt || 0),
      deliveryFeeBdt: Number(ord.deliveryFeeBdt || 0),
      totalAmountBdt,
      advancePaidBdt,
      balanceDueBdt,
      processedByUser: ord.processedByUserId
        ? processorMap.get(ord.processedByUserId) || null
        : null,
      createdAt: ord.createdAt,
      updatedAt: ord.updatedAt,
      items: ord.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        unitPriceBdt: Number(item.unitPriceBdt),
        quantity: item.quantity,
        subtotalBdt: Number(item.subtotalBdt),
        unitLabel: item.product?.unitLabel || null,
      })),
    };
  }

  async findAllOrdersAdmin(params: {
    status?: StoreOrderStatus;
    search?: string;
  }) {
    const where: Record<string, any> = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { memberCode: { contains: q, mode: 'insensitive' } },
        { transactionReference: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orders = await this.prisma.storeOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                slug: true,
                unitLabel: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const processorMap = await this.mapProcessors(
      orders.map((o) => o.processedByUserId),
    );

    return orders.map((ord) => this.serializeAdminOrder(ord, processorMap));
  }

  async findOrderByIdAdmin(orderId: string) {
    const ord = await this.prisma.storeOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                slug: true,
                unitLabel: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
    if (!ord) {
      throw new NotFoundException('Store order not found.');
    }
    const processorMap = await this.mapProcessors([ord.processedByUserId]);
    return this.serializeAdminOrder(ord, processorMap);
  }

  async updateOrderStatus(
    actor: AuthenticatedUser,
    orderId: string,
    status: StoreOrderStatus,
  ) {
    const existing = await this.prisma.storeOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException('Store order not found.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Restore stock if cancelling a previously active order
      if (
        status === StoreOrderStatus.CANCELLED &&
        existing.status !== StoreOrderStatus.CANCELLED
      ) {
        for (const item of existing.items) {
          await tx.storeProduct.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }

      // Deduct stock again if reopening a previously cancelled order
      if (
        existing.status === StoreOrderStatus.CANCELLED &&
        status !== StoreOrderStatus.CANCELLED
      ) {
        for (const item of existing.items) {
          const dec = await tx.storeProduct.updateMany({
            where: {
              id: item.productId,
              stockQty: { gte: item.quantity },
            },
            data: { stockQty: { decrement: item.quantity } },
          });
          if (dec.count === 0) {
            throw new BadRequestException(
              `Insufficient stock to reopen order for "${item.productName}".`,
            );
          }
        }
      }

      return tx.storeOrder.update({
        where: { id: orderId },
        data: {
          status,
          processedByUserId: actor.id,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  sku: true,
                  slug: true,
                  unitLabel: true,
                  category: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'STORE_ORDER_STATUS_UPDATED',
      entityType: 'StoreOrder',
      entityId: orderId,
      summary: `Updated store order ${existing.orderNumber} status to ${status}`,
    });

    const processorMap = new Map([
      [
        actor.id,
        { id: actor.id, fullName: actor.fullName || 'Desk Staff', role: actor.role },
      ],
    ]);
    return this.serializeAdminOrder(updated, processorMap);
  }
}
