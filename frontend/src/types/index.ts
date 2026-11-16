export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER';

export type UserStatus =
  | 'ACTIVE'
  | 'PENDING_APPROVAL'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type MembershipStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'VERIFIED_PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'BANK_TRANSFER'
  | 'POS_CARD'
  | 'ONLINE_GATEWAY';

export type BookingStatus =
  | 'CONFIRMED'
  | 'ATTENDED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'WAITLISTED';

export type WorkoutGoal =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_BUILDING'
  | 'STRENGTH_TRAINING'
  | 'FITNESS_IMPROVEMENT'
  | 'BEGINNER'
  | 'BEGINNER_PROGRAM'
  | 'CUSTOM'
  | 'CUSTOM_PROGRAM';

export type WorkoutCategory = WorkoutGoal;

export type DifficultyLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'ALL_LEVELS';

export type DayOfWeek =
  | 'SATURDAY'
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY';

export type MediaType = 'IMAGE' | 'VIDEO';

export type InquiryStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'CONTACTED'
  | 'RESOLVED'
  | 'CLOSED';

export interface PaginatedResult<T> {
  items: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PermissionOverrideConfig {
  granted: string[];
  revoked: string[];
}

export interface PermissionDefinition {
  key: string;
  label: string;
  category: 'Operations' | 'Biometrics & Access' | 'Content & Website' | 'Administration';
  description: string;
  defaultRoles: Role[];
  routes: string[];
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string | null;
  role: Role;
  status: UserStatus;
  permissions?: string[];
  permissionsConfig?: PermissionOverrideConfig | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  avatarUrl?: string | null;
  role: Role;
  status: UserStatus;
  memberProfileId?: string | null;
  memberCode?: string | null;
  trainerProfileId?: string | null;
  trainerSlug?: string | null;
  permissions?: string[];
  permissionsConfig?: PermissionOverrideConfig | null;
}

export interface MemberProfile {
  id: string;
  userId: string;
  memberCode: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  fitnessGoal?: string | null;
  medicalNotes?: string | null;
  assignedTrainerId?: string | null;
  user?: User;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  code: string;
  tagline?: string | null;
  description: string;
  durationDays: number;
  durationType?: string;
  priceBdt?: number | string;
  priceAmount?: number | string | null;
  admissionFeeBdt?: number | string;
  admissionFee?: number | string | null;
  discountPercent?: number | null;
  discountBdt?: number | string | null;
  discountLabel?: string | null;
  isPriceConfigured: boolean;
  isApproved: boolean;
  currency: string;
  benefits: string[];
  eligibilityConditions?: string | null;
  eligibilityNotes?: string | null;
  renewalRules?: string | null;
  maxClassesPerWeek?: number;
  includesPersonalTrainer?: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isPublic?: boolean;
  sortOrder: number;
}

export interface Membership {
  id: string;
  memberProfileId: string;
  membershipPlanId: string;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  notes?: string | null;
  memberProfile?: MemberProfile;
  membershipPlan?: MembershipPlan;
}

export interface PaymentEditSnapshot {
  planId?: string | null;
  planName?: string | null;
  amountBdt?: number | null;
  paymentMethod?: PaymentMethod | string;
  transactionReference?: string | null;
  senderPhone?: string | null;
  notes?: string | null;
}

export interface Payment {
  id: string;
  memberProfileId: string;
  membershipId?: string | null;
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  editCount?: number;
  isEdited?: boolean;
  editedAt?: string | null;
  latestEdit?: {
    id: string;
    editedAt: string;
    summary: string;
    previous: PaymentEditSnapshot | null;
    updated: PaymentEditSnapshot | null;
  } | null;
  memberProfile?: MemberProfile;
  membership?: Membership;
}

export interface TrainerProfile {
  id: string;
  userId: string;
  slug: string;
  trainerCode?: string;
  headline: string;
  bio: string;
  specializations: string[];
  qualifications: string[];
  experienceYears: number;
  availabilityJson?: {
    days?: string[];
    hours?: string;
  } | null;
  availabilityNotes?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  user: {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
    status?: UserStatus;
  };
  classSchedules?: ClassSchedule[];
  workoutPrograms?: WorkoutProgram[];
}

export interface FacilityItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  features: string[];
  equipmentList?: string[];
  imageUrl?: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export type Facility = FacilityItem;

export interface ExerciseItem {
  id: string;
  name: string;
  slug: string;
  muscleGroup?: string;
  targetMuscleGroup?: string;
  equipment?: string | null;
  equipmentRequired?: string | null;
  difficulty: string;
  instructions: string;
  videoUrl?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export type Exercise = ExerciseItem;

export interface WorkoutExerciseItem {
  id: string;
  dayNumber?: number;
  dayLabel?: string;
  orderIndex: number;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string | null;
  notes?: string | null;
  exercise: ExerciseItem;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  category?: WorkoutCategory;
  goal: WorkoutGoal;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  sessionsPerWeek?: number;
  daysPerWeek: number;
  trainerProfileId?: string | null;
  isPublic: boolean;
  isActive: boolean;
  coverImageUrl?: string | null;
  createdByTrainer?: {
    user: { fullName: string; avatarUrl?: string | null };
  } | null;
  exercises?: WorkoutExerciseItem[];
}

export interface GymClassItem {
  id: string;
  name: string;
  title?: string;
  slug: string;
  description: string;
  category: string;
  durationMinutes: number;
  defaultCapacity: number;
  intensityLevel: string;
  difficulty?: DifficultyLevel;
  coverImageUrl?: string | null;
  isPublished: boolean;
  isActive?: boolean;
}

export type GymClass = GymClassItem;

export interface ClassSchedule {
  id: string;
  gymClassId: string;
  trainerProfileId?: string | null;
  dayOfWeek: any;
  specificDate?: string | null;
  startTime: string;
  endTime: string;
  roomName?: string | null;
  roomOrZone?: string;
  capacity: number;
  bookedCount: number;
  availableSeats?: number;
  cancellationCutoffHours?: number;
  isPublished?: boolean;
  isCancelled: boolean;
  gymClass: GymClassItem;
  trainerProfile?: {
    id?: string;
    slug?: string;
    user?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      avatarUrl?: string | null;
    };
  };
}

export interface Booking {
  id: string;
  memberProfileId: string;
  classScheduleId: string;
  status: BookingStatus;
  bookedAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  memberProfile?: MemberProfile;
  classSchedule?: ClassSchedule;
}

export interface AttendanceRecord {
  id: string;
  memberProfileId: string;
  bookingId?: string | null;
  checkInTime: string;
  checkInMethod: string;
  notes?: string | null;
  memberProfile?: MemberProfile;
  booking?: Booking;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption?: string | null;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  category: string;
  isPlaceholder: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole?: string | null;
  rating: number;
  quote: string;
  content?: string;
  avatarUrl?: string | null;
  isApproved: boolean;
  isPublished: boolean;
  createdAt?: string;
}

export type Testimonial = TestimonialItem;

export interface Inquiry {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: InquiryStatus;
  internalNotes?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  actor?: User | null;
}

export interface DashboardOverviewMetrics {
  kpis: {
    totalMembers: number;
    activeMembers: number;
    pendingRegistrations: number;
    expiredMemberships: number;
    monthlyRevenue: number;
    outstandingPaymentsCount: number;
    outstandingPaymentsAmount: number;
    upcomingClassesCount: number;
  };
  charts?: any;
  upcomingClasses?: ClassSchedule[];
  recentActivities?: AuditLog[];
}

export type NavPinPlacement = 'HEADER' | 'EXPLORE' | 'HIDDEN';

export interface NavPinItem {
  id: string;
  label: string;
  href: string;
  placement: NavPinPlacement;
  highlight?: boolean;
}

export interface HeroSlideConfig {
  id: string;
  slug: string;
  num: string;
  shortLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  statLabel: string;
  image: string;
}

export interface ShowcaseStreamCardConfig {
  slug: string;
  title: string;
  category: string;
  metric: string;
  image: string;
}

export interface ZoneOverrideConfig {
  name?: string;
  category?: string;
  highlight?: string;
  image?: string;
}

export interface WebsiteConfig {
  header: {
    brandTitle: string;
    brandSubtitle: string;
    showPromoBar: boolean;
    promoText: string;
    promoCtaLabel: string;
    promoCtaHref: string;
    showPortalButton: boolean;
    showThemeToggle: boolean;
    ctaPrimaryLabel: string;
    ctaSecondaryLabel: string;
    navPins: NavPinItem[];
  };
  hero: {
    badge: string;
    headlineLine1: string;
    headlineAccent: string;
    headlineLine2: string;
    subtitle: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  heroSlides?: HeroSlideConfig[];
  showcaseStream?: ShowcaseStreamCardConfig[];
  zoneImages?: Record<string, string>;
  zoneOverrides?: Record<string, ZoneOverrideConfig>;
  sectionHeadings?: {
    streamLabel?: string;
    floorEyebrow?: string;
    floorTitle?: string;
    floorCtaLabel?: string;
    scheduleEyebrow?: string;
    scheduleTitle?: string;
    scheduleCtaLabel?: string;
    morningBadge?: string;
    morningTime?: string;
    morningNote?: string;
    ladiesBadge?: string;
    ladiesTime?: string;
    ladiesNote?: string;
    afternoonBadge?: string;
    afternoonTime?: string;
    afternoonNote?: string;
    fridayBadge?: string;
    fridayTime?: string;
    fridayNote?: string;
    programsEyebrow?: string;
    programsTitle?: string;
    programsCtaLabel?: string;
    trainersEyebrow?: string;
    trainersTitle?: string;
    trainersCtaLabel?: string;
    plansEyebrow?: string;
    plansTitle?: string;
    plansCtaLabel?: string;
  };
  advantagePillars?: Array<{
    num: string;
    title: string;
    desc: string;
    badge: string;
  }>;
  transformationBanner?: {
    eyebrowBadge: string;
    headlineLine1: string;
    headlineAccent: string;
    subtitle: string;
    image: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  whyIconPage?: {
    heroBadge: string;
    heroTitleLine1: string;
    heroTitleAccent: string;
    heroSubtitle: string;
    heroBannerImage: string;
  };
  sections: {
    showTrainingZones: boolean;
    showScheduleBanner: boolean;
    showPrograms: boolean;
    showTrainers: boolean;
    showPlans: boolean;
    showWhyIcon: boolean;
  };
  footer: {
    brandDescription: string;
    copyrightText: string;
    bottomBadgeText: string;
  };
}

export interface GymSettings {
  id: string;
  gymName: string;
  tagline: string;
  description: string;
  addressLine: string;
  area?: string;
  city: string;
  country: string;
  phone?: string | null;
  phonePrimary?: string;
  phoneSecondary?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  emailOfficial?: string;
  isContactConfigured?: boolean;
  googleMapsEmbedUrl?: string | null;
  openingHoursNote?: string | null;
  isOpeningHoursConfigured?: boolean;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  missionStatement?: string | null;
  visionStatement?: string | null;
  trainingPhilosophy?: string | null;
  gymPolicies?: string | null;
  privacyPolicy?: string | null;
  termsAndConditions?: string | null;
  cancellationPolicy?: string | null;
  allowPublicRegistration?: boolean;
  requireMemberApproval?: boolean;
  bookingCancellationWindowHours?: number;
  maxAdvanceBookingDays?: number;
  openingHoursJson?: {
    note?: string;
    saturdayToThursday?: string;
    friday?: string;
    ladiesDedicatedSlot?: string;
  };
  socialLinksJson?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  policiesJson?: {
    cancellationCutoffHours?: number;
    cleanShoesRequired?: boolean;
    towelRequired?: boolean;
    lockerPolicy?: string;
    membershipFreezePolicy?: string;
  };
  allowSelfRegistration?: boolean;
  requireManualApproval?: boolean;
  bookingCutoffHoursDefault?: number;
  maxActiveBookingsMember?: number;
  currencyCode?: string;
  currencySymbol?: string;
  isUsingPlaceholderData?: boolean;
  websiteConfigJson?: WebsiteConfig | null;
}
