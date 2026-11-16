import {
  PrismaClient,
  Role,
  UserStatus,
  Gender,
  PlanDurationType,
  MembershipStatus,
  PaymentMethod,
  PaymentStatus,
  WorkoutGoal,
  DifficultyLevel,
  DayOfWeek,
  BookingStatus,
  GalleryCategory,
  MediaType,
  InquiryStatus,
  NotificationType,
  DeviceStatus,
  DeviceVendorType,
  BiometricEnrollmentStatus,
  GymSessionType,
  TrainerPresenceStatus,
  AccessDecision,
  AccessDenialCode,
  VerificationMethod,
  AccessDirection,
  DoorCommandStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const dbUrl =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://postgres:1234@localhost:5432/Icon-Fitness-Gym?schema=public';
process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log('Seeding Icon Fitness Gym database...');

  // 1. GymSettings (Configurable Placeholders per Strict Development Rules #8 & #9)
  await prisma.gymSettings.upsert({
    where: { singletonKey: 'DEFAULT' },
    update: {
      openingHoursJson: {
        note: 'Official Ashkona Gym Schedule (Asia/Dhaka)',
        saturdayToThursday:
          '07:00 AM – 11:00 PM (07:00 AM – 01:00 PM All • 01:00 PM – 03:30 PM Ladies Only • 03:30 PM – 11:00 PM All)',
        friday: '05:00 PM – 11:00 PM (All Members)',
        ladiesDedicatedSlot: '01:00 PM – 03:30 PM (Saturday – Thursday)',
      },
    },
    create: {
      singletonKey: 'DEFAULT',
      gymName: 'Icon Fitness Gym',
      tagline: 'Discipline. Strength. Performance in Ashkona, Dhaka.',
      description:
        'Icon Fitness Gym is a dedicated strength, conditioning, and athletic performance facility serving Ashkona, Dakshinkhan, and Uttara sectors in Dhaka, Bangladesh.',
      addressLine:
        'Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh',
      area: 'Ashkona, Dakshinkhan',
      city: 'Dhaka',
      country: 'Bangladesh',
      phonePrimary: '+880 1819-250933',
      phoneSecondary: null,
      whatsappNumber: '+880 1819-250933',
      emailOfficial: 'info@iconfitnessgym.com',
      googleMapsEmbedUrl:
        'https://www.google.com/maps?q=Ashkona,Dakshinkhan,Dhaka,Bangladesh&output=embed',
      openingHoursJson: {
        note: 'Official Ashkona Gym Schedule (Asia/Dhaka)',
        saturdayToThursday:
          '07:00 AM – 11:00 PM (07:00 AM – 01:00 PM All • 01:00 PM – 03:30 PM Ladies Only • 03:30 PM – 11:00 PM All)',
        friday: '05:00 PM – 11:00 PM (All Members)',
        ladiesDedicatedSlot: '01:00 PM – 03:30 PM (Saturday – Thursday)',
      },
      socialLinksJson: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com',
        googleMaps: 'https://maps.app.goo.gl/MFtvSDWnRHwn1fNd6',
      },
      policiesJson: {
        cancellationCutoffHours: 2,
        cleanShoesRequired: true,
        towelRequired: true,
        lockerPolicy:
          'Day lockers are available for active members during training sessions.',
        membershipFreezePolicy:
          'Quarterly, Half-Yearly, and Annual plans support administrative freeze requests.',
      },
      allowSelfRegistration: true,
      requireManualApproval: false,
      bookingCutoffHoursDefault: 2,
      maxActiveBookingsMember: 5,
      currencyCode: 'BDT',
      currencySymbol: '৳',
      isUsingPlaceholderData: true,
    },
  });

  // 2. Administrative & Staff Accounts
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
  const staffPasswordHash = await bcrypt.hash('Staff@1234', 12);
  const trainerPasswordHash = await bcrypt.hash('Trainer@1234', 12);
  const memberPasswordHash = await bcrypt.hash('Member@1234', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'superadmin@iconfitnessgym.com',
      phone: '+8801700000001',
      passwordHash: adminPasswordHash,
      fullName: 'System Super Admin (Configurable)',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'admin@iconfitnessgym.com',
      phone: '+8801700000002',
      passwordHash: adminPasswordHash,
      fullName: 'Gym Operations Admin (Configurable)',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'staff@iconfitnessgym.com',
      phone: '+8801700000003',
      passwordHash: staffPasswordHash,
      fullName: 'Front Desk Coordinator (Configurable)',
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // 3. Trainer Profiles
  const trainerUser1 = await prisma.user.upsert({
    where: { email: 'trainer@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'trainer@iconfitnessgym.com',
      phone: '+8801700000010',
      passwordHash: trainerPasswordHash,
      fullName: 'Head Strength Coach',
      avatarUrl:
        'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=80',
      role: Role.TRAINER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const trainer1 = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser1.id },
    update: {},
    create: {
      userId: trainerUser1.id,
      slug: 'head-strength-coach',
      headline: 'Strength & Hypertrophy Specialist',
      bio: 'Dedicated strength, barbell mechanics, and hypertrophy coach guiding members through progressive overload and injury-free performance at Icon Fitness Gym Ashkona.',
      specializations: [
        'Strength & Conditioning',
        'Barbell Compound Mechanics',
        'Hypertrophy Programming',
      ],
      qualifications: [
        'Certified Strength & Conditioning Coach',
        'Sports Nutrition & Body Recomposition',
      ],
      experienceYears: 6,
      availabilityJson: {
        days: ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
        hours: '07:00 AM - 03:00 PM',
      },
      isFeatured: true,
      isActive: true,
    },
  });

  const trainerUser2 = await prisma.user.upsert({
    where: { email: 'conditioning.coach@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'conditioning.coach@iconfitnessgym.com',
      phone: '+8801700000011',
      passwordHash: trainerPasswordHash,
      fullName: 'Athletic Conditioning Coach',
      avatarUrl:
        'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80',
      role: Role.TRAINER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const trainer2 = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser2.id },
    update: {
      gender: Gender.FEMALE,
    },
    create: {
      userId: trainerUser2.id,
      slug: 'athletic-conditioning-coach',
      gender: Gender.FEMALE,
      headline: 'Ladies Session & Metabolic Conditioning Coach',
      bio: 'Certified athletic conditioning and dedicated ladies-session coach specializing in metabolic fat loss, HIIT circuits, and functional mobility.',
      specializations: [
        'HIIT & Metabolic Conditioning',
        'Weight Loss & Endurance',
        'Functional Mobility',
      ],
      qualifications: [
        'Certified Functional Training Specialist',
        'First Aid & CPR Certified',
      ],
      experienceYears: 4,
      availabilityJson: {
        days: ['SATURDAY', 'SUNDAY', 'MONDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        hours: '01:00 PM - 10:30 PM',
      },
      isFeatured: true,
      isActive: true,
    },
  });

  // 4. Membership Plans
  const monthlyPlan = await prisma.membershipPlan.upsert({
    where: { slug: 'standard-monthly-access' },
    update: {},
    create: {
      name: 'Monthly Gym Access',
      slug: 'standard-monthly-access',
      description:
        'Full access to strength, free-weight, and cardio zones with digital workout tracking.',
      durationDays: 30,
      durationType: PlanDurationType.MONTHLY,
      priceBdt: 2000,
      admissionFeeBdt: 500,
      currency: 'BDT',
      benefits: [
        'Full access to Strength, Free Weights & Cardio floors',
        'Initial fitness assessment & orientation',
        'Access to Member Portal & Workout Tracker',
        'Up to 4 scheduled group classes per week',
        'Day-use locker access',
      ],
      eligibilityConditions:
        'Valid for 30 consecutive days from activation date.',
      renewalRules:
        'Can be renewed anytime from the Member Portal or Ashkona Front Desk.',
      maxClassesPerWeek: 4,
      includesPersonalTrainer: false,
      isFeatured: false,
      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
  });

  const quarterlyPlan = await prisma.membershipPlan.upsert({
    where: { slug: 'quarterly-performance-plan' },
    update: {},
    create: {
      name: 'Quarterly Performance',
      slug: 'quarterly-performance-plan',
      description:
        '90-day structured commitment ideal for progressive strength or body recomposition phases.',
      durationDays: 90,
      durationType: PlanDurationType.QUARTERLY,
      priceBdt: 5200,
      admissionFeeBdt: 0,
      currency: 'BDT',
      benefits: [
        'Waived admission fee on 90-day commitment',
        'Unlimited access to Strength, Free Weights & Cardio floors',
        'Customized workout program assigned in Member Portal',
        'Up to 6 scheduled group classes per week',
        'Monthly body composition & progress review',
      ],
      eligibilityConditions:
        'Valid for 90 consecutive days from activation date.',
      renewalRules: 'Preserves full membership history upon renewal.',
      maxClassesPerWeek: 6,
      includesPersonalTrainer: false,
      isFeatured: true,
      isActive: true,
      isPublic: true,
      sortOrder: 2,
    },
  });

  const annualPlan = await prisma.membershipPlan.upsert({
    where: { slug: 'annual-elite-coaching' },
    update: {},
    create: {
      name: 'Annual Athletic Club',
      slug: 'annual-elite-coaching',
      description:
        'Year-round full facility access with priority class booking and trainer program reviews.',
      durationDays: 365,
      durationType: PlanDurationType.YEARLY,
      priceBdt: 18000,
      admissionFeeBdt: 0,
      currency: 'BDT',
      benefits: [
        '365 days full access to all Icon Fitness Gym zones',
        'Dedicated Trainer Assignment & Quarterly Program Updates',
        'Priority booking on all weekly group classes',
        'Complimentary admission & freeze privilege (up to 30 days)',
        'Full access to Member Portal & Progress Analytics',
      ],
      eligibilityConditions:
        'Valid for 365 consecutive days from activation date.',
      renewalRules: 'Eligible for loyalty renewal discount.',
      maxClassesPerWeek: 10,
      includesPersonalTrainer: true,
      isFeatured: false,
      isActive: true,
      isPublic: true,
      sortOrder: 3,
    },
  });

  // 5. Configurable Facilities
  const facilitiesData = [
    {
      name: 'Cardio & Endurance Deck',
      slug: 'cardio-endurance-deck',
      category: 'Cardio Training',
      description:
        'Commercial-grade treadmills, elliptical cross-trainers, assault bikes, and rowing ergometers for cardiovascular conditioning.',
      features: [
        'Commercial Motorised Treadmills',
        'Spin & Assault Air Bikes',
        'Elliptical Cross-Trainers',
        'Heart-Rate Zone Conditioning',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80',
      sortOrder: 1,
    },
    {
      name: 'Selectorized & Plate-Loaded Strength Zone',
      slug: 'strength-training-zone',
      category: 'Strength Training',
      description:
        'Biomechanically engineered pin-loaded and plate-loaded machines targeting every major muscle group safely.',
      features: [
        'Dual Adjustable Cable Pulleys',
        'Plate-Loaded Leg Press & Hack Squat',
        'Lat Pulldown & Seated Row Stations',
        'Pec Deck, Shoulder Press & Isolation Machines',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
      sortOrder: 2,
    },
    {
      name: 'Heavy Free Weights & Barbell Bay',
      slug: 'free-weights-barbell-bay',
      category: 'Free Weights',
      description:
        'Olympic power racks, deadlift platforms, competition barbells, adjustable benches, and full dumbbell progression.',
      features: [
        'Power Cages & Squat Racks',
        'Olympic Barbells & Bumper Plates',
        'Complete Rubber Hex Dumbbell Rack',
        'Flat, Incline & Decline Utility Benches',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=80',
      sortOrder: 3,
    },
    {
      name: 'Personal Training & Functional Turf',
      slug: 'personal-training-turf',
      category: 'Personal Training',
      description:
        'Dedicated space for 1-on-1 coaching, kettlebell complexes, battle ropes, plyometrics, and mobility work.',
      features: [
        'Kettlebells, Medicine Balls & Battle Ropes',
        'Plyometric Boxes & Suspension Straps',
        '1-on-1 Movement Screening & Coaching',
        'Mobility & Post-Workout Stretching Mat Area',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80',
      sortOrder: 4,
    },
    {
      name: 'Locker, Changing & Prayer Amenities',
      slug: 'locker-and-member-amenities',
      category: 'Locker Facilities',
      description:
        'Clean changing rooms, secure day-use lockers, washrooms, and hydration stations for member comfort.',
      features: [
        'Secure Day-Use Lockers',
        'Separate Changing & Washroom Areas',
        'Purified Drinking Water Station',
        'Front-Desk Support & Check-In',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1000&q=80',
      sortOrder: 5,
    },
  ];

  for (const fac of facilitiesData) {
    await prisma.facility.upsert({
      where: { slug: fac.slug },
      update: {},
      create: fac,
    });
  }

  // 6. Exercises & Workout Programs
  const exSquat = await prisma.exercise.upsert({
    where: { slug: 'barbell-back-squat' },
    update: {},
    create: {
      name: 'Barbell Back Squat',
      slug: 'barbell-back-squat',
      targetMuscleGroup: 'Quadriceps, Glutes & Core',
      equipmentRequired: 'Barbell & Power Rack',
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions:
        'Set the barbell at upper-chest height. Brace your core, unrack, step back, and descend with knees tracking over toes until thighs are parallel or below. Drive through mid-foot to stand.',
    },
  });

  const exBench = await prisma.exercise.upsert({
    where: { slug: 'barbell-bench-press' },
    update: {},
    create: {
      name: 'Barbell Flat Bench Press',
      slug: 'barbell-bench-press',
      targetMuscleGroup: 'Chest, Anterior Delts & Triceps',
      equipmentRequired: 'Barbell & Flat Bench',
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions:
        'Retract shoulder blades firmly into the bench, plant feet, lower the bar under control to mid-chest, and press upward to lockout.',
    },
  });

  const exDeadlift = await prisma.exercise.upsert({
    where: { slug: 'romanian-deadlift' },
    update: {},
    create: {
      name: 'Romanian Deadlift (RDL)',
      slug: 'romanian-deadlift',
      targetMuscleGroup: 'Hamstrings, Glutes & Erectors',
      equipmentRequired: 'Barbell or Dumbbells',
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions:
        'Hinge at the hips while keeping a neutral spine and slight knee bend. Lower the bar along your shins until a deep hamstring stretch is felt, then drive hips forward.',
    },
  });

  const exLatPulldown = await prisma.exercise.upsert({
    where: { slug: 'wide-grip-lat-pulldown' },
    update: {},
    create: {
      name: 'Wide-Grip Cable Lat Pulldown',
      slug: 'wide-grip-lat-pulldown',
      targetMuscleGroup: 'Latissimus Dorsi & Upper Back',
      equipmentRequired: 'Lat Pulldown Machine',
      difficulty: DifficultyLevel.BEGINNER,
      instructions:
        'Grip the bar slightly wider than shoulder width, depress scapulae, and pull the bar toward your upper chest while driving elbows down.',
    },
  });

  const exPlank = await prisma.exercise.upsert({
    where: { slug: 'weighted-core-plank' },
    update: {},
    create: {
      name: 'Abdominal Forearm Plank',
      slug: 'weighted-core-plank',
      targetMuscleGroup: 'Core & Transverse Abdominis',
      equipmentRequired: 'Bodyweight / Mat',
      difficulty: DifficultyLevel.BEGINNER,
      instructions:
        'Maintain a rigid straight line from shoulders to heels, bracing abs and glutes without letting hips sag.',
    },
  });

  const progStrength = await prisma.workoutProgram.upsert({
    where: { slug: 'foundational-strength-hypertrophy' },
    update: {},
    create: {
      title: 'Foundational Strength & Muscle Architecture',
      slug: 'foundational-strength-hypertrophy',
      description:
        'A structured 8-week compound and accessory hypertrophy protocol designed to build dense muscular strength and joint resilience.',
      goal: WorkoutGoal.MUSCLE_BUILDING,
      difficulty: DifficultyLevel.INTERMEDIATE,
      durationWeeks: 8,
      daysPerWeek: 4,
      isPublic: true,
      isActive: true,
      createdByTrainerId: trainer1.id,
      coverImageUrl:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    },
  });

  const progFatLoss = await prisma.workoutProgram.upsert({
    where: { slug: 'athletic-fat-loss-conditioning' },
    update: {},
    create: {
      title: 'Metabolic Fat Loss & Athletic Conditioning',
      slug: 'athletic-fat-loss-conditioning',
      description:
        'High-output resistance circuits paired with progressive cardiovascular conditioning to maximize caloric expenditure while preserving lean mass.',
      goal: WorkoutGoal.WEIGHT_LOSS,
      difficulty: DifficultyLevel.ALL_LEVELS,
      durationWeeks: 6,
      daysPerWeek: 4,
      isPublic: true,
      isActive: true,
      createdByTrainerId: trainer2.id,
      coverImageUrl:
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
    },
  });

  await prisma.workoutProgram.upsert({
    where: { slug: 'beginner-full-body-blueprint' },
    update: {},
    create: {
      title: 'Beginner Full-Body Gym Blueprint',
      slug: 'beginner-full-body-blueprint',
      description:
        'Step-by-step introduction to gym machines, free weights, and movement mechanics for new members starting their fitness journey in Ashkona.',
      goal: WorkoutGoal.BEGINNER,
      difficulty: DifficultyLevel.BEGINNER,
      durationWeeks: 4,
      daysPerWeek: 3,
      isPublic: true,
      isActive: true,
      createdByTrainerId: trainer1.id,
      coverImageUrl:
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80',
    },
  });

  const existingExercisesCount = await prisma.workoutExercise.count({
    where: { workoutProgramId: progStrength.id },
  });
  if (existingExercisesCount === 0) {
    await prisma.workoutExercise.createMany({
      data: [
        {
          workoutProgramId: progStrength.id,
          exerciseId: exSquat.id,
          dayNumber: 1,
          orderIndex: 1,
          sets: 4,
          reps: '6-8',
          restSeconds: 120,
          tempo: '3-1-1-0',
          notes: 'Focus on depth and torso bracing.',
        },
        {
          workoutProgramId: progStrength.id,
          exerciseId: exBench.id,
          dayNumber: 1,
          orderIndex: 2,
          sets: 4,
          reps: '8-10',
          restSeconds: 90,
          tempo: '2-1-1-0',
          notes: 'Keep shoulder blades retracted throughout.',
        },
        {
          workoutProgramId: progStrength.id,
          exerciseId: exLatPulldown.id,
          dayNumber: 2,
          orderIndex: 1,
          sets: 3,
          reps: '10-12',
          restSeconds: 75,
          tempo: '2-0-1-1',
          notes: 'Control the eccentric stretch at the top.',
        },
        {
          workoutProgramId: progStrength.id,
          exerciseId: exDeadlift.id,
          dayNumber: 2,
          orderIndex: 2,
          sets: 3,
          reps: '8-10',
          restSeconds: 90,
          tempo: '3-1-1-0',
          notes: 'Maintain neutral lower back.',
        },
        {
          workoutProgramId: progStrength.id,
          exerciseId: exPlank.id,
          dayNumber: 2,
          orderIndex: 3,
          sets: 3,
          reps: '45 sec',
          restSeconds: 60,
          notes: 'Full abdominal tension.',
        },
      ],
    });
  }

  // 7. Gym Classes & Weekly Schedules
  const classStrength = await prisma.gymClass.upsert({
    where: { slug: 'barbell-strength-club' },
    update: {},
    create: {
      title: 'Barbell Strength & Compound Lab',
      slug: 'barbell-strength-club',
      description:
        'Coach-led small group session focusing on squat, press, and deadlift technique, progressive overload, and safe spotting.',
      category: 'Strength Training',
      durationMinutes: 60,
      defaultCapacity: 16,
      difficulty: DifficultyLevel.INTERMEDIATE,
      coverImageUrl:
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=80',
      isPublished: true,
      isActive: true,
    },
  });

  const classHiit = await prisma.gymClass.upsert({
    where: { slug: 'metcon-hiit-burn' },
    update: {},
    create: {
      title: 'MetCon HIIT & Fat Burn',
      slug: 'metcon-hiit-burn',
      description:
        'High-energy interval conditioning combining kettlebells, sleds, rowers, and bodyweight drills for cardiovascular endurance.',
      category: 'Conditioning',
      durationMinutes: 45,
      defaultCapacity: 20,
      difficulty: DifficultyLevel.ALL_LEVELS,
      coverImageUrl:
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80',
      isPublished: true,
      isActive: true,
    },
  });

  const classMobility = await prisma.gymClass.upsert({
    where: { slug: 'core-mobility-recovery' },
    update: {},
    create: {
      title: 'Core Stability & Athletic Mobility',
      slug: 'core-mobility-recovery',
      description:
        'Guided joint mobility, core stabilization, and myofascial recovery to improve posture and prevent training injuries.',
      category: 'Mobility & Core',
      durationMinutes: 50,
      defaultCapacity: 20,
      difficulty: DifficultyLevel.BEGINNER,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
      isPublished: true,
      isActive: true,
    },
  });

  const existingScheduleCount = await prisma.classSchedule.count();
  let schedule1Id: string;
  if (existingScheduleCount === 0) {
    const s1 = await prisma.classSchedule.create({
      data: {
        gymClassId: classStrength.id,
        trainerProfileId: trainer1.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        startTime: '07:30',
        endTime: '08:30',
        roomOrZone: 'Free Weights & Barbell Bay',
        capacity: 16,
        bookedCount: 1,
        cancellationCutoffHours: 2,
        isPublished: true,
      },
    });
    schedule1Id = s1.id;

    await prisma.classSchedule.createMany({
      data: [
        {
          gymClassId: classHiit.id,
          trainerProfileId: trainer2.id,
          dayOfWeek: DayOfWeek.SUNDAY,
          startTime: '18:30',
          endTime: '19:15',
          roomOrZone: 'Functional Turf Zone',
          capacity: 20,
          bookedCount: 0,
          cancellationCutoffHours: 2,
          isPublished: true,
        },
        {
          gymClassId: classStrength.id,
          trainerProfileId: trainer1.id,
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '19:00',
          endTime: '20:00',
          roomOrZone: 'Free Weights & Barbell Bay',
          capacity: 16,
          bookedCount: 0,
          cancellationCutoffHours: 2,
          isPublished: true,
        },
        {
          gymClassId: classMobility.id,
          trainerProfileId: trainer2.id,
          dayOfWeek: DayOfWeek.TUESDAY,
          startTime: '17:30',
          endTime: '18:20',
          roomOrZone: 'Functional Turf Zone',
          capacity: 20,
          bookedCount: 0,
          cancellationCutoffHours: 2,
          isPublished: true,
        },
        {
          gymClassId: classHiit.id,
          trainerProfileId: trainer2.id,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: '18:30',
          endTime: '19:15',
          roomOrZone: 'Functional Turf Zone',
          capacity: 20,
          bookedCount: 0,
          cancellationCutoffHours: 2,
          isPublished: true,
        },
        {
          gymClassId: classStrength.id,
          trainerProfileId: trainer1.id,
          dayOfWeek: DayOfWeek.THURSDAY,
          startTime: '08:00',
          endTime: '09:00',
          roomOrZone: 'Free Weights & Barbell Bay',
          capacity: 16,
          bookedCount: 0,
          cancellationCutoffHours: 2,
          isPublished: true,
        },
      ],
    });
  } else {
    const first = await prisma.classSchedule.findFirst();
    schedule1Id = first!.id;
  }

  // 8. Demo Member Account + Active Membership + Verified Payment + Receipt + Assigned Workout + Booking
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'member@iconfitnessgym.com',
      phone: '+8801700000020',
      passwordHash: memberPasswordHash,
      fullName: 'Tanvir Ahmed (Demo Member)',
      role: Role.MEMBER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const memberProfile = await prisma.memberProfile.upsert({
    where: { userId: memberUser.id },
    update: {},
    create: {
      userId: memberUser.id,
      memberCode: 'IFG-2026-0001',
      gender: Gender.MALE,
      address: 'Ashkona Hajj Camp Road, Dakshinkhan, Dhaka-1230',
      emergencyContactName: 'Farhana Ahmed',
      emergencyContactPhone: '+8801700000099',
      bloodGroup: 'O+',
      heightCm: 175,
      weightKg: 76,
      fitnessGoal: WorkoutGoal.MUSCLE_BUILDING,
      assignedTrainerId: trainer1.id,
    },
  });

  const existingMemberships = await prisma.membership.count({
    where: { memberProfileId: memberProfile.id },
  });

  if (existingMemberships === 0) {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const activeMembership = await prisma.membership.create({
      data: {
        memberProfileId: memberProfile.id,
        planId: quarterlyPlan.id,
        startDate,
        endDate,
        status: MembershipStatus.ACTIVE,
        activatedByUserId: adminUser.id,
        activationDate: startDate,
        renewalNotes: 'Activated after front-desk payment verification.',
      },
    });

    const verifiedPayment = await prisma.payment.create({
      data: {
        memberProfileId: memberProfile.id,
        membershipId: activeMembership.id,
        amountBdt: 5200,
        discountBdt: 0,
        netAmountBdt: 5200,
        paymentMethod: PaymentMethod.BKASH,
        transactionReference: 'BKASH-TXN-202611-8841',
        senderPhone: '+8801700000020',
        status: PaymentStatus.VERIFIED_PAID,
        paidAt: startDate,
        verifiedByUserId: adminUser.id,
        verifiedAt: startDate,
        notes: 'Verified bKash merchant payment at Ashkona front desk.',
      },
    });

    await prisma.paymentReceipt.create({
      data: {
        paymentId: verifiedPayment.id,
        receiptNumber: 'RCP-202611-0001',
        issuedToName: memberUser.fullName,
        issuedToEmail: memberUser.email,
        issuedToPhone: memberUser.phone,
        planName: quarterlyPlan.name,
        amountPaidBdt: 5200,
        paymentMethod: PaymentMethod.BKASH,
        issuedByUserId: adminUser.id,
        receiptDataJson: {
          gymName: 'Icon Fitness Gym',
          location: 'Ashkona, Dakshinkhan, Dhaka, Bangladesh',
          memberCode: memberProfile.memberCode,
        },
      },
    });

    await prisma.memberWorkoutAssignment.create({
      data: {
        memberProfileId: memberProfile.id,
        workoutProgramId: progStrength.id,
        assignedByTrainerId: trainer1.id,
        isActive: true,
        completionPercentage: 35,
        trainerNotes:
          'Focus on controlled eccentric tempo on squats and bench press. Log top set weights weekly.',
        memberProgressNotes: 'Completed Week 2 sessions. Feeling stronger on squats.',
      },
    });

    const nextSessionDate = new Date();
    nextSessionDate.setUTCHours(0, 0, 0, 0);
    await prisma.booking.create({
      data: {
        classScheduleId: schedule1Id,
        memberProfileId: memberProfile.id,
        sessionDate: nextSessionDate,
        status: BookingStatus.CONFIRMED,
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: memberUser.id,
          type: NotificationType.MEMBERSHIP,
          title: 'Membership Active — Quarterly Performance',
          message:
            'Your Quarterly Performance membership is active. Enjoy your training at Icon Fitness Gym Ashkona!',
          linkUrl: '/member/membership',
        },
        {
          userId: memberUser.id,
          type: NotificationType.WORKOUT,
          title: 'Workout Program Assigned',
          message:
            'Coach has assigned "Foundational Strength & Muscle Architecture" to your portal.',
          linkUrl: '/member/workouts',
        },
      ],
    });
  }

  // 9. Gallery Media (Explicitly marked isPlaceholder: true per Strict Rule #3 & #9)
  const galleryCount = await prisma.gallery.count();
  if (galleryCount === 0) {
    await prisma.gallery.createMany({
      data: [
        {
          title: 'Heavy Free Weights & Squat Rack Zone (Replaceable Placeholder)',
          caption:
            'Licensed architectural gym placeholder photograph. Replace with official Icon Fitness Gym Ashkona photography in Admin -> Gallery.',
          mediaType: MediaType.IMAGE,
          mediaUrl:
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
          category: GalleryCategory.FACILITY,
          isPlaceholder: true,
          isPublished: true,
          sortOrder: 1,
          uploadedByUserId: superAdmin.id,
        },
        {
          title: 'Dumbbell & Barbell Progression Bay (Replaceable Placeholder)',
          caption:
            'Licensed gym equipment placeholder photograph. Manage and replace via Admin Dashboard.',
          mediaType: MediaType.IMAGE,
          mediaUrl:
            'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
          category: GalleryCategory.EQUIPMENT,
          isPlaceholder: true,
          isPublished: true,
          sortOrder: 2,
          uploadedByUserId: superAdmin.id,
        },
        {
          title: 'Cardio & Conditioning Deck (Replaceable Placeholder)',
          caption:
            'Licensed cardio equipment placeholder photograph. Replace with actual Ashkona facility media.',
          mediaType: MediaType.IMAGE,
          mediaUrl:
            'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
          category: GalleryCategory.EQUIPMENT,
          isPlaceholder: true,
          isPublished: true,
          sortOrder: 3,
          uploadedByUserId: superAdmin.id,
        },
        {
          title: 'Functional & Coaching Session (Replaceable Placeholder)',
          caption:
            'Licensed training placeholder photograph. Upload real member/trainer media in Admin -> Gallery.',
          mediaType: MediaType.IMAGE,
          mediaUrl:
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
          category: GalleryCategory.TRAINING,
          isPlaceholder: true,
          isPublished: true,
          sortOrder: 4,
          uploadedByUserId: superAdmin.id,
        },
      ],
    });
  }

  // 10. Sample Approved Testimonials & Contact Inquiry
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          authorName: 'Member Feedback Sample #1 (Configurable)',
          authorRole: 'Quarterly Plan Member • Ashkona',
          memberProfileId: memberProfile.id,
          rating: 5,
          content:
            'Sample member testimonial placeholder configured for layout preview. Replace or approve real member reviews directly from Admin -> Testimonials.',
          isApproved: true,
          isPublished: true,
        },
        {
          authorName: 'Member Feedback Sample #2 (Configurable)',
          authorRole: 'Strength Program Member • Dakshinkhan',
          rating: 5,
          content:
            'Having structured workout programs and class seat booking inside the Member Portal makes training consistent every week. (Configurable sample review).',
          isApproved: true,
          isPublished: true,
        },
      ],
    });
  }

  const inquiryCount = await prisma.contactInquiry.count();
  if (inquiryCount === 0) {
    await prisma.contactInquiry.create({
      data: {
        fullName: 'Sabbir Hossain',
        email: 'sabbir.ashkona@example.com',
        phone: '+8801812345678',
        subject: 'Quarterly Membership & Morning Batch Inquiry',
        message:
          'Hello, I live near Ashkona Bazar and would like to know about morning strength coaching availability.',
        interestedPlan: quarterlyPlan.name,
        status: InquiryStatus.NEW,
      },
    });
  }

  // 11. Smart Access Control Settings, Simulated Devices, Gender-Based Sessions, Female Member & Biometrics
  await prisma.accessControlSettings.upsert({
    where: { singletonKey: 'DEFAULT' },
    update: {},
    create: {
      singletonKey: 'DEFAULT',
      timezone: 'Asia/Dhaka',
      enforceGenderSessions: true,
      requireFemaleTrainerPresence: true,
      allowFemaleInMaleSession: true,
      blockEntryWhenNoActiveSession: false,
      minFaceMatchConfidence: 0.85,
      requireLivenessDetection: true,
      deviceHeartbeatTimeoutSec: 90,
      callbackReplayWindowSec: 60,
      biometricRetentionDays: 365,
      trainerCheckInAlertLeadMinutes: 15,
      allowStaffManualOverride: true,
    },
  });

  const simEntryKeyHash = crypto
    .createHash('sha256')
    .update('SIM-DEV-ASHKONA-ENTRY-KEY-2026')
    .digest('hex');
  const simExitKeyHash = crypto
    .createHash('sha256')
    .update('SIM-DEV-ASHKONA-EXIT-KEY-2026')
    .digest('hex');

  const entryDevice = await prisma.accessDevice.upsert({
    where: { deviceCode: 'DEV-ASHKONA-ENTRY-01' },
    update: { lastHeartbeatAt: new Date(), status: DeviceStatus.ONLINE },
    create: {
      deviceCode: 'DEV-ASHKONA-ENTRY-01',
      name: 'Ashkona Main Entrance Turnstile [Simulated Terminal]',
      locationZone: 'Ashkona Main Entrance — Floor 1',
      vendorType: DeviceVendorType.SIMULATED_TERMINAL,
      direction: AccessDirection.ENTRY,
      ipAddress: '192.168.10.201',
      doorControllerId: 'DOOR-CTRL-ASHKONA-01',
      doorUnlockDurationSec: 5,
      apiKeyHash: simEntryKeyHash,
      isSimulated: true,
      isActive: true,
      status: DeviceStatus.ONLINE,
      lastHeartbeatAt: new Date(),
      firmwareVersion: 'SIM-FW-1.0.0',
      capabilitiesJson: {
        antiSpoofingLiveness: true,
        infraredSensor: true,
        emergencyBreakGlassIndependent: true,
      },
    },
  });

  await prisma.accessDevice.upsert({
    where: { deviceCode: 'DEV-ASHKONA-EXIT-01' },
    update: { lastHeartbeatAt: new Date(), status: DeviceStatus.ONLINE },
    create: {
      deviceCode: 'DEV-ASHKONA-EXIT-01',
      name: 'Ashkona Main Exit Reader [Simulated Terminal]',
      locationZone: 'Ashkona Main Exit — Floor 1',
      vendorType: DeviceVendorType.SIMULATED_TERMINAL,
      direction: AccessDirection.EXIT,
      ipAddress: '192.168.10.202',
      doorControllerId: 'DOOR-CTRL-ASHKONA-02',
      doorUnlockDurationSec: 5,
      apiKeyHash: simExitKeyHash,
      isSimulated: true,
      isActive: true,
      status: DeviceStatus.ONLINE,
      lastHeartbeatAt: new Date(),
      firmwareVersion: 'SIM-FW-1.0.0',
      capabilitiesJson: {
        antiSpoofingLiveness: true,
        emergencyBreakGlassIndependent: true,
      },
    },
  });

  // Demo Female Member Account + Active Membership + Verified Payment
  const femaleMemberUser = await prisma.user.upsert({
    where: { email: 'female.member@iconfitnessgym.com' },
    update: {},
    create: {
      email: 'female.member@iconfitnessgym.com',
      phone: '+8801700000021',
      passwordHash: memberPasswordHash,
      fullName: 'Nusrat Jahan (Demo Female Member)',
      role: Role.MEMBER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const femaleMemberProfile = await prisma.memberProfile.upsert({
    where: { userId: femaleMemberUser.id },
    update: { gender: Gender.FEMALE },
    create: {
      userId: femaleMemberUser.id,
      memberCode: 'IFG-2026-0002',
      gender: Gender.FEMALE,
      address: 'Ashkona Medical Road, Dakshinkhan, Dhaka-1230',
      emergencyContactName: 'Mahmudul Hasan',
      emergencyContactPhone: '+8801700000098',
      bloodGroup: 'B+',
      heightCm: 162,
      weightKg: 58,
      fitnessGoal: WorkoutGoal.FITNESS_IMPROVEMENT,
      assignedTrainerId: trainer2.id,
    },
  });

  const femaleMembershipsCount = await prisma.membership.count({
    where: { memberProfileId: femaleMemberProfile.id },
  });
  if (femaleMembershipsCount === 0) {
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const femMem = await prisma.membership.create({
      data: {
        memberProfileId: femaleMemberProfile.id,
        planId: monthlyPlan.id,
        startDate: start,
        endDate: end,
        status: MembershipStatus.ACTIVE,
        activatedByUserId: adminUser.id,
        activationDate: start,
        renewalNotes: 'Activated after verified front-desk payment.',
      },
    });

    await prisma.payment.create({
      data: {
        memberProfileId: femaleMemberProfile.id,
        membershipId: femMem.id,
        amountBdt: 2000,
        discountBdt: 0,
        netAmountBdt: 2000,
        paymentMethod: PaymentMethod.CASH,
        transactionReference: 'CASH-ASHKONA-202611-02',
        status: PaymentStatus.VERIFIED_PAID,
        paidAt: start,
        verifiedByUserId: adminUser.id,
        verifiedAt: start,
      },
    });
  }

  // Biometric Enrollments for Demo Male & Female Members (with explicit consent)
  const salt =
    process.env.BIOMETRIC_HASH_SALT || 'icon-fitness-ashkona-biometric-salt';
  const maleTplHash = crypto
    .createHmac('sha256', salt)
    .update('SIM-BIO-TOKEN-IFG-2026-0001')
    .digest('hex');
  const femaleTplHash = crypto
    .createHmac('sha256', salt)
    .update('SIM-BIO-TOKEN-IFG-2026-0002')
    .digest('hex');

  await prisma.biometricEnrollment.upsert({
    where: { memberProfileId: memberProfile.id },
    update: {},
    create: {
      memberProfileId: memberProfile.id,
      status: BiometricEnrollmentStatus.ENROLLED,
      consentGranted: true,
      consentGrantedAt: new Date(),
      consentVersion: 'v1.0-BD-BIOMETRIC-POLICY',
      encryptedTemplateCipher: 'SIMULATED_AES256_GCM_CIPHERTEXT_0001',
      templateHash: maleTplHash,
      templateVersion: 'FACENET-512-V1',
      livenessVerified: true,
      qualityScore: 0.98,
      enrolledByUserId: adminUser.id,
      enrolledDeviceId: entryDevice.id,
      enrolledAt: new Date(),
      retentionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.biometricEnrollment.upsert({
    where: { memberProfileId: femaleMemberProfile.id },
    update: {},
    create: {
      memberProfileId: femaleMemberProfile.id,
      status: BiometricEnrollmentStatus.ENROLLED,
      consentGranted: true,
      consentGrantedAt: new Date(),
      consentVersion: 'v1.0-BD-BIOMETRIC-POLICY',
      encryptedTemplateCipher: 'SIMULATED_AES256_GCM_CIPHERTEXT_0002',
      templateHash: femaleTplHash,
      templateVersion: 'FACENET-512-V1',
      livenessVerified: true,
      qualityScore: 0.99,
      enrolledByUserId: adminUser.id,
      enrolledDeviceId: entryDevice.id,
      enrolledAt: new Date(),
      retentionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Configurable Gender-Based Gym Sessions (Asia/Dhaka) for all 7 days of the week
  const allDays: DayOfWeek[] = [
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
  ];

  for (const day of allDays) {
    const dayPrefix = day.slice(0, 3);
    const isFriday = day === DayOfWeek.FRIDAY;

    const morningMaleCode = `SES-${dayPrefix}-MALE-MORN`;
    await prisma.gymSession.upsert({
      where: { code: morningMaleCode },
      update: {
        name: `${day} Morning & Midday General Session (07:00 AM – 01:00 PM)`,
        startTime: '07:00',
        endTime: '13:00',
        isActive: !isFriday,
      },
      create: {
        name: `${day} Morning & Midday General Session (07:00 AM – 01:00 PM)`,
        code: morningMaleCode,
        sessionType: GymSessionType.MALE_SESSION,
        dayOfWeek: day,
        startTime: '07:00',
        endTime: '13:00',
        timezone: 'Asia/Dhaka',
        requiresFemaleTrainer: false,
        allowFemaleInMaleSession: true,
        maxCapacity: 60,
        gracePeriodMinutes: 10,
        accessRulesNotes:
          '07:00 AM – 01:00 PM General Session: Both Male and Female members with active memberships may enter.',
        isActive: !isFriday,
      },
    });

    const afternoonFemaleCode = `SES-${dayPrefix}-FEM-AFT`;
    const femSession = await prisma.gymSession.upsert({
      where: { code: afternoonFemaleCode },
      update: {
        name: `${day} Dedicated Ladies-Only Session (01:00 PM – 03:30 PM)`,
        startTime: '13:00',
        endTime: '15:30',
        isActive: !isFriday,
      },
      create: {
        name: `${day} Dedicated Ladies-Only Session (01:00 PM – 03:30 PM)`,
        code: afternoonFemaleCode,
        sessionType: GymSessionType.FEMALE_SESSION,
        dayOfWeek: day,
        startTime: '13:00',
        endTime: '15:30',
        timezone: 'Asia/Dhaka',
        requiresFemaleTrainer: true,
        allowFemaleInMaleSession: false,
        maxCapacity: 40,
        gracePeriodMinutes: 10,
        accessRulesNotes:
          '01:00 PM – 03:30 PM Ladies Session: Exclusively for Female Members. Male Members are strictly denied entry. Requires designated Female Trainer checked in.',
        isActive: !isFriday,
      },
    });

    const eveningMaleCode = `SES-${dayPrefix}-MALE-EVE`;
    await prisma.gymSession.upsert({
      where: { code: eveningMaleCode },
      update: {
        name: isFriday
          ? `${day} Evening General Session (05:00 PM – 11:00 PM)`
          : `${day} Afternoon & Evening General Session (03:30 PM – 11:00 PM)`,
        startTime: isFriday ? '17:00' : '15:30',
        endTime: '23:00',
        isActive: true,
      },
      create: {
        name: isFriday
          ? `${day} Evening General Session (05:00 PM – 11:00 PM)`
          : `${day} Afternoon & Evening General Session (03:30 PM – 11:00 PM)`,
        code: eveningMaleCode,
        sessionType: GymSessionType.MALE_SESSION,
        dayOfWeek: day,
        startTime: isFriday ? '17:00' : '15:30',
        endTime: '23:00',
        timezone: 'Asia/Dhaka',
        requiresFemaleTrainer: false,
        allowFemaleInMaleSession: true,
        maxCapacity: 70,
        gracePeriodMinutes: 10,
        accessRulesNotes: isFriday
          ? 'Friday 05:00 PM – 11:00 PM General Session: Both Male and Female members with active memberships may enter.'
          : '03:30 PM – 11:00 PM General Session: Both Male and Female members with active memberships may enter.',
        isActive: true,
      },
    });

    // Ensure Female Trainer (trainer2) is assigned to each Dedicated Ladies Session
    const existingAssign = await prisma.sessionTrainerAssignment.findFirst({
      where: {
        gymSessionId: femSession.id,
        trainerProfileId: trainer2.id,
        isActive: true,
      },
    });
    if (!existingAssign) {
      await prisma.sessionTrainerAssignment.create({
        data: {
          gymSessionId: femSession.id,
          trainerProfileId: trainer2.id,
          isPrimary: true,
          isActive: true,
          notes:
            'Configurable Female Trainer assignment for Ladies Session. Verify physical trainer check-in before session starts.',
          assignedByUserId: adminUser.id,
        },
      });
    }
  }

  console.log('Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
