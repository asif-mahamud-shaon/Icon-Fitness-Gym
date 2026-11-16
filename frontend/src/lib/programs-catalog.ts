import { WorkoutProgram } from '@/types';

export interface EnrichedProgramMeta {
  slug: string;
  splitType: string;
  sessionMinutes: string;
  caloriesPerSession: string;
  equipmentFocus: string[];
  weeklyStructure: string[];
  targetAudience: string;
}

export const ENRICHED_PROGRAM_META: Record<string, EnrichedProgramMeta> = {
  'foundational-strength-hypertrophy': {
    slug: 'foundational-strength-hypertrophy',
    splitType: 'Upper / Lower 4-Day Split',
    sessionMinutes: '60 – 75 Mins',
    caloriesPerSession: '420 – 580 kcal',
    equipmentFocus: [
      'Olympic Barbells & Power Racks',
      '2.5–50kg Dumbbell Line',
      'Dual Cable Pulleys',
    ],
    weeklyStructure: [
      'Day 1: Heavy Lower Body (Squat & Posterior Chain)',
      'Day 2: Upper Body Push & Horizontal Pull',
      'Day 3: Hypertrophy Lower & Core Bracing',
      'Day 4: Upper Body Volume & Arm Architecture',
    ],
    targetAudience:
      'Lifters seeking dense muscular hypertrophy, progressive compound strength, and balanced joint symmetry.',
  },
  'athletic-fat-loss-conditioning': {
    slug: 'athletic-fat-loss-conditioning',
    splitType: 'Metabolic Circuit + HIIT Turf',
    sessionMinutes: '45 – 55 Mins',
    caloriesPerSession: '500 – 720 kcal',
    equipmentFocus: [
      'Kettlebells & Battle Ropes',
      'Assault Air Bikes & Rowers',
      'Functional Sled Turf',
    ],
    weeklyStructure: [
      'Day 1: Full-Body Metabolic Resistance Circuit',
      'Day 2: Sled Push, Battle Rope & Core Conditioning',
      'Day 3: Lower-Body Density & Incline Cardio Intervals',
      'Day 4: Upper-Body Superset & Rowing Ergometer Finisher',
    ],
    targetAudience:
      'Members focused on rapid body-fat reduction, cardiovascular stamina, and lean muscle retention.',
  },
  'beginner-full-body-blueprint': {
    slug: 'beginner-full-body-blueprint',
    splitType: '3-Day Full-Body Foundation',
    sessionMinutes: '45 – 50 Mins',
    caloriesPerSession: '320 – 450 kcal',
    equipmentFocus: [
      'Pin-Loaded Biomechanics Machines',
      'Light-to-Moderate Dumbbells',
      'Core & Mobility Mats',
    ],
    weeklyStructure: [
      'Day 1: Machine Squat, Chest Press, Lat Pulldown & Core',
      'Day 2: Hinges, Seated Row, Overhead Press & Stability',
      'Day 3: Leg Press, Cable Fly, Arm Isolation & Stretching',
    ],
    targetAudience:
      'First-time gym members building safe movement mechanics, machine confidence, and consistent training habits.',
  },
  'powerlifting-barbell-peaking': {
    slug: 'powerlifting-barbell-peaking',
    splitType: '4-Day Squat / Bench / Deadlift System',
    sessionMinutes: '70 – 85 Mins',
    caloriesPerSession: '450 – 620 kcal',
    equipmentFocus: [
      'Calibrated Olympic Plates',
      'Competition Power Cages',
      'Deadlift Platforms',
    ],
    weeklyStructure: [
      'Day 1: Competition Back Squat & Pause Squat Accessories',
      'Day 2: Competition Flat Bench Press & Tricep Lockout',
      'Day 3: Conventional / Sumo Deadlift & Heavy Back Rows',
      'Day 4: Overhead Barbell Press & Secondary Bench Volume',
    ],
    targetAudience:
      'Intermediate-to-advanced lifters prioritizing maximal 1RM force production on the big three barbell lifts.',
  },
  'ladies-sculpt-glute-core-studio': {
    slug: 'ladies-sculpt-glute-core-studio',
    splitType: '4-Day Lower Sculpt, Posture & Metabolic Tone',
    sessionMinutes: '50 – 60 Mins',
    caloriesPerSession: '380 – 520 kcal',
    equipmentFocus: [
      'Hip Thrust & Glute Isolation',
      'Cable Ankle/Pulley Stations',
      'Kettlebells & Resistance Bands',
    ],
    weeklyStructure: [
      'Day 1: Glute Bridge, Romanian Deadlift & Goblet Squat',
      'Day 2: Upper Posture, Back Sculpting & Core Stability',
      'Day 3: Unilateral Split Squats, Cable Kickbacks & Abs',
      'Day 4: Low-Impact Metabolic Conditioning & Mobility Flow',
    ],
    targetAudience:
      'Designed for our Dedicated Ladies-Only Window (1:00 PM – 3:30 PM Sat–Thu) or general sessions with Female Coach guidance.',
  },
  'executive-athletic-longevity-custom': {
    slug: 'executive-athletic-longevity-custom',
    splitType: '3-to-5 Day Custom Periodized Split',
    sessionMinutes: '45 – 60 Mins',
    caloriesPerSession: '400 – 550 kcal',
    equipmentFocus: [
      'Dual Adjustable Cable Towers',
      'Selectorized Strength Fleet',
      'Heart-Rate Zone Cardio Deck',
    ],
    weeklyStructure: [
      'Day 1: Push/Pull Upper Body & Thoracic Mobility',
      'Day 2: Joint-Friendly Lower Body & Core Decompression',
      'Day 3: Zone-2 Aerobic Endurance & Functional Carries',
      'Day 4: Custom Weak-Point Hypertrophy & Recovery',
    ],
    targetAudience:
      'Busy professionals and custom-coached members requiring tailored volume, joint longevity, and energy optimization.',
  },
};

export const FALLBACK_SIGNATURE_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'prog-strength-01',
    title: 'Foundational Strength & Muscle Architecture',
    slug: 'foundational-strength-hypertrophy',
    description:
      'A structured 8-week compound and accessory hypertrophy protocol designed to build dense muscular strength, progressive overload capacity, and joint resilience.',
    goal: 'MUSCLE_BUILDING',
    difficulty: 'INTERMEDIATE',
    durationWeeks: 8,
    daysPerWeek: 4,
    isPublic: true,
    isActive: true,
    coverImageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    exercises: [
      {
        id: 'ex-1',
        dayNumber: 1,
        orderIndex: 1,
        sets: 4,
        reps: '6-8',
        restSeconds: 120,
        tempo: '3-1-1-0',
        notes: 'Brace core 360° and drive forcefully out of the bottom.',
        exercise: {
          id: 'e1',
          name: 'Barbell Back Squat',
          slug: 'barbell-back-squat',
          targetMuscleGroup: 'Quadriceps, Glutes & Core',
          equipmentRequired: 'Power Cage & Olympic Barbell',
          difficulty: 'INTERMEDIATE',
          instructions:
            'Set the barbell at upper-chest height. Unrack, brace your torso, and descend until thighs break parallel while keeping knees tracking over toes.',
        },
      },
      {
        id: 'ex-2',
        dayNumber: 1,
        orderIndex: 2,
        sets: 4,
        reps: '8-10',
        restSeconds: 90,
        tempo: '2-1-1-0',
        notes: 'Keep shoulder blades retracted into the pad throughout.',
        exercise: {
          id: 'e2',
          name: 'Barbell Flat Bench Press',
          slug: 'barbell-bench-press',
          targetMuscleGroup: 'Pectorals, Anterior Delts & Triceps',
          equipmentRequired: 'Flat Olympic Bench & Barbell',
          difficulty: 'INTERMEDIATE',
          instructions:
            'Plant feet firmly, lower the bar under control to mid-sternum, pause briefly, and press explosively to lockout.',
        },
      },
      {
        id: 'ex-3',
        dayNumber: 2,
        orderIndex: 1,
        sets: 4,
        reps: '8-10',
        restSeconds: 90,
        tempo: '3-1-1-0',
        notes: 'Maintain a neutral spine and feel the stretch in hamstrings.',
        exercise: {
          id: 'e3',
          name: 'Romanian Deadlift (RDL)',
          slug: 'romanian-deadlift',
          targetMuscleGroup: 'Hamstrings, Glutes & Spinal Erectors',
          equipmentRequired: 'Olympic Barbell or Heavy Dumbbells',
          difficulty: 'INTERMEDIATE',
          instructions:
            'Hinge hips backward with a soft knee bend, keeping the barbell close to shins until mid-shin depth, then drive hips forward.',
        },
      },
      {
        id: 'ex-4',
        dayNumber: 2,
        orderIndex: 2,
        sets: 3,
        reps: '10-12',
        restSeconds: 75,
        tempo: '2-0-1-1',
        notes: 'Lead with elbows down toward hips; avoid excessive leaning.',
        exercise: {
          id: 'e4',
          name: 'Wide-Grip Cable Lat Pulldown',
          slug: 'wide-grip-lat-pulldown',
          targetMuscleGroup: 'Latissimus Dorsi & Upper Back',
          equipmentRequired: 'Selectorized Lat Pulldown Tower',
          difficulty: 'BEGINNER',
          instructions:
            'Depress shoulder blades first, then pull the bar smoothly to your upper collarbone while squeezing lats.',
        },
      },
    ],
  },
  {
    id: 'prog-fatloss-02',
    title: 'Metabolic Fat Loss & Athletic Conditioning',
    slug: 'athletic-fat-loss-conditioning',
    description:
      'High-output resistance circuits paired with progressive cardiovascular conditioning to maximize caloric expenditure while preserving lean muscle mass.',
    goal: 'WEIGHT_LOSS',
    difficulty: 'ALL_LEVELS',
    durationWeeks: 6,
    daysPerWeek: 4,
    isPublic: true,
    isActive: true,
    coverImageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
    exercises: [
      {
        id: 'ex-fl-1',
        dayNumber: 1,
        orderIndex: 1,
        sets: 4,
        reps: '12-15',
        restSeconds: 60,
        notes: 'Explosive hip snap at the top of every swing.',
        exercise: {
          id: 'ef1',
          name: 'Two-Hand Kettlebell Russian Swing',
          slug: 'kettlebell-russian-swing',
          targetMuscleGroup: 'Posterior Chain, Glutes & Conditioning',
          equipmentRequired: 'Cast-Iron Kettlebell',
          difficulty: 'ALL_LEVELS',
          instructions:
            'Hike the kettlebell between hips and snap hips forward to float the bell to chest height while keeping arms relaxed.',
        },
      },
      {
        id: 'ex-fl-2',
        dayNumber: 1,
        orderIndex: 2,
        sets: 4,
        reps: '30 sec sprint',
        restSeconds: 45,
        notes: 'Maintain rapid alternating wave cadence.',
        exercise: {
          id: 'ef2',
          name: 'Heavy Battle Rope Alternating Waves',
          slug: 'battle-rope-waves',
          targetMuscleGroup: 'Shoulders, Core & Anaerobic Output',
          equipmentRequired: 'Functional Turf Battle Ropes',
          difficulty: 'ALL_LEVELS',
          instructions:
            'Assume an athletic half-squat stance, brace abs, and drive alternating arm waves down the length of the rope.',
        },
      },
      {
        id: 'ex-fl-3',
        dayNumber: 2,
        orderIndex: 1,
        sets: 4,
        reps: '20m push',
        restSeconds: 75,
        notes: 'Drive through the balls of your feet with a 45° torso angle.',
        exercise: {
          id: 'ef3',
          name: 'Weighted Turf Power Sled Drive',
          slug: 'turf-power-sled-drive',
          targetMuscleGroup: 'Quads, Calves, Glutes & Lungs',
          equipmentRequired: 'Functional Turf & Prowler Sled',
          difficulty: 'INTERMEDIATE',
          instructions:
            'Grip upright posts with locked arms, lean forward, and take powerful marching or sprinting strides across the turf lane.',
        },
      },
    ],
  },
  {
    id: 'prog-beginner-03',
    title: 'Beginner Full-Body Gym Blueprint',
    slug: 'beginner-full-body-blueprint',
    description:
      'Step-by-step introduction to commercial gym machines, free weights, and movement mechanics for new members starting their fitness journey in Ashkona.',
    goal: 'BEGINNER',
    difficulty: 'BEGINNER',
    durationWeeks: 4,
    daysPerWeek: 3,
    isPublic: true,
    isActive: true,
    coverImageUrl:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80',
    exercises: [
      {
        id: 'ex-bg-1',
        dayNumber: 1,
        orderIndex: 1,
        sets: 3,
        reps: '10-12',
        restSeconds: 75,
        notes: 'Keep lower back flat against the angled backrest pad.',
        exercise: {
          id: 'eb1',
          name: '45-Degree Plate-Loaded Leg Press',
          slug: '45-degree-leg-press',
          targetMuscleGroup: 'Quadriceps, Hamstrings & Glutes',
          equipmentRequired: '45° Leg Press Station',
          difficulty: 'BEGINNER',
          instructions:
            'Place feet shoulder-width apart on the sled platform, release safety catches, lower to 90° knee flexion, and press back up without locking knees.',
        },
      },
      {
        id: 'ex-bg-2',
        dayNumber: 1,
        orderIndex: 2,
        sets: 3,
        reps: '10-12',
        restSeconds: 75,
        notes: 'Control the return phase for 2 full seconds.',
        exercise: {
          id: 'eb2',
          name: 'Selectorized Converging Chest Press',
          slug: 'selectorized-chest-press',
          targetMuscleGroup: 'Chest, Front Deltoids & Triceps',
          equipmentRequired: 'Pin-Loaded Chest Press Machine',
          difficulty: 'BEGINNER',
          instructions:
            'Adjust seat height so handles align with mid-chest. Press handles forward until arms extend, then return smoothly.',
        },
      },
      {
        id: 'ex-bg-3',
        dayNumber: 1,
        orderIndex: 3,
        sets: 3,
        reps: '45 sec hold',
        restSeconds: 60,
        notes: 'Squeeze glutes and quads to prevent lower-back arch.',
        exercise: {
          id: 'eb3',
          name: 'Abdominal Forearm Plank',
          slug: 'weighted-core-plank',
          targetMuscleGroup: 'Core & Transverse Abdominis',
          equipmentRequired: 'Exercise Mat',
          difficulty: 'BEGINNER',
          instructions:
            'Hold a straight line from shoulders to heels on forearms and toes while breathing steadily.',
        },
      },
    ],
  },
  {
    id: 'prog-power-04',
    title: 'Barbell Strength & Powerlifting Peaking System',
    slug: 'powerlifting-barbell-peaking',
    description:
      'High-intensity progressive barbell periodization focusing on squat, bench press, and deadlift mechanics, neural force output, and heavy accessory builders.',
    goal: 'STRENGTH_TRAINING',
    difficulty: 'ADVANCED',
    durationWeeks: 10,
    daysPerWeek: 4,
    isPublic: true,
    isActive: true,
    coverImageUrl:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=80',
    exercises: [
      {
        id: 'ex-pw-1',
        dayNumber: 1,
        orderIndex: 1,
        sets: 5,
        reps: '3-5',
        restSeconds: 180,
        notes: 'Use safety spotter arms inside the power rack at all times.',
        exercise: {
          id: 'ep1',
          name: 'Competition Low-Bar Back Squat',
          slug: 'competition-back-squat',
          targetMuscleGroup: 'Quads, Glutes, Adductors & Spinal Erectors',
          equipmentRequired: 'Power Cage & Calibrated Barbell',
          difficulty: 'ADVANCED',
          instructions:
            'Wedge upper back tightly under the bar, take a deep diaphragmatic breath into your belt, squat to legal depth, and drive upward.',
        },
      },
      {
        id: 'ex-pw-2',
        dayNumber: 2,
        orderIndex: 1,
        sets: 5,
        reps: '3-5',
        restSeconds: 150,
        notes: '1-second competition pause on the chest on every repetition.',
        exercise: {
          id: 'ep2',
          name: 'Paused Competition Barbell Bench Press',
          slug: 'paused-bench-press',
          targetMuscleGroup: 'Pectorals, Triceps & Anterior Delts',
          equipmentRequired: 'Competition Bench & Olympic Bar',
          difficulty: 'ADVANCED',
          instructions:
            'Establish leg drive, lower the barbell to the lower sternum, hold motionless for 1 count, and press to lockout.',
        },
      },
      {
        id: 'ex-pw-3',
        dayNumber: 3,
        orderIndex: 1,
        sets: 4,
        reps: '3-5',
        restSeconds: 180,
        notes: 'Pull the slack out of the bar before initiating floor drive.',
        exercise: {
          id: 'ep3',
          name: 'Competition Platform Deadlift',
          slug: 'competition-deadlift',
          targetMuscleGroup: 'Hamstrings, Glutes, Lats & Trap Architecture',
          equipmentRequired: 'Deadlift Platform & Bumper Plates',
          difficulty: 'ADVANCED',
          instructions:
            'Set mid-foot under the bar, engage lats ("protect your armpits"), push the floor away with your legs, and lock hips and knees simultaneously.',
        },
      },
    ],
  },
  {
    id: 'prog-ladies-05',
    title: 'Ladies Tone, Glute Sculpt & Core Conditioning',
    slug: 'ladies-sculpt-glute-core-studio',
    description:
      'Engineered specifically for our female members (available during the 1:00 PM – 3:30 PM Ladies-Only Window or general sessions), combining lower-body sculpting, posture alignment, and metabolic toning.',
    goal: 'FITNESS_IMPROVEMENT',
    difficulty: 'ALL_LEVELS',
    durationWeeks: 6,
    daysPerWeek: 4,
    isPublic: true,
    isActive: true,
    coverImageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80',
    exercises: [
      {
        id: 'ex-ld-1',
        dayNumber: 1,
        orderIndex: 1,
        sets: 4,
        reps: '10-12',
        restSeconds: 75,
        notes: 'Hold a 2-second peak glute contraction at the top of each rep.',
        exercise: {
          id: 'el1',
          name: 'Barbell / Padded Hip Thrust',
          slug: 'barbell-hip-thrust',
          targetMuscleGroup: 'Gluteus Maximus & Hamstrings',
          equipmentRequired: 'Hip Thrust Bench & Padded Barbell',
          difficulty: 'ALL_LEVELS',
          instructions:
            'Rest upper scapulae against the bench pad, plant feet so shins are vertical at the top, and drive hips upward while keeping chin tucked.',
        },
      },
      {
        id: 'ex-ld-2',
        dayNumber: 1,
        orderIndex: 2,
        sets: 3,
        reps: '12 each leg',
        restSeconds: 60,
        notes: 'Slight forward torso lean increases glute recruitment.',
        exercise: {
          id: 'el2',
          name: 'Dumbbell Bulgarian Split Squat',
          slug: 'bulgarian-split-squat',
          targetMuscleGroup: 'Quads, Glutes & Single-Leg Balance',
          equipmentRequired: 'Dumbbells & Utility Bench',
          difficulty: 'INTERMEDIATE',
          instructions:
            'Elevate rear instep on the bench, lower your back knee toward the floor under control, and drive through your front heel.',
        },
      },
      {
        id: 'ex-ld-3',
        dayNumber: 2,
        orderIndex: 1,
        sets: 3,
        reps: '12-15',
        restSeconds: 60,
        notes: 'Pull rope attachment toward forehead while rotating thumbs back.',
        exercise: {
          id: 'el3',
          name: 'Seated Cable Face Pull & Posture Row',
          slug: 'cable-face-pull',
          targetMuscleGroup: 'Rear Delts, Rhomboids & Upper Back Posture',
          equipmentRequired: 'Dual Adjustable Cable Pulley',
          difficulty: 'BEGINNER',
          instructions:
            'Set pulley at upper-chest height with a rope attachment. Pull toward your face while externally rotating shoulders.',
        },
      },
    ],
  },
  {
    id: 'prog-custom-06',
    title: 'Custom 1-on-1 Personal Transformation Protocol',
    slug: 'executive-athletic-longevity-custom',
    description:
      'Individually tailored periodization built by your assigned Icon Fitness coach around your work schedule, orthopedic history, and specific body-recomposition targets.',
    goal: 'CUSTOM',
    difficulty: 'ALL_LEVELS',
    durationWeeks: 12,
    daysPerWeek: 4,
    isPublic: true,
    isActive: true,
    coverImageUrl:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80',
    exercises: [
      {
        id: 'ex-cu-1',
        dayNumber: 1,
        orderIndex: 1,
        sets: 4,
        reps: '8-12',
        restSeconds: 75,
        notes: 'Angle and load calibrated to your personal biomechanics assessment.',
        exercise: {
          id: 'ec1',
          name: 'Incline Dumbbell Neutral-Grip Press',
          slug: 'incline-dumbbell-press',
          targetMuscleGroup: 'Upper Chest, Shoulders & Triceps',
          equipmentRequired: 'Adjustable Bench & Hex Dumbbells',
          difficulty: 'ALL_LEVELS',
          instructions:
            'Set bench to a 30° incline. Lower dumbbells with elbows at a 45° angle to protect shoulder capsules, then press smoothly to the top.',
        },
      },
      {
        id: 'ex-cu-2',
        dayNumber: 1,
        orderIndex: 2,
        sets: 4,
        reps: '10-12',
        restSeconds: 75,
        notes: 'Chest-supported position eliminates lower-back fatigue.',
        exercise: {
          id: 'ec2',
          name: 'Chest-Supported Incline Dumbbell Row',
          slug: 'chest-supported-row',
          targetMuscleGroup: 'Mid-Back, Lats & Rear Deltoids',
          equipmentRequired: 'Adjustable Incline Bench & Dumbbells',
          difficulty: 'ALL_LEVELS',
          instructions:
            'Lie chest-down on a 30–45° incline bench, row dumbbells toward your hip crease, and pause for 1 second at peak contraction.',
        },
      },
    ],
  },
];

export function mergeWithSignaturePrograms(
  apiPrograms: WorkoutProgram[],
  goalFilter: string = 'ALL',
): WorkoutProgram[] {
  const bySlug = new Map<string, WorkoutProgram>();

  for (const fallback of FALLBACK_SIGNATURE_PROGRAMS) {
    bySlug.set(fallback.slug, fallback);
  }
  for (const apiProg of apiPrograms) {
    const existing = bySlug.get(apiProg.slug);
    bySlug.set(apiProg.slug, {
      ...existing,
      ...apiProg,
      exercises:
        apiProg.exercises && apiProg.exercises.length > 0
          ? apiProg.exercises
          : existing?.exercises || [],
    });
  }

  const all = Array.from(bySlug.values());
  if (!goalFilter || goalFilter === 'ALL') {
    return all;
  }
  return all.filter((p) => p.goal === goalFilter);
}

export function resolveProgramBySlug(
  slug: string,
  apiProgram: WorkoutProgram | null,
): WorkoutProgram | null {
  const fallback = FALLBACK_SIGNATURE_PROGRAMS.find((p) => p.slug === slug);
  if (apiProgram && fallback) {
    return {
      ...fallback,
      ...apiProgram,
      exercises:
        apiProgram.exercises && apiProgram.exercises.length > 0
          ? apiProgram.exercises
          : fallback.exercises,
    };
  }
  return apiProgram || fallback || null;
}

