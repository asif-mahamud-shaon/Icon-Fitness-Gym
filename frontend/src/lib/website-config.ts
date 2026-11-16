import { GymSettings, WebsiteConfig } from '@/types';

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  header: {
    brandTitle: 'ICON FITNESS GYM',
    brandSubtitle: 'ASHKONA • DHAKA',
    showPromoBar: false,
    promoText:
      'New Ashkona Biometric Floor & Ladies-Only Zone Open — Claim a Free Gym Tour!',
    promoCtaLabel: 'Join Online',
    promoCtaHref: '/register',
    showPortalButton: true,
    showThemeToggle: true,
    ctaPrimaryLabel: 'Sign In',
    ctaSecondaryLabel: 'Join Now',
    navPins: [
      { id: 'home', label: 'Home', href: '/', placement: 'HEADER', highlight: false },
      {
        id: 'membership',
        label: 'Membership',
        href: '/membership',
        placement: 'HEADER',
        highlight: false,
      },
      {
        id: 'facilities',
        label: 'Facilities & Zones',
        href: '/facilities',
        placement: 'HEADER',
        highlight: false,
      },
      { id: 'store', label: 'Gear Store', href: '/store', placement: 'HEADER', highlight: false },
      { id: 'contact', label: 'Contact', href: '/contact', placement: 'HEADER', highlight: false },
      {
        id: 'why-icon',
        label: 'Why Exercise at Icon',
        href: '/why-icon',
        placement: 'EXPLORE',
        highlight: true,
      },
      {
        id: 'programs',
        label: 'Workout Programs',
        href: '/programs',
        placement: 'EXPLORE',
        highlight: false,
      },
      {
        id: 'schedule',
        label: 'Class Schedule',
        href: '/schedule',
        placement: 'EXPLORE',
        highlight: false,
      },
      {
        id: 'trainers',
        label: 'Certified Trainers',
        href: '/trainers',
        placement: 'EXPLORE',
        highlight: false,
      },
      {
        id: 'gallery',
        label: 'Facility Gallery',
        href: '/gallery',
        placement: 'EXPLORE',
        highlight: false,
      },
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
  zoneImages: {},
  zoneOverrides: {},
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
    ladiesNote:
      'Exclusively for Female Members Only. Supervised on-floor by our certified Female Trainer.',
    afternoonBadge: 'SAT–THU • AFTERNOON & NIGHT',
    afternoonTime: '03:30 PM – 11:00 PM',
    afternoonNote:
      'Open to All Members (Male & Female) for strength, cardio, and group training.',
    fridayBadge: 'FRIDAY SCHEDULE',
    fridayTime: '05:00 PM – 11:00 PM',
    fridayNote:
      'Friday evening session open to All Members (Male & Female) from 5:00 PM to 11:00 PM.',
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
    bottomBadgeText: 'Strength • Conditioning • Ladies & General Sessions',
  },
};

export function resolveWebsiteConfig(settings?: GymSettings | null): WebsiteConfig {
  const raw = settings?.websiteConfigJson;
  if (!raw) return DEFAULT_WEBSITE_CONFIG;
  return {
    header: {
      ...DEFAULT_WEBSITE_CONFIG.header,
      ...(raw.header || {}),
      navPins:
        Array.isArray(raw.header?.navPins) && raw.header.navPins.length > 0
          ? raw.header.navPins
          : DEFAULT_WEBSITE_CONFIG.header.navPins,
    },
    hero: {
      ...DEFAULT_WEBSITE_CONFIG.hero,
      ...(raw.hero || {}),
    },
    heroSlides:
      Array.isArray(raw.heroSlides) && raw.heroSlides.length > 0
        ? raw.heroSlides
        : DEFAULT_WEBSITE_CONFIG.heroSlides,
    showcaseStream:
      Array.isArray(raw.showcaseStream) && raw.showcaseStream.length > 0
        ? raw.showcaseStream
        : DEFAULT_WEBSITE_CONFIG.showcaseStream,
    zoneImages: {
      ...(DEFAULT_WEBSITE_CONFIG.zoneImages || {}),
      ...(raw.zoneImages || {}),
    },
    zoneOverrides: {
      ...(DEFAULT_WEBSITE_CONFIG.zoneOverrides || {}),
      ...(raw.zoneOverrides || {}),
    },
    sectionHeadings: {
      ...(DEFAULT_WEBSITE_CONFIG.sectionHeadings || {}),
      ...(raw.sectionHeadings || {}),
    },
    advantagePillars:
      Array.isArray(raw.advantagePillars) && raw.advantagePillars.length > 0
        ? raw.advantagePillars
        : DEFAULT_WEBSITE_CONFIG.advantagePillars,
    transformationBanner: {
      ...DEFAULT_WEBSITE_CONFIG.transformationBanner!,
      ...(raw.transformationBanner || {}),
    },
    whyIconPage: {
      ...DEFAULT_WEBSITE_CONFIG.whyIconPage!,
      ...(raw.whyIconPage || {}),
    },
    sections: {
      ...DEFAULT_WEBSITE_CONFIG.sections,
      ...(raw.sections || {}),
    },
    footer: {
      ...DEFAULT_WEBSITE_CONFIG.footer,
      ...(raw.footer || {}),
    },
  };
}
