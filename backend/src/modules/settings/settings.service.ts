import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

export const DEFAULT_WEBSITE_CONFIG = {
  header: {
    brandTitle: 'ICON FITNESS GYM',
    brandSubtitle: 'ASHKONA • DHAKA',
    showPromoBar: false,
    promoText: 'New Ashkona Biometric Floor & Ladies-Only Zone Open — Claim a Free Gym Tour!',
    promoCtaLabel: 'Join Online',
    promoCtaHref: '/register',
    showPortalButton: true,
    showThemeToggle: true,
    ctaPrimaryLabel: 'Sign In',
    ctaSecondaryLabel: 'Join Now',
    navPins: [
      { id: 'home', label: 'Home', href: '/', placement: 'HEADER', highlight: false },
      { id: 'membership', label: 'Membership', href: '/membership', placement: 'HEADER', highlight: false },
      { id: 'facilities', label: 'Facilities & Zones', href: '/facilities', placement: 'HEADER', highlight: false },
      { id: 'store', label: 'Gear Store', href: '/store', placement: 'HEADER', highlight: false },
      { id: 'contact', label: 'Contact', href: '/contact', placement: 'HEADER', highlight: false },
      { id: 'why-icon', label: 'Why Exercise at Icon', href: '/why-icon', placement: 'EXPLORE', highlight: true },
      { id: 'programs', label: 'Workout Programs', href: '/programs', placement: 'EXPLORE', highlight: false },
      { id: 'schedule', label: 'Class Schedule', href: '/schedule', placement: 'EXPLORE', highlight: false },
      { id: 'trainers', label: 'Certified Trainers', href: '/trainers', placement: 'EXPLORE', highlight: false },
      { id: 'gallery', label: 'Facility Gallery', href: '/gallery', placement: 'EXPLORE', highlight: false },
      { id: 'about', label: 'About Gym', href: '/about', placement: 'EXPLORE', highlight: false },
    ],
  },
  hero: {
    badge: 'ICON FITNESS GYM • ASHKONA, DHAKA',
    headlineLine1: 'ENGINEERED FOR',
    headlineAccent: 'PURE STRENGTH',
    headlineLine2: '& PERFORMANCE.',
    subtitle:
      'Dhaka’s premier strength and conditioning club in Ashkona. Commercial biomechanics equipment, dedicated Ladies-only daily sessions, certified coaches, and touchless smart access.',
    primaryCtaLabel: 'Join Icon Fitness',
    primaryCtaHref: '/register',
    secondaryCtaLabel: '',
    secondaryCtaHref: '/membership',
  },
  heroSlides: [
    {
      id: 'panel-01',
      slug: 'free-weights-barbell-bay',
      num: '01',
      shortLabel: 'STRENGTH FLOOR',
      badge: 'HEAVY IRON ZONE',
      title: 'Pro Strength & Free-Weight Arena',
      subtitle:
        'Competition power racks, calibrated Olympic plates & full commercial dumbbell lines up to 50kg.',
      statLabel: '45+ Stations',
      image:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=960&q=75',
    },
    {
      id: 'panel-02',
      slug: 'dedicated-ladies-studio',
      num: '02',
      shortLabel: 'LADIES SESSION',
      badge: 'SAT–THU • 1:00 PM – 3:30 PM',
      title: 'Dedicated Ladies-Only Window',
      subtitle:
        '100% private female training slot supervised on-floor by our certified Female Coach.',
      statLabel: 'Female Coach On-Floor',
      image:
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=960&q=75',
    },
    {
      id: 'panel-03',
      slug: 'cardio-endurance-deck',
      num: '03',
      shortLabel: 'CARDIO & TURF',
      badge: 'ATHLETIC CONDITIONING',
      title: 'Functional Sled Turf & Cardio Deck',
      subtitle:
        'Commercial treadmills, stair climbers, battle ropes, kettlebells & explosive conditioning lanes.',
      statLabel: 'High-Output Zone',
      image:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=960&q=75',
    },
    {
      id: 'panel-04',
      slug: 'personal-training-turf',
      num: '04',
      shortLabel: 'EXPERT COACHES',
      badge: 'PERSONAL TRANSFORMATION',
      title: '1-on-1 Coaching & Custom Blueprints',
      subtitle:
        'Structured hypertrophy, fat-loss & strength programming guided by certified Dhaka trainers.',
      statLabel: 'Certified Roster',
      image:
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=960&q=75',
    },
  ],
  showcaseStream: [
    {
      slug: 'olympic-lifting-platforms',
      title: 'Olympic Lifting Platforms',
      category: 'FREE WEIGHTS',
      metric: 'Calibrated Plates & Bars',
      image:
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=640&q=75',
    },
    {
      slug: 'commercial-cardio-deck',
      title: 'Commercial Cardio Deck',
      category: 'ENDURANCE ZONE',
      metric: 'Treadmills • Ellipticals • Bikes',
      image:
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=640&q=75',
    },
    {
      slug: 'dedicated-ladies-studio',
      title: 'Dedicated Ladies Studio',
      category: '1:00 PM – 3:30 PM',
      metric: 'Female Trainer Supervised',
      image:
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=640&q=75',
    },
    {
      slug: 'pin-loaded-isolation-machines',
      title: 'Pin-Loaded Isolation Machines',
      category: 'HYPERTROPHY LAB',
      metric: 'Precision Biomechanics',
      image:
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=640&q=75',
    },
    {
      slug: 'athletic-sled-functional-turf',
      title: 'Athletic Sled & Functional Turf',
      category: 'CONDITIONING',
      metric: 'HIIT & Mobility Drills',
      image:
        'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=640&q=75',
    },
    {
      slug: 'coach-guided-barbell-sessions',
      title: 'Coach-Guided Barbell Sessions',
      category: 'EXPERT COACHING',
      metric: 'Form & Progression Tracking',
      image:
        'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=640&q=75',
    },
  ],
  zoneImages: {} as Record<string, string>,
  zoneOverrides: {} as Record<string, { name?: string; category?: string; highlight?: string; image?: string }>,
  sectionHeadings: {
    streamLabel: '● LIVE TRAINING FLOOR PICTURE STREAM',
    floorEyebrow: 'ARCHITECTURAL TRAINING ZONES',
    floorTitle: 'EXPLORE OUR TRAINING FLOOR',
    floorCtaLabel: 'View All Facilities',
    scheduleEyebrow: 'OFFICIAL OPERATING HOURS (ASIA/DHAKA)',
    scheduleTitle: 'DAILY GENERAL & LADIES-ONLY SESSION TIMINGS',
    scheduleCtaLabel: 'Full Weekly Class Schedule',
    morningBadge: 'SAT–THU • MORNING & MIDDAY',
    morningTime: '07:00 AM – 01:00 PM',
    morningNote: 'Open to All Members (Male & Female) with an active membership.',
    ladiesBadge: 'SAT–THU • ONLY FEMALE',
    ladiesTime: '01:00 PM – 03:30 PM',
    ladiesNote: 'Exclusively for Female Members Only. Supervised on-floor by our certified Female Trainer.',
    afternoonBadge: 'SAT–THU • AFTERNOON & NIGHT',
    afternoonTime: '03:30 PM – 11:00 PM',
    afternoonNote: 'Open to All Members (Male & Female) for strength, cardio, and group training.',
    fridayBadge: 'FRIDAY SCHEDULE',
    fridayTime: '05:00 PM – 11:00 PM',
    fridayNote: 'Friday evening session open to All Members (Male & Female) from 5:00 PM to 11:00 PM.',
    programsEyebrow: 'STRUCTURED TRAINING SYSTEMS',
    programsTitle: 'WORKOUT PROGRAMS',
    programsCtaLabel: 'All Workout Programs',
    trainersEyebrow: 'EXPERT COACHING ROSTER',
    trainersTitle: 'MEET OUR CERTIFIED TRAINERS',
    trainersCtaLabel: 'All Trainers',
    plansEyebrow: 'MEMBERSHIP OPTIONS',
    plansTitle: 'MEMBERSHIP PLANS',
    plansCtaLabel: 'Compare All Plans',
  },
  advantagePillars: [
    {
      num: '01 / SMART ENTRY',
      title: 'Touchless Face ID Gate',
      desc: 'Sub-second biometric verification automatically checks membership validity and session eligibility.',
      badge: 'AUTOMATED SECURITY',
    },
    {
      num: '02 / FEMALE PRIVACY',
      title: 'Dedicated Ladies Window',
      desc: '100% private daily slot (1:00 PM – 3:30 PM Sat–Thu) supervised on-floor by our certified Female Trainer.',
      badge: '100% COMFORT',
    },
    {
      num: '03 / PRO BIOMECHANICS',
      title: '45+ Commercial Stations',
      desc: 'Olympic deadlift platforms, 50kg dumbbell progression, dual cable towers, and AC cardio deck.',
      badge: 'HEAVY IRON GRADE',
    },
    {
      num: '04 / DIGITAL PORTAL',
      title: 'Live Member Dashboard',
      desc: 'Track structured workout blueprints, attendance streaks, class bookings, and instant plan renewals.',
      badge: 'CLOUD CONNECTED',
    },
  ],
  transformationBanner: {
    eyebrowBadge: 'ICON FITNESS GYM • ASHKONA, DHAKA',
    headlineLine1: 'STEP ONTO THE FLOOR.',
    headlineAccent: 'BUILD YOUR STRONGEST SELF.',
    subtitle:
      'Register online in under 60 seconds to receive your digital Member ID, unlock touchless Smart Face entry, and train with Dhaka’s premier coaching team.',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=960&q=75',
    primaryCtaLabel: 'Start Membership Registration',
    primaryCtaHref: '/register',
    secondaryCtaLabel: 'Explore All Training Zones',
    secondaryCtaHref: '/facilities',
  },
  whyIconPage: {
    heroBadge: 'THE ICON FITNESS ADVANTAGE • ASHKONA, DHAKA',
    heroTitleLine1: 'WHY EXERCISE AT',
    heroTitleAccent: 'ICON FITNESS GYM?',
    heroSubtitle:
      'Discover how calibrated commercial iron, structured coaching, exclusive ladies-only privacy hours, and smart biometric access come together for real transformations.',
    heroBannerImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85',
  },
  sections: {
    showTrainingZones: true,
    showScheduleBanner: true,
    showPrograms: true,
    showTrainers: true,
    showPlans: true,
    showWhyIcon: true,
  },
  footer: {
    brandDescription:
      'Dedicated strength, free-weight, conditioning, and personal training sanctuary serving Ashkona, Dakshinkhan, Airport Road, and Uttara in Dhaka-1230.',
    copyrightText: 'Icon Fitness Gym. All rights reserved.',
    bottomBadgeText: 'ASHKONA • DHAKA-1230',
  },
};

function sanitizeCmsHref(href: string, fallback = '/'): string {
  const trimmed = String(href || '').trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed.slice(0, 200);
  }
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) {
    return trimmed.slice(0, 200);
  }
  return fallback;
}

function mergeWebsiteConfig(raw: unknown) {
  const base = JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONFIG));
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Record<string, any>;

  if (src.header && typeof src.header === 'object') {
    base.header = {
      ...base.header,
      ...(typeof src.header.brandTitle === 'string' ? { brandTitle: src.header.brandTitle.slice(0, 60) } : {}),
      ...(typeof src.header.brandSubtitle === 'string' ? { brandSubtitle: src.header.brandSubtitle.slice(0, 60) } : {}),
      ...(typeof src.header.showPromoBar === 'boolean' ? { showPromoBar: src.header.showPromoBar } : {}),
      ...(typeof src.header.promoText === 'string' ? { promoText: src.header.promoText.slice(0, 200) } : {}),
      ...(typeof src.header.promoCtaLabel === 'string' ? { promoCtaLabel: src.header.promoCtaLabel.slice(0, 40) } : {}),
      ...(typeof src.header.promoCtaHref === 'string'
        ? { promoCtaHref: sanitizeCmsHref(src.header.promoCtaHref, '/register') }
        : {}),
      ...(typeof src.header.showPortalButton === 'boolean' ? { showPortalButton: src.header.showPortalButton } : {}),
      ...(typeof src.header.showThemeToggle === 'boolean' ? { showThemeToggle: src.header.showThemeToggle } : {}),
      ...(typeof src.header.ctaPrimaryLabel === 'string' ? { ctaPrimaryLabel: src.header.ctaPrimaryLabel.slice(0, 30) } : {}),
      ...(typeof src.header.ctaSecondaryLabel === 'string' ? { ctaSecondaryLabel: src.header.ctaSecondaryLabel.slice(0, 30) } : {}),
    };
    if (Array.isArray(src.header.navPins)) {
      base.header.navPins = src.header.navPins
        .filter((p: any) => p && typeof p.label === 'string' && typeof p.href === 'string')
        .map((p: any, idx: number) => ({
          id: typeof p.id === 'string' && p.id.trim() ? p.id.trim() : `pin-${idx + 1}`,
          label: p.label.trim().slice(0, 50),
          href: sanitizeCmsHref(p.href, '/'),
          placement: ['HEADER', 'EXPLORE', 'HIDDEN'].includes(p.placement) ? p.placement : 'HEADER',
          highlight: Boolean(p.highlight),
        }));
    }
  }

  if (src.hero && typeof src.hero === 'object') {
    base.hero = {
      ...base.hero,
      ...Object.fromEntries(
        Object.entries(src.hero).filter(([, v]) => typeof v === 'string'),
      ),
    };
  }

  if (Array.isArray(src.heroSlides) && src.heroSlides.length > 0) {
    base.heroSlides = src.heroSlides
      .filter((s: any) => s && typeof s.title === 'string')
      .map((s: any, idx: number) => ({
        id: typeof s.id === 'string' ? s.id : `panel-0${idx + 1}`,
        slug: typeof s.slug === 'string' ? s.slug : 'free-weights-barbell-bay',
        num: typeof s.num === 'string' ? s.num : `0${idx + 1}`,
        shortLabel: typeof s.shortLabel === 'string' ? s.shortLabel.slice(0, 40) : `SLIDE 0${idx + 1}`,
        badge: typeof s.badge === 'string' ? s.badge.slice(0, 60) : '',
        title: s.title.slice(0, 120),
        subtitle: typeof s.subtitle === 'string' ? s.subtitle.slice(0, 300) : '',
        statLabel: typeof s.statLabel === 'string' ? s.statLabel.slice(0, 50) : '',
        image: typeof s.image === 'string' && s.image.trim() ? s.image.trim() : base.heroSlides[idx]?.image || base.heroSlides[0].image,
      }));
  }

  if (Array.isArray(src.showcaseStream) && src.showcaseStream.length > 0) {
    base.showcaseStream = src.showcaseStream
      .filter((s: any) => s && typeof s.title === 'string')
      .map((s: any, idx: number) => ({
        slug: typeof s.slug === 'string' ? s.slug : 'free-weights-barbell-bay',
        title: s.title.slice(0, 80),
        category: typeof s.category === 'string' ? s.category.slice(0, 50) : 'TRAINING',
        metric: typeof s.metric === 'string' ? s.metric.slice(0, 80) : '',
        image: typeof s.image === 'string' && s.image.trim() ? s.image.trim() : base.showcaseStream[idx % base.showcaseStream.length].image,
      }));
  }

  if (src.zoneImages && typeof src.zoneImages === 'object') {
    base.zoneImages = Object.fromEntries(
      Object.entries(src.zoneImages).filter(
        ([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim().length > 0,
      ),
    );
  }

  if (src.zoneOverrides && typeof src.zoneOverrides === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [slug, val] of Object.entries(src.zoneOverrides)) {
      if (val && typeof val === 'object') {
        const entry = val as Record<string, any>;
        cleaned[slug] = {
          ...(typeof entry.name === 'string' && entry.name.trim() ? { name: entry.name.slice(0, 100) } : {}),
          ...(typeof entry.category === 'string' && entry.category.trim() ? { category: entry.category.slice(0, 50) } : {}),
          ...(typeof entry.highlight === 'string' && entry.highlight.trim() ? { highlight: entry.highlight.slice(0, 80) } : {}),
          ...(typeof entry.image === 'string' && entry.image.trim() ? { image: entry.image.trim() } : {}),
        };
      }
    }
    base.zoneOverrides = cleaned;
  }

  if (src.sectionHeadings && typeof src.sectionHeadings === 'object') {
    base.sectionHeadings = {
      ...base.sectionHeadings,
      ...Object.fromEntries(
        Object.entries(src.sectionHeadings).filter(([, v]) => typeof v === 'string'),
      ),
    };
  }

  if (Array.isArray(src.advantagePillars) && src.advantagePillars.length > 0) {
    base.advantagePillars = src.advantagePillars
      .filter((p: any) => p && typeof p.title === 'string')
      .map((p: any, idx: number) => ({
        num: typeof p.num === 'string' ? p.num : `0${idx + 1}`,
        badge: typeof p.badge === 'string' ? p.badge : '',
        title: p.title.slice(0, 80),
        desc: typeof p.desc === 'string' ? p.desc.slice(0, 300) : '',
      }));
  }

  if (src.transformationBanner && typeof src.transformationBanner === 'object') {
    base.transformationBanner = {
      ...base.transformationBanner,
      ...Object.fromEntries(
        Object.entries(src.transformationBanner).filter(([, v]) => typeof v === 'string'),
      ),
    };
  }

  if (src.whyIconPage && typeof src.whyIconPage === 'object') {
    base.whyIconPage = {
      ...base.whyIconPage,
      ...Object.fromEntries(
        Object.entries(src.whyIconPage).filter(([, v]) => typeof v === 'string'),
      ),
    };
  }

  if (src.sections && typeof src.sections === 'object') {
    base.sections = {
      showTrainingZones: src.sections.showTrainingZones !== false,
      showScheduleBanner: src.sections.showScheduleBanner !== false,
      showPrograms: src.sections.showPrograms !== false,
      showTrainers: src.sections.showTrainers !== false,
      showPlans: src.sections.showPlans !== false,
      showWhyIcon: src.sections.showWhyIcon !== false,
    };
  }

  if (src.footer && typeof src.footer === 'object') {
    base.footer = {
      ...base.footer,
      ...Object.fromEntries(
        Object.entries(src.footer).filter(([, v]) => typeof v === 'string'),
      ),
    };
  }

  return base;
}

@Injectable()
export class SettingsService {
  private settingsCache: { data: any; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getOrCreateSettings() {
    if (
      process.env.NODE_ENV !== 'test' &&
      this.settingsCache &&
      this.settingsCache.expiresAt > Date.now()
    ) {
      return this.settingsCache.data;
    }

    const existing = await this.prisma.gymSettings.findUnique({
      where: { singletonKey: 'DEFAULT' },
    });
    if (existing) {
      const normalized = {
        ...existing,
        websiteConfigJson: mergeWebsiteConfig(existing.websiteConfigJson),
      };
      if (process.env.NODE_ENV !== 'test') {
        this.settingsCache = {
          data: normalized,
          expiresAt: Date.now() + 15000,
        };
      }
      return normalized;
    }

    const created = await this.prisma.gymSettings.create({
      data: {
        singletonKey: 'DEFAULT',
        gymName: 'Icon Fitness Gym',
        tagline: 'Discipline. Strength. Performance in Ashkona, Dhaka.',
        description:
          'Icon Fitness Gym is a dedicated strength, conditioning, and athletic training hub located in Ashkona, Dakshinkhan, Dhaka, Bangladesh.',
        addressLine: 'Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh',
        area: 'Ashkona, Dakshinkhan',
        city: 'Dhaka',
        country: 'Bangladesh',
        phonePrimary: '[Pending Admin Configuration — Set Official Phone]',
        phoneSecondary: null,
        whatsappNumber: '[Pending Admin Configuration — Set Official WhatsApp]',
        emailOfficial: 'info@iconfitnessgym.com',
        googleMapsEmbedUrl:
          'https://www.google.com/maps?q=Ashkona,Dakshinkhan,Dhaka,Bangladesh&output=embed',
        openingHoursJson: {
          note: 'Configurable via Admin Settings. Confirm official hours before live launch.',
          saturdayToThursday: '06:00 AM – 11:00 PM (Configurable Placeholder)',
          friday: '03:00 PM – 10:00 PM (Configurable Placeholder)',
          ladiesTiming: 'Configurable in Admin Settings',
        },
        socialLinksJson: {
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          youtube: 'https://youtube.com',
        },
        policiesJson: {
          cancellationCutoffHours: 2,
          cleanShoesRequired: true,
          towelRequired: true,
          lockerPolicy: 'Day-use lockers included; padlock rental available at front desk.',
          membershipFreezePolicy:
            'Quarterly and Yearly memberships may request a freeze subject to administrative approval.',
        },
        allowSelfRegistration: true,
        requireManualApproval: false,
        bookingCutoffHoursDefault: 2,
        maxActiveBookingsMember: 5,
        currencyCode: 'BDT',
        currencySymbol: '৳',
        isUsingPlaceholderData: true,
        websiteConfigJson: DEFAULT_WEBSITE_CONFIG as unknown as Prisma.InputJsonValue,
      },
    });
    return {
      ...created,
      websiteConfigJson: mergeWebsiteConfig(created.websiteConfigJson),
    };
  }

  async updateSettings(
    actor: AuthenticatedUser,
    dto: Record<string, any>,
  ) {
    const current = await this.getOrCreateSettings();

    const updated = await this.prisma.gymSettings.update({
      where: { id: current.id },
      data: {
        ...(dto.gymName ? { gymName: dto.gymName.trim() } : {}),
        ...(dto.tagline !== undefined ? { tagline: dto.tagline } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.addressLine ? { addressLine: dto.addressLine } : {}),
        ...(dto.area ? { area: dto.area } : {}),
        ...(dto.city ? { city: dto.city } : {}),
        ...(dto.country ? { country: dto.country } : {}),
        ...(dto.phonePrimary !== undefined
          ? { phonePrimary: dto.phonePrimary }
          : {}),
        ...(dto.phoneSecondary !== undefined
          ? { phoneSecondary: dto.phoneSecondary }
          : {}),
        ...(dto.whatsappNumber !== undefined
          ? { whatsappNumber: dto.whatsappNumber }
          : {}),
        ...(dto.emailOfficial !== undefined
          ? { emailOfficial: dto.emailOfficial }
          : {}),
        ...(dto.googleMapsEmbedUrl !== undefined
          ? {
              googleMapsEmbedUrl:
                typeof dto.googleMapsEmbedUrl === 'string' &&
                /^https:\/\/[^\s"'<>]+$/i.test(dto.googleMapsEmbedUrl.trim())
                  ? dto.googleMapsEmbedUrl.trim().slice(0, 1024)
                  : current.googleMapsEmbedUrl,
            }
          : {}),
        ...(dto.openingHoursJson !== undefined
          ? { openingHoursJson: dto.openingHoursJson }
          : {}),
        ...(dto.socialLinksJson !== undefined
          ? { socialLinksJson: dto.socialLinksJson }
          : {}),
        ...(dto.policiesJson !== undefined
          ? { policiesJson: dto.policiesJson }
          : {}),
        ...(dto.allowSelfRegistration !== undefined
          ? { allowSelfRegistration: Boolean(dto.allowSelfRegistration) }
          : {}),
        ...(dto.requireManualApproval !== undefined
          ? { requireManualApproval: Boolean(dto.requireManualApproval) }
          : {}),
        ...(dto.bookingCutoffHoursDefault !== undefined
          ? {
              bookingCutoffHoursDefault: Number(dto.bookingCutoffHoursDefault),
            }
          : {}),
        ...(dto.maxActiveBookingsMember !== undefined
          ? { maxActiveBookingsMember: Number(dto.maxActiveBookingsMember) }
          : {}),
        ...(dto.isUsingPlaceholderData !== undefined
          ? { isUsingPlaceholderData: Boolean(dto.isUsingPlaceholderData) }
          : {}),
        ...(dto.websiteConfigJson !== undefined
          ? {
              websiteConfigJson: mergeWebsiteConfig(
                dto.websiteConfigJson,
              ) as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    this.settingsCache = null;

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GYM_SETTINGS_UPDATED',
      entityType: 'GymSettings',
      entityId: updated.id,
      summary: `Updated global gym settings & website CMS (${updated.gymName})`,
    });

    return {
      ...updated,
      websiteConfigJson: mergeWebsiteConfig(updated.websiteConfigJson),
    };
  }
}

