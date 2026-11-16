import { FacilityItem } from '@/types';

export interface FacilityZoneDetail {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  summary: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  keyMetrics: {
    label: string;
    value: string;
  }[];
  features: string[];
  equipmentSpecs: {
    name: string;
    spec: string;
    purpose: string;
  }[];
  trainingProtocols: {
    title: string;
    level: string;
    detail: string;
  }[];
  sessionAccess: {
    generalHours: string;
    ladiesHours: string;
    fridayHours: string;
    accessNote: string;
  };
  dedicatedAmenities?: {
    title: string;
    badge: string;
    detail: string;
  }[];
  safetyRules: string[];
}

export const FACILITY_ZONES_CATALOG: Record<string, FacilityZoneDetail> = {
  'cardio-endurance-deck': {
    slug: 'cardio-endurance-deck',
    name: 'Cardio & Endurance Deck',
    category: 'Cardio Training',
    tagline: 'HIGH-OUTPUT AEROBIC & METABOLIC CONDITIONING FLOOR',
    summary:
      'Commercial-grade motorized treadmills, elliptical cross-trainers, assault air bikes, stair climbers, and rowing ergometers engineered for stamina and fat loss.',
    description:
      'The Cardio & Endurance Deck at Icon Fitness Gym (Ashkona, Dhaka) is built for both steady-state fat oxidation and high-intensity interval conditioning (HIIT). Every machine is positioned in a climate-ventilated zone with shock-absorbent running decks to protect knee and ankle joints.',
    heroImage:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=90',
    galleryImages: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85',
    ],
    keyMetrics: [
      { label: 'Cardio Stations', value: '18+ Commercial Units' },
      { label: 'Incline Range', value: '0% – 15% Power Grade' },
      { label: 'Heart-Rate Tracking', value: 'Dual-Pulse Telemetry' },
      { label: 'Ventilation', value: 'Full AC & Fresh Air Flow' },
    ],
    features: [
      'Commercial Motorised Treadmills with Shock Absorption',
      'Heavy-Duty Spin & Assault Air Bikes',
      'Low-Impact Elliptical Cross-Trainers',
      'Rowing Ergometers for Full-Body Stamina',
      'Heart-Rate Zone & Calorie Telemetry Consoles',
      'Dedicated Warm-Up & Cool-Down Stretch Area',
    ],
    equipmentSpecs: [
      {
        name: 'Commercial AC-Motor Treadmills',
        spec: '0.8 – 20 km/h speed • 15% motorized incline • Elastomer deck cushioning',
        purpose: 'Incline fat-loss walking, tempo runs, and VO2-max sprint intervals',
      },
      {
        name: 'Assault Air & Spin Bikes',
        spec: 'Progressive air-fan resistance & magnetic flywheel control',
        purpose: 'Zero-impact lower-body conditioning and Tabata sprint protocols',
      },
      {
        name: 'Commercial Elliptical Cross-Trainers',
        spec: '20 electronic resistance levels • Dual-action upper/lower handlebars',
        purpose: 'Joint-friendly aerobic endurance and calorie expenditure',
      },
      {
        name: 'Indoor Rowing Ergometers',
        spec: 'Variable damper settings (1–10) • Real-time split/watt monitor',
        purpose: 'Posterior-chain endurance and full-body metabolic conditioning',
      },
    ],
    trainingProtocols: [
      {
        title: '12-3-30 Incline Fat-Oxidation Walk',
        level: 'All Levels',
        detail:
          'Set treadmill incline to 12% and speed to 4.8 km/h (3 mph) for 30 minutes to maximize fat utilization.',
      },
      {
        title: 'Air-Bike 20/40 Tabata Intervals',
        level: 'Intermediate',
        detail:
          '8 rounds of 20 seconds sprint followed by 40 seconds active recovery pedaling.',
      },
      {
        title: 'Post-Lifting Zone-2 Finisher',
        level: 'All Levels',
        detail:
          '15–20 minutes on the elliptical or treadmill maintaining 65%–70% max heart rate.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote:
        'Included in all active Monthly, Quarterly, Half-Yearly, and Annual memberships.',
    },
    safetyRules: [
      'Always attach the emergency safety clip when running at high speeds.',
      'Wipe down console handles and seats with a sanitizer towel after use.',
      'Wear clean indoor non-marking athletic running shoes on the cardio deck.',
    ],
  },

  'strength-training-zone': {
    slug: 'strength-training-zone',
    name: 'Selectorized & Plate-Loaded Strength Zone',
    category: 'Strength Training',
    tagline: 'BIOMECHANICALLY ENGINEERED HYPERTROPHY & ISOLATION ARENA',
    summary:
      'Pin-loaded selectorized stacks and heavy plate-loaded leverage machines targeting every major muscle group with precision ergonomics.',
    description:
      'Built for controlled muscular hypertrophy and safe progressive overload, our Selectorized & Plate-Loaded Strength Zone features commercial cable crossovers, linear leg presses, hack squats, lat pulldowns, pec decks, and isolation stations.',
    heroImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Machine Stations', value: '24+ Isolation & Compound' },
      { label: 'Cable Stacks', value: 'Dual 100kg Pulleys' },
      { label: 'Lower Body Lab', value: '45° Leg Press & Hack Squat' },
      { label: 'Safety Rating', value: 'Guided Biomechanical Paths' },
    ],
    features: [
      'Dual Adjustable Cable Crossover & Functional Trainer Pulleys',
      'Heavy-Duty 45° Plate-Loaded Leg Press & Linear Hack Squat',
      'Commercial Lat Pulldown & Seated Low-Row Stations',
      'Pec Deck Fly / Rear-Delt Combo & Converging Chest Press',
      'Seated Leg Extension, Prone/Seated Leg Curl & Calf Raise',
      'Preacher Curl, Tricep Dip Press & Lateral Raise Machines',
    ],
    equipmentSpecs: [
      {
        name: 'Dual Adjustable Functional Cable Tower',
        spec: '2:1 smooth pulley ratio • 22 vertical height positions • Multi-grip pull-up bridge',
        purpose: 'Constant-tension chest flyes, face pulls, tricep pushdowns, and lateral raises',
      },
      {
        name: '45-Degree Linear Leg Press & Hack Squat',
        spec: 'Heavy-gauge steel carriage • Multi-position safety lockouts • High/low footplate',
        purpose: 'Quad-dominant and glute/hamstring lower-body strength development',
      },
      {
        name: 'Converging Chest & Shoulder Press Machines',
        spec: 'Independent iso-lateral arms • Ergonomic seat height adjustment',
        purpose: 'Balanced pressing strength without rotator-cuff instability',
      },
      {
        name: 'Lat Pulldown & Seated Cable Row Tower',
        spec: 'High-tensile aircraft cables • Wide, neutral MAG-style, and close V-grip attachments',
        purpose: 'Upper-back width, lats, rhomboids, and scapular control',
      },
    ],
    trainingProtocols: [
      {
        title: 'Controlled Hypertrophy Tempo (3-1-1-0)',
        level: 'All Levels',
        detail:
          '3-second eccentric lowering, 1-second stretched pause, and 1-second concentric drive.',
      },
      {
        title: 'Mechanical Drop-Set Finishers',
        level: 'Intermediate',
        detail:
          'Use pin-loaded selectorized stacks to perform 2–3 quick weight drops on your final set safely.',
      },
      {
        title: 'Upper / Lower Split Machine Circuit',
        level: 'Beginner',
        detail:
          'Guided 6-machine full-body circuit ideal for building foundational strength.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote:
        'Floor trainers are always available to demonstrate seat heights and proper machine adjustments.',
    },
    safetyRules: [
      'Always verify the selector pin is fully inserted into the weight stack before lifting.',
      'Re-rack all Olympic weight plates from plate-loaded machines after finishing your sets.',
      'Do not drop or slam selectorized weight stacks.',
    ],
  },

  'free-weights-barbell-bay': {
    slug: 'free-weights-barbell-bay',
    name: 'Heavy Free Weights & Barbell Bay',
    category: 'Free Weights',
    tagline: 'OLYMPIC POWER RACKS, DEADLIFT PLATFORMS & FULL DUMBBELL LINE',
    summary:
      'Competition power cages, calibrated Olympic barbells, bumper plates, adjustable utility benches, and a complete dumbbell progression up to 50kg.',
    description:
      'The heart of serious strength training at Icon Fitness Gym in Ashkona. Our Heavy Free Weights & Barbell Bay is built on high-density impact-absorbing rubber flooring and equipped with commercial power racks, deadlift platforms, Olympic 20kg & 15kg barbells, EZ-curl bars, and a two-tier commercial dumbbell rack.',
    heroImage:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Dumbbell Range', value: '2.5 kg – 50 kg Pairs' },
      { label: 'Power Racks', value: 'Olympic Squat Cages' },
      { label: 'Barbells', value: '20kg & 15kg Olympic Bars' },
      { label: 'Flooring', value: '25mm Ballistic Rubber' },
    ],
    features: [
      'Heavy-Duty Power Cages & Squat Racks with Safety Spotter Arms',
      'Olympic 20kg & 15kg Knurled Barbells, Trap Bars & EZ-Curl Bars',
      'Complete Rubber Hex & Urethane Dumbbell Progression (2.5kg–50kg)',
      'Flat, Incline & Decline Olympic Bench Press Stations',
      'Multi-Angle FID (Flat-Incline-Decline) Adjustable Utility Benches',
      'Dedicated Deadlift & Barbell Row Impact Platforms',
    ],
    equipmentSpecs: [
      {
        name: 'Commercial Power Cages & Squat Racks',
        spec: '3x3" 11-gauge steel uprights • UHMW-lined J-cups • Heavy safety spotter pins',
        purpose: 'Barbell back squats, front squats, overhead presses, and rack pulls',
      },
      {
        name: 'Olympic Barbells & Calibrated Plate Trees',
        spec: '28mm grip tensile steel bars • 1.25kg to 25kg bumper & cast-iron plates',
        purpose: 'Progressive strength overload on squats, bench presses, and deadlifts',
      },
      {
        name: 'Two-Tier Commercial Dumbbell Line',
        spec: 'Ergonomic knurled chrome handles • Anti-roll hex & urethane heads',
        purpose: 'Unilateral pressing, rowing, lunges, and upper-body hypertrophy',
      },
      {
        name: 'FID Adjustable Benches (0° to 85°)',
        spec: '7 back-pad angles • 3 seat-pad angles • Transport wheels',
        purpose: 'Flat, incline, and seated shoulder dumbbell work',
      },
    ],
    trainingProtocols: [
      {
        title: '5x5 Foundational Compound Strength',
        level: 'Intermediate',
        detail:
          '5 working sets of 5 reps on Barbell Squat, Bench Press, and Deadlift.',
      },
      {
        title: 'Push / Pull / Legs Hypertrophy Split',
        level: 'All Levels',
        detail:
          'Combine heavy barbell compound lifts (6–8 reps) with dumbbell accessory work.',
      },
      {
        title: 'Coach-Assisted Technique & Form Check',
        level: 'Beginner',
        detail:
          'Request any on-floor trainer to spot your bench press or check your squat depth.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote:
        'Full access for all members. Safety collars and spotter arms are mandatory during heavy lifts.',
    },
    safetyRules: [
      'Always use barbell spring/lock collars on every Olympic bar.',
      'Set safety spotter arms to the proper height inside the squat rack before lifting.',
      'Return all dumbbells and weight plates to their designated numbered racks after use.',
    ],
  },

  'dedicated-ladies-studio': {
    slug: 'dedicated-ladies-studio',
    name: 'Dedicated Ladies-Only Training Window',
    category: 'Female Sessions',
    tagline: '100% PRIVATE FEMALE FLOOR • SEPARATE LADIES CHANGING & WASHROOM',
    summary:
      'Exclusively reserved Ladies-Only session from 1:00 PM to 3:30 PM (Sat–Thu) with a Certified Female Trainer, plus completely separate Ladies Changing Rooms, Private Washrooms, Lockers, and Prayer Amenities.',
    description:
      'Icon Fitness Gym (Ashkona, Dhaka) provides a comfortable, 100% private fitness environment for female members. From 01:00 PM to 03:30 PM (Saturday–Thursday), our Smart Face Recognition Access Control Gate strictly blocks male entry and requires certified Female Coach check-in on-floor. Female members also enjoy dedicated, completely separate Ladies Changing Rooms, private Ladies Washrooms, secure day-use lockers, and prayer facilities throughout every operating hour.',
    heroImage:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Daily Ladies Slot', value: '01:00 PM – 03:30 PM' },
      { label: 'Private Amenities', value: 'Separate Changing & Washroom' },
      { label: 'On-Floor Coaching', value: 'Certified Female Coach' },
      { label: 'Privacy Security', value: 'Smart Biometric Gate' },
    ],
    features: [
      'Completely Separate Ladies-Only Changing Room & Dressing Area',
      'Separate Dedicated Ladies Washroom, Vanity Mirror & Hygiene Suite',
      'Private Female Day-Use Lockers for Bags, Abayas & Personal Gear',
      '100% Exclusive Female Floor Window (01:00 PM – 03:30 PM Sat–Thu)',
      'Supervised On-Floor by Certified Female Trainer (Nusrat Jahan Mim)',
      'Automated Smart Gate Lock Denying Male Entry During Ladies Slot',
      'Dedicated Clean Prayer & Wudu Space for Timely Salah',
      'Full Access to Cardio, Glute Bay, Strength Machines & Free Weights',
    ],
    dedicatedAmenities: [
      {
        title: 'Separate Ladies Changing Room',
        badge: '100% SEPARATE WING',
        detail:
          'Completely separate, enclosed changing suite exclusively for female members—featuring full-length mirrors, comfortable seating, and zero shared corridors with men’s changing areas.',
      },
      {
        title: 'Dedicated Ladies Washroom & Vanity',
        badge: 'PRIVATE HYGIENE',
        detail:
          'Exclusive female-only washroom and freshen-up sink area maintained and sanitized throughout the day for total comfort before and after workouts.',
      },
      {
        title: 'Private Female Locker & Storage Bank',
        badge: 'SECURE LOCKERS',
        detail:
          'Dedicated day-use lockers reserved for female members to safely store handbags, hijabs, abayas, footwear, and valuables during training.',
      },
      {
        title: 'Clean Prayer & Wudu Facility',
        badge: 'MODESTY & COMFORT',
        detail:
          'Quiet, clean prayer area equipped with fresh prayer mats so female members can perform Zuhr/Asr Salah peacefully on-site.',
      },
      {
        title: 'Smart Face ID Male-Block Gate',
        badge: 'AUTOMATED PRIVACY',
        detail:
          'During 01:00 PM – 03:30 PM (Sat–Thu), the entrance turnstile automatically denies male check-ins and unlocks exclusively for active female members.',
      },
      {
        title: 'On-Floor Female Coach Guidance',
        badge: 'EXPERT SUPPORT',
        detail:
          'Mandatory certified Female Coach presence throughout the entire Ladies Window for machine setup, posture checks, fat-loss circuits, and 1-on-1 guidance.',
      },
    ],
    equipmentSpecs: [
      {
        name: 'Smart Gender-Session Access Gate',
        spec: 'Automated Asia/Dhaka schedule enforcement • Zero male entry during Ladies Slot',
        purpose: 'Guarantees complete privacy and peace of mind for female members',
      },
      {
        name: 'Female-Friendly Ergonomic Machines & 15kg Olympic Bars',
        spec: 'Adjustable seat pads, lighter starting increments & 15kg women’s Olympic barbells',
        purpose: 'Comfortable biomechanics for beginners and experienced female lifters alike',
      },
      {
        name: 'Glute, Core & Functional Conditioning Suite',
        spec: 'Hip thrust benches, cable ankle straps, kettlebells, step boxes & resistance bands',
        purpose: 'Targeted lower-body sculpting, core stability, and metabolic fat loss',
      },
      {
        name: 'Certified Female Trainer Supervision',
        spec: 'Mandatory trainer check-in verification before session activation',
        purpose: 'Hands-on form correction, machine orientation, and workout programming',
      },
    ],
    trainingProtocols: [
      {
        title: 'Ladies Fat-Loss & Metabolic Toning',
        level: 'All Levels',
        detail:
          'Structured 45-minute circuit combining lower-body machines, dumbbell supersets, battle ropes, and incline treadmill intervals.',
      },
      {
        title: 'Glute, Core & Posture Blueprint',
        level: 'Beginner / Intermediate',
        detail:
          'Guided barbell hip thrusts, cable glute kickbacks, goblet squats, and core stabilization drills for toned strength.',
      },
      {
        title: 'Beginner Ladies Gym Orientation',
        level: 'First-Time Members',
        detail:
          'Step-by-step 1-on-1 walkthrough of every cardio unit, pin-loaded station, and dumbbell setup during your first week.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM (Also Open to Ladies)',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Strictly Female Members Only)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote:
        'Female members enjoy maximum flexibility: train in 100% private comfort from 1:00 PM – 3:30 PM (Sat–Thu) or attend any General session—with separate Ladies Changing Room and Washroom access at all times.',
    },
    safetyRules: [
      'Male members and male staff are strictly prohibited from floor access between 1:00 PM and 3:30 PM (Sat–Thu).',
      'Separate Ladies Changing Rooms and Ladies Washrooms are strictly for female members at all operating hours with zero CCTV cameras inside.',
      'Photography or video recording of other members is strictly prohibited during Ladies Sessions.',
      'Consult the on-duty Female Trainer before attempting new free-weight or barbell exercises.',
    ],
  },

  'personal-training-turf': {
    slug: 'personal-training-turf',
    name: 'Personal Training & Functional Turf',
    category: 'Personal Training',
    tagline: 'ATHLETIC SLED TURF, KETTLEBELLS, HIIT & 1-ON-1 COACHING ZONE',
    summary:
      'Dedicated functional turf arena for 1-on-1 personal training, kettlebell complexes, battle ropes, plyometrics, sled pushes, and mobility work.',
    description:
      'Designed for dynamic movement, athletic conditioning, and personalized 1-on-1 coaching. Our Functional Turf & Personal Training zone gives members and coaches open space for sled drives, battle rope intervals, TRX suspension training, kettlebell flows, and box jumps.',
    heroImage:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Functional Tools', value: 'Kettlebells, Ropes & TRX' },
      { label: 'Coaching Format', value: '1-on-1 & Small Group' },
      { label: 'Turf Surface', value: 'High-Density Sprint Turf' },
      { label: 'Mobility Zone', value: 'Rollers, Bands & Mats' },
    ],
    features: [
      'Cast-Iron Competition & Powder-Coated Kettlebells (4kg – 32kg)',
      'Heavy 50mm Conditioning Battle Ropes & Slam Balls',
      'Soft-Impact 3-in-1 Plyometric Jump Boxes (20" / 24" / 30")',
      'Suspension Straps (TRX), Resistance Bands & Ab Wheels',
      '1-on-1 Movement Screening, Body Composition & Form Coaching',
      'Dedicated Mobility, Core & Post-Workout Stretching Mat Area',
    ],
    equipmentSpecs: [
      {
        name: 'Kettlebell & Medicine Ball Arsenal',
        spec: '4kg to 32kg kettlebells • 3kg to 15kg wall balls and dead-bounce slam balls',
        purpose: 'Explosive hip hinges, swings, Turkish get-ups, and rotational core power',
      },
      {
        name: '50mm Poly-Dacron Battle Ropes',
        spec: '15-meter heavy conditioning ropes with anchored floor mount',
        purpose: 'Upper-body lactic conditioning, shoulder endurance, and metabolic circuits',
      },
      {
        name: 'Anti-Slip 3-in-1 Foam Plyo Boxes',
        spec: 'High-density impact foam core with non-slip vinyl surface',
        purpose: 'Safe explosive box jumps, step-ups, and Bulgarian split squats',
      },
      {
        name: 'Mobility & Recovery Station',
        spec: 'High-density EVA mats, trigger-point foam rollers, and pull-up assist bands',
        purpose: 'Hip/thoracic warm-ups, core stability, and post-session recovery',
      },
    ],
    trainingProtocols: [
      {
        title: '30-Minute EMOM Metabolic Conditioning',
        level: 'All Levels',
        detail:
          'Every Minute on the Minute alternating Kettlebell Swings, Battle Rope Slams, and Planks.',
      },
      {
        title: '1-on-1 Personal Transformation Session',
        level: 'Customized',
        detail:
          'Work directly with a certified Male or Female trainer on customized fat loss or strength.',
      },
      {
        title: '10-Minute Dynamic Warm-Up Flow',
        level: 'All Levels',
        detail:
          'Thoracic rotations, banded glute activation, and hip openers before heavy lifting.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote:
        'Open to all members for functional training; 1-on-1 personal coaching slots can be coordinated with our certified trainers.',
    },
    safetyRules: [
      'Keep the central turf lane clear when other members are performing walking lunges or sled drills.',
      'Sanitize exercise mats after floor core or stretching routines.',
      'Return kettlebells, bands, and medicine balls to the storage rack immediately after your circuit.',
    ],
  },

  'olympic-lifting-platforms': {
    slug: 'olympic-lifting-platforms',
    name: 'Olympic Lifting & Deadlift Platforms',
    category: 'Power & Strength',
    tagline: 'CALIBRATED BUMPER PLATES, DEADLIFT PLATFORMS & SQUAT RACKS',
    summary:
      'Shock-absorbing deadlift platforms, competition 20kg & 15kg barbells, color-coded bumper plates, and heavy squat racks built for serious strength athletes.',
    description:
      'Engineered for heavy deadlifts, barbell rows, cleans, and squats without floor vibration. Each platform combines a high-grip hardwood center with reinforced 50mm ballistic rubber drop zones.',
    heroImage:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Platform Spec', value: '50mm Shock-Drop Zones' },
      { label: 'Barbell Rating', value: '1500 lb Tensile Steel' },
      { label: 'Bumper Plates', value: 'IWF-Standard 5kg – 25kg' },
      { label: 'Specialty Bars', value: 'Hex Trap & EZ-Curl Bars' },
    ],
    features: [
      'Reinforced Olympic Deadlift & Power Clean Platforms',
      'Full Set of Virgin Rubber Bumper Plates (5kg, 10kg, 15kg, 20kg, 25kg)',
      'Fractional Change Plates (1.25kg & 2.5kg) for Micro-Progression',
      'Heavy-Duty Open Hex Trap Bar for Joint-Friendly Deadlifts',
      'Quick-Lock Aluminum Barbell Collars on Every Platform',
      'Integrated Pull-Up & Band-Anchor Uprights',
    ],
    equipmentSpecs: [
      {
        name: 'Composite Deadlift & Lifting Platforms',
        spec: '8x6 ft footprint • Non-slip center deck • High-density rubber wings',
        purpose: 'Conventional/sumo deadlifts, barbell rows, and overhead presses',
      },
      {
        name: 'Needle-Bearing & Bushing Olympic Bars',
        spec: '20kg (28mm) & 15kg (25mm) medium-depth knurling with center knurl',
        purpose: 'Secure grip and smooth sleeve rotation under heavy loads',
      },
      {
        name: 'Olympic Hex Trap Bar',
        spec: 'Dual high/low neutral handles • 25kg frame weight',
        purpose: 'Lower-back friendly deadlifts, shrugs, and loaded carries',
      },
      {
        name: 'Vertical Bumper Plate Storage Trees',
        spec: '6-horn steel plate trees with floor-protection rubber feet',
        purpose: 'Fast loading/unloading and organized platform safety',
      },
    ],
    trainingProtocols: [
      {
        title: 'Progressive Deadlift Pyramid',
        level: 'Intermediate / Advanced',
        detail:
          'Warm-up sets of 8, 5, 3 reps leading into 3 working sets of 3–5 controlled reps.',
      },
      {
        title: 'Trap-Bar Strength & Hypertrophy',
        level: 'All Levels',
        detail:
          '4 sets of 8–10 reps using the neutral-grip hex trap bar for safe posterior-chain growth.',
      },
      {
        title: 'Barbell Pendlay Row & RDL Superset',
        level: 'Intermediate',
        detail:
          'Build upper-back thickness and hamstring strength on a single platform.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote: 'Included in all active memberships.',
    },
    safetyRules: [
      'Only drop bumper plates on the designated rubber platform wings.',
      'Always secure plates with locking collars before lifting.',
      'Strip the barbell completely and rack all plates after your session.',
    ],
  },

  'pin-loaded-isolation-machines': {
    slug: 'pin-loaded-isolation-machines',
    name: 'Cable Crossover & Hypertrophy Lab',
    category: 'Hypertrophy Lab',
    tagline: 'DUAL CABLE TOWERS, PEC DECK & PRECISION MUSCLE ISOLATION',
    summary:
      'Constant-tension cable pulley stations, seated row towers, lateral raise machines, and arm isolation stations for detailed physique sculpting.',
    description:
      'Designed for bodybuilders and physique-focused members who demand smooth resistance curves and zero dead-spots. Our Cable Crossover & Hypertrophy Lab houses multi-angle pulley towers and dedicated isolation machines for chest, back, delts, biceps, and triceps.',
    heroImage:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Pulley Towers', value: '8-Stack & Dual Crossover' },
      { label: 'Handle Attachments', value: '15+ Ergonomic Grips' },
      { label: 'Resistance Increments', value: '2.5 kg Micro-Pin Steps' },
      { label: 'Target Focus', value: 'Chest, Back, Delts & Arms' },
    ],
    features: [
      'Wide-Span Cable Crossover Bridge with Multi-Grip Pull-Up Station',
      'Dual Pec-DeckChest Fly & Rear-Deltoid Reverse Fly Machine',
      'Dedicated Seated Lateral Raise & Overhead Shoulder Press',
      'Preacher Curl Bench & Cam-Driven Bicep/Tricep Isolation Machines',
      'Full Attachment Rack: MAG-Style Back Grips, Tricep Ropes, D-Handles & EZ Bars',
      'Smooth Kevlar-Belted & Aircraft-Cable Weight Stacks',
    ],
    equipmentSpecs: [
      {
        name: '8-Stack & Dual Cable Crossover Station',
        spec: 'Swivel pulleys rotating 180° • One-hand vertical carriage adjustment',
        purpose: 'High-to-low chest flyes, cable lateral raises, face pulls, and rope crunches',
      },
      {
        name: 'Dual-Function Pec Fly / Rear Delt Machine',
        spec: ' Articulating self-adjusting arms • 100kg weight stack',
        purpose: 'Inner-chest peak contraction and posterior deltoid development',
      },
      {
        name: 'Ergonomic Preacher Curl & Tricep Extension',
        spec: 'Angled arm pad eliminating shoulder momentum • Variable cam resistance',
        purpose: 'Strict bicep peak and tricep long/lateral head isolation',
      },
      {
        name: 'Anatomical Back & Lat Attachment Wall',
        spec: 'Pronated, supinated, and neutral ergonomic cable bars',
        purpose: 'Maximizing lat activation while reducing forearm fatigue',
      },
    ],
    trainingProtocols: [
      {
        title: 'Constant-Tension Cable Fly & Press Superset',
        level: 'All Levels',
        detail:
          'Pair converging chest press (8–10 reps) with high-to-low cable flyes (12–15 reps).',
      },
      {
        title: '3D Deltoid Cable Circuit',
        level: 'Intermediate',
        detail:
          'Behind-the-back cable lateral raises, rope face pulls, and machine shoulder press.',
      },
      {
        title: 'Arm Hypertrophy Antagonist Superset',
        level: 'All Levels',
        detail:
          'Alternate rope tricep pushdowns with EZ-bar cable curls with 45s rest.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote: 'Included in all active memberships.',
    },
    safetyRules: [
      'Return cable handles and ropes to the attachment rack after finishing your exercise.',
      'Control the eccentric return so weight plates do not clank together.',
      'Allow others to work in between sets during peak evening hours.',
    ],
  },

  'lower-body-glute-bay': {
    slug: 'lower-body-glute-bay',
    name: 'Lower-Body, Leg Press & Glute Bay',
    category: 'Leg & Glute Lab',
    tagline: '45° LEG PRESS, HACK SQUAT, HIP THRUST & HAMSTRING SUITE',
    summary:
      'Dedicated lower-body strength bay featuring heavy 45-degree leg press, linear hack squat, seated/lying leg curls, quad extensions, and hip-thrust stations.',
    description:
      'Built for complete quadriceps, hamstring, glute, and calf development. Every lower-body machine is engineered with wide footplates and adjustable hip angles so lifters of all heights can train through a full, knee-safe range of motion.',
    heroImage:
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Leg Press Capacity', value: '500 kg+ Plate Load' },
      { label: 'Quad & Hamstring', value: 'Seated & Prone Curls' },
      { label: 'Glute Specialization', value: 'Hip Thrust & Cable Kickback' },
      { label: 'Calf Stations', value: 'Seated & Standing Raises' },
    ],
    features: [
      'Heavy-Duty 45° Sled Leg Press with Dual Safety Stops',
      'Linear Bearing Hack Squat & Smith Machine Station',
      'Seated Leg Extension with Adjustable Tibia Pad & Range Limiter',
      'Prone (Lying) & Seated Hamstring Curl Machines',
      'Padded Barbell Hip Thrust Bench & Glute Bridge Platform',
      'Seated Soleus & Standing Gastrocnemius Calf Raise Stations',
    ],
    equipmentSpecs: [
      {
        name: '45° Commercial Leg Press',
        spec: '4-horn loading carriage • Oversized non-slip diamond footplate',
        purpose: 'High-volume quad, glute, and adductor mass builder',
      },
      {
        name: 'Linear Hack Squat Machine',
        spec: 'Shoulder-padded carriage • Smooth linear bearings • Dual lockout handles',
        purpose: 'Strict knee-flexion quad hypertrophy with full spinal support',
      },
      {
        name: 'Seated & Prone Leg Curl Suite',
        spec: 'Biomechanically aligned knee pivot • 100kg selectorized stack',
        purpose: 'Complete shortened and lengthened hamstring development',
      },
      {
        name: 'Dedicated Hip Thrust & Split-Squat Station',
        spec: 'High-density roller pads & padded back-support bench',
        purpose: 'Glute hypertrophy and single-leg Bulgarian split squats',
      },
    ],
    trainingProtocols: [
      {
        title: 'Quad-Focused Lower Body Blueprint',
        level: 'Intermediate',
        detail:
          'Pre-exhaust with Leg Extensions (3x15), followed by Hack Squats (4x8–10) and Walking Lunges.',
      },
      {
        title: 'Posterior Chain & Glute Builder',
        level: 'All Levels',
        detail:
          'Romanian Deadlifts, Barbell Hip Thrusts, Seated Leg Curls, and Cable Glute Kickbacks.',
      },
      {
        title: 'Complete Leg Day Finisher',
        level: 'All Levels',
        detail:
          '4 sets of 15–20 controlled calf raises paired with bodyweight tibialis raises.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote: 'Included in all active memberships.',
    },
    safetyRules: [
      'Never lock out your knees violently at the top of a heavy Leg Press.',
      'Always engage the safety stop handles before exiting the Leg Press or Hack Squat.',
      'Unload all 20kg/25kg plates from the leg press sled when finished.',
    ],
  },

  'locker-and-member-amenities': {
    slug: 'locker-and-member-amenities',
    name: 'Locker, Changing & Prayer Amenities',
    category: 'Locker Facilities',
    tagline: 'SECURE LOCKERS, CHANGING ROOMS, PRAYER SPACE & SMART RECEPTION',
    summary:
      'Clean changing rooms, secure day-use lockers, washrooms, prayer space, purified hydration stations, and touchless Smart Face ID reception.',
    description:
      'At Icon Fitness Gym in Ashkona, member comfort, hygiene, and security are top priorities. From the moment you check in through our Smart Face Recognition turnstile to storing your gear in our secure lockers, every amenity is maintained throughout the day.',
    heroImage:
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1400&q=85',
    galleryImages: [
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
    ],
    keyMetrics: [
      { label: 'Access Control', value: 'Smart Face ID Gate' },
      { label: 'Storage', value: 'Secure Day-Use Lockers' },
      { label: 'Hygiene', value: 'Sanitized Changing Rooms' },
      { label: 'Hydration', value: 'Purified Water Station' },
    ],
    features: [
      'Touchless Smart Face Recognition Entry & Automated Attendance',
      'Secure Day-Use Lockers for Gym Bags & Valuables',
      'Separate, Clean Changing & Washroom Facilities',
      'Dedicated Clean Prayer Space for Timely Salah',
      'Purified Chilled & Normal Drinking Water Station',
      'Front-Desk Member Support, Renewal & Consultation Lounge',
    ],
    equipmentSpecs: [
      {
        name: 'Smart Biometric Face ID Terminal',
        spec: 'Sub-second facial verification • Real-time membership & session validation',
        purpose: 'Automatic hands-free entry and strict Ladies-Only session privacy enforcement',
      },
      {
        name: 'Secure Member Locker Banks',
        spec: 'Ventilated multi-compartment lockers for workout bags, shoes, and personal items',
        purpose: 'Keep the training floor clutter-free and your belongings safe while training',
      },
      {
        name: 'Hydration & Sanitization Stations',
        spec: 'Multi-stage RO purified water dispenser • Floor-wide equipment sanitizer sprays',
        purpose: 'Maintain hydration and gym-wide hygiene standards throughout every session',
      },
      {
        name: 'Member Consultation & Front Desk',
        spec: 'Instant membership activation, Cash/bKash/Nagad payment verification & support',
        purpose: 'Seamless onboarding, plan renewals, and trainer assignment assistance',
      },
    ],
    trainingProtocols: [
      {
        title: 'Smart Biometric Check-In Protocol',
        level: 'All Members',
        detail:
          'Look at the entrance terminal upon arrival—your membership validity is verified automatically.',
      },
      {
        title: 'Clean Indoor Footwear Policy',
        level: 'Mandatory',
        detail:
          'Switch from outside street footwear into clean indoor training shoes before stepping onto the floor.',
      },
      {
        title: 'Day-Use Locker Etiquette',
        level: 'All Members',
        detail:
          'Lockers are provided for active workout duration; retrieve all items before departing.',
      },
    ],
    sessionAccess: {
      generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
      fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
      accessNote:
        'During the 1:00 PM – 3:30 PM Ladies-Only session, the entire gym floor and amenities are exclusively reserved for Female Members and Female Staff.',
    },
    safetyRules: [
      'Do not leave valuables overnight in day-use lockers.',
      'Bring a personal sweat towel and reusable water bottle to every workout.',
      'Report any maintenance or front-desk assistance needs immediately to staff.',
    ],
  },
};

// Alias mappings so every Hero card and Moving Stream card resolves to a dedicated rich detail view
export const SLUG_ALIASES: Record<string, string> = {
  'pro-strength-floor': 'free-weights-barbell-bay',
  'commercial-cardio-deck': 'cardio-endurance-deck',
  'athletic-sled-functional-turf': 'personal-training-turf',
  'coach-guided-barbell-sessions': 'olympic-lifting-platforms',
};

// Curated list of all 8 showcase zones for the Training Floor Architecture grid
export const ALL_SHOWCASE_ZONES: FacilityZoneDetail[] = [
  FACILITY_ZONES_CATALOG['cardio-endurance-deck'],
  FACILITY_ZONES_CATALOG['strength-training-zone'],
  FACILITY_ZONES_CATALOG['free-weights-barbell-bay'],
  FACILITY_ZONES_CATALOG['dedicated-ladies-studio'],
  FACILITY_ZONES_CATALOG['personal-training-turf'],
  FACILITY_ZONES_CATALOG['olympic-lifting-platforms'],
  FACILITY_ZONES_CATALOG['pin-loaded-isolation-machines'],
  FACILITY_ZONES_CATALOG['lower-body-glute-bay'],
  FACILITY_ZONES_CATALOG['locker-and-member-amenities'],
];

export function resolveFacilityZoneDetail(
  slug: string,
  dbFacilities: FacilityItem[] = [],
): FacilityZoneDetail {
  if (FACILITY_ZONES_CATALOG[slug]) {
    return FACILITY_ZONES_CATALOG[slug];
  }

  const aliasedSlug = SLUG_ALIASES[slug];
  if (aliasedSlug && FACILITY_ZONES_CATALOG[aliasedSlug]) {
    return FACILITY_ZONES_CATALOG[aliasedSlug];
  }

  const dbMatch = dbFacilities.find((f) => f.slug === slug || f.id === slug);
  if (dbMatch) {
    return {
      slug: dbMatch.slug,
      name: dbMatch.name,
      category: dbMatch.category,
      tagline: `${dbMatch.category.toUpperCase()} • ICON FITNESS GYM ASHKONA`,
      summary: dbMatch.summary || dbMatch.description,
      description: dbMatch.description,
      heroImage:
        dbMatch.imageUrl ||
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85',
      galleryImages: [
        dbMatch.imageUrl ||
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80',
      ],
      keyMetrics: [
        { label: 'Zone Category', value: dbMatch.category },
        { label: 'Equipment Grade', value: 'Commercial Series' },
        { label: 'Coach Support', value: 'On-Floor Guidance' },
        { label: 'Access Control', value: 'Smart Face ID' },
      ],
      features:
        dbMatch.features?.length > 0
          ? dbMatch.features
          : [
              'Commercial Biomechanics Equipment',
              'Certified Floor Trainer Supervision',
              'Ventilated & Sanitized Training Zone',
              'Included in All Active Memberships',
            ],
      equipmentSpecs: (dbMatch.features || []).map((feat) => ({
        name: feat,
        spec: 'Commercial Heavy-Duty Specification',
        purpose: `Engineered for ${dbMatch.category.toLowerCase()} progression and safety`,
      })),
      trainingProtocols: [
        {
          title: 'Guided Zone Orientation',
          level: 'All Levels',
          detail:
            'Ask any on-floor trainer for a complete form check and equipment setup walkthrough.',
        },
      ],
      sessionAccess: {
        generalHours: 'Sat–Thu: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
        ladiesHours: 'Sat–Thu: 01:00 PM – 03:30 PM (Only Female)',
        fridayHours: 'Friday: 05:00 PM – 11:00 PM (All Members)',
        accessNote:
          'Available to all members with an active membership at Icon Fitness Gym Ashkona.',
      },
      safetyRules: [
        'Use clean indoor athletic footwear on the training floor.',
        'Re-rack weights and wipe down pads after completing your sets.',
      ],
    };
  }

  return FACILITY_ZONES_CATALOG['free-weights-barbell-bay'];
}
