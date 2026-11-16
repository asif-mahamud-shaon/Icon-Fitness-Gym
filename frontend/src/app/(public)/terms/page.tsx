import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Dumbbell,
  Calendar,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

const TERMS_CLAUSES = [
  {
    id: 'membership-activation',
    number: '01',
    title: 'Membership Eligibility, Onboarding & Account Activation',
    summary: 'Registration requirements, Member ID issuance, and payment verification.',
    paragraphs: [
      'Every individual joining Icon Fitness Gym (Ashkona, Dakshinkhan, Dhaka-1230, Bangladesh) must complete an accurate onboarding profile with their legal name, active phone number, email address, gender, and emergency contact details.',
      'Upon registration, you are assigned a unique official Member ID (e.g., IFG-2026-XXXX). Submitting a payment reference online or at the front desk places a membership in PENDING verification until confirmed by authorized Icon Fitness staff.',
    ],
    rules: [
      'Active Membership Requirement: Physical floor entry and group class seat reservations require an ACTIVE, non-expired membership.',
      'Automated Expiry Enforcement: When a membership reaches its end date, floor access and booking privileges pause automatically until renewed.',
      'Official Digital Receipts: Every verified Cash, bKash, Nagad, Rocket, or POS Card payment generates an official digital receipt in your Member Portal.',
    ],
  },
  {
    id: 'operating-hours-ladies-slot',
    number: '02',
    title: 'Official Operating Hours & Dedicated Ladies-Only Window',
    summary: 'Daily session schedule and automated gender-window access rules.',
    paragraphs: [
      'Icon Fitness Gym operates on a structured daily schedule in Asia/Dhaka time. Both our Front Desk and our Smart Biometric Access Control Gate strictly enforce the following session windows:',
    ],
    rules: [
      'Saturday – Thursday (07:00 AM – 01:00 PM): General Session open to All Active Members (Male & Female).',
      'Saturday – Thursday (01:00 PM – 03:30 PM): DEDICATED LADIES-ONLY SESSION. Strictly reserved for active Female Members and supervised on-floor by our certified Female Trainer. Male member check-ins are automatically blocked by the access control system during this 2.5-hour window.',
      'Saturday – Thursday (03:30 PM – 11:00 PM): General Session open to All Active Members (Male & Female).',
      'Friday Schedule (05:00 PM – 11:00 PM): Evening Session open to All Active Members (Male & Female).',
    ],
  },
  {
    id: 'biometric-non-transferable',
    number: '03',
    title: 'Biometric Check-In & Non-Transferability of Membership',
    summary: 'Personal use of Member ID, Face ID gate protocol, and anti-tailgating policy.',
    paragraphs: [
      'All Icon Fitness Gym memberships, Member Portal accounts, and biometric enrollments are strictly personal and non-transferable to any friend, family member, or third party.',
    ],
    rules: [
      'Mandatory Check-In: Every member must check in at the entrance via the Smart Face Recognition Kiosk or Front Desk verification before stepping onto the training floor.',
      'Zero Tailgating Policy: Holding the turnstile or security door open for an unverified individual or sharing Member Portal credentials is grounds for immediate membership suspension.',
    ],
  },
  {
    id: 'floor-etiquette-safety',
    number: '04',
    title: 'Gym Floor Etiquette, Hygiene & Equipment Care',
    summary: 'Footwear, personal towels, weight re-racking, and safe lifting standards.',
    paragraphs: [
      'To preserve our commercial biomechanics machines, Olympic barbells, and climate-controlled training environment, all members must adhere to our floor governance rules:',
    ],
    rules: [
      'Clean Indoor Training Shoes: Street sandals, open-toed footwear, barefoot lifting, or muddy outdoor shoes are strictly prohibited on the gym floor and turf.',
      'Personal Workout Towel: Carry a clean sweat towel and wipe down upholstered benches and cardio consoles after use.',
      'Mandatory Weight Re-Racking: Strip barbells, leg presses, and plate-loaded machines and return all dumbbells (2.5 kg – 50 kg) to their numbered rack slots immediately after your set.',
      'Controlled Barbell Drops: Perform heavy deadlifts and Olympic lifts exclusively on designated shock-absorbing platforms and use safety spotter arms inside power cages.',
    ],
  },
  {
    id: 'class-booking-cutoff',
    number: '05',
    title: 'Group Class Reservations, Quotas & 2-Hour Cutoff',
    summary: 'Real-time seat reservation rules and fair-access cancellation policy.',
    paragraphs: [
      'Coach-led strength, HIIT conditioning, and mobility classes have fixed maximum seat capacities enforced by transactional booking locks in our database.',
    ],
    rules: [
      'Weekly Plan Quotas: Each membership tier includes a designated maximum number of group class reservations per week (4, 6, or 10 classes/week).',
      '2-Hour Cancellation Cutoff: If you cannot attend a booked session, you must cancel your reservation in the Member Portal at least 2 hours before the scheduled start time so another member can book the seat.',
      'Repeated No-Shows: Repeatedly failing to attend reserved classes without timely cancellation may temporarily restrict advance booking privileges.',
    ],
  },
  {
    id: 'health-medical-disclaimer',
    number: '06',
    title: 'Health Readiness, Coaching Guidance & Medical Disclosure',
    summary: 'Physical readiness affirmation and safe execution of workout programs.',
    paragraphs: [
      'High-output resistance and cardiovascular training carries inherent physical exertion. By training at Icon Fitness Gym, you affirm that you are physically fit to participate in strength and conditioning exercise.',
    ],
    rules: [
      'Pre-Existing Conditions: Inform your assigned trainer of any orthopedic injuries, cardiovascular conditions, or post-surgical restrictions prior to starting a workout blueprint.',
      'Immediate Stop on Discomfort: Cease exercise immediately and notify on-floor coaching staff if you experience dizziness, acute joint pain, or shortness of breath.',
    ],
  },
  {
    id: 'lockers-valuables',
    number: '07',
    title: 'Day-Use Lockers, Personal Valuables & Facility Conduct',
    summary: 'Locker clearing rules and respectful community conduct.',
    paragraphs: [
      'Secure day-use lockers are provided for members while actively training inside the Ashkona facility.',
    ],
    rules: [
      'Same-Day Locker Clearance: Day lockers must be emptied before departing the gym at closing time (11:00 PM).',
      'Respectful Club Culture: Harassment, intimidation, unauthorized commercial photography/filming of other members, or disrespectful conduct toward staff and trainers will result in membership revocation.',
    ],
  },
  {
    id: 'dues-freeze-governing-law',
    number: '08',
    title: 'Membership Dues, Freeze Privileges & Governing Law',
    summary: 'BDT tariff policies, medical/travel freeze eligibility, and Dhaka jurisdiction.',
    paragraphs: [
      'All membership fees and admission charges are denominated in Bangladeshi Taka (BDT). Paid admission fees and activated membership periods are non-refundable except where explicitly approved by Gym Administration under documented medical circumstances.',
    ],
    rules: [
      'Membership Freeze Eligibility: Quarterly (90-Day) and Annual (365-Day) memberships qualify for administrative freeze requests for documented travel or medical recovery.',
      'Governing Jurisdiction: These Terms and Conditions are governed by the laws of the People’s Republic of Bangladesh, with venue in Dhaka.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-14">
      {/* ====================================================================
          1. HERO DOCUMENT BANNER
          ==================================================================== */}
      <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] p-6 sm:p-10 lg:p-14 shadow-2xl">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15">
              <FileText className="w-4 h-4 text-[#C7F464]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
                MEMBER AGREEMENT &amp; FLOOR GOVERNANCE CHARTER
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-black/80 border border-white/15 text-xs font-mono text-zinc-300">
              DOC REF: IFG-TERMS-2026 • ASHKONA, DHAKA
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide text-white leading-[0.95]">
              TERMS &amp; <span className="text-[#C7F464]">CONDITIONS</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Official membership terms, daily General and Ladies-Only operating
              schedules, Smart Face ID check-in rules, class reservation cutoffs,
              and training floor safety standards at Icon Fitness Gym Ashkona.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/15">
            {[
              {
                icon: <Clock className="w-4 h-4 text-[#C7F464]" />,
                label: 'GENERAL SESSIONS',
                value: '7:00 AM–1:00 PM & 3:30–11 PM',
                sub: 'Sat–Thu • Fri: 5:00 PM–11:00 PM',
              },
              {
                icon: <ShieldCheck className="w-4 h-4 text-pink-400" />,
                label: 'LADIES-ONLY WINDOW',
                value: '1:00 PM – 3:30 PM',
                sub: 'Sat–Thu • Female Members Only',
              },
              {
                icon: <Calendar className="w-4 h-4 text-[#C7F464]" />,
                label: 'BOOKING CUTOFF',
                value: '2 Hours Prior',
                sub: 'Fair Class Seat Release',
              },
              {
                icon: <ScanFace className="w-4 h-4 text-[#C7F464]" />,
                label: 'ACCESS CONTROL',
                value: 'Non-Transferable ID',
                sub: 'Face ID & Portal Verified',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-2xl bg-black/75 border border-white/10 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C7F464]">
                    {item.label}
                  </span>
                  {item.icon}
                </div>
                <p className="font-display text-xl uppercase tracking-wide text-white">
                  {item.value}
                </p>
                <p className="text-[11px] text-zinc-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. STICKY CLAUSE DIRECTORY + 8 DETAILED SECTIONS
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          <Card className="p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C7F464]">
              <FileText className="w-4 h-4" />
              <span>AGREEMENT CLAUSES</span>
            </div>
            <nav className="space-y-1.5">
              {TERMS_CLAUSES.map((clause) => (
                <a
                  key={clause.id}
                  href={`#${clause.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:text-[#C7F464] hover:bg-[#C7F464]/10 transition-colors no-underline"
                >
                  <span className="font-mono font-bold text-[#C7F464]">
                    {clause.number}
                  </span>
                  <span className="truncate">{clause.title}</span>
                </a>
              ))}
            </nav>
          </Card>

          <Card className="p-6 rounded-3xl space-y-4">
            <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
              ADMINISTRATION &amp; FRONT DESK
            </p>
            <div className="space-y-2.5 text-xs text-[#A1A1AA]">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                <span>
                  Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh
                </span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C7F464] shrink-0" />
                <span className="text-white font-mono">01685475975</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C7F464] shrink-0" />
                <span className="text-white">info@iconfitnessgym.com</span>
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/privacy-policy">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Privacy &amp; Biometric Policy
                </Button>
              </Link>
              <Link href="/cancellation-policy">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Cancellation &amp; Freeze Policy
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right 8 Cols: Detailed Clauses */}
        <div className="lg:col-span-8 space-y-6">
          {TERMS_CLAUSES.map((clause) => (
            <Card
              key={clause.id}
              id={clause.id}
              className="p-6 sm:p-8 rounded-3xl space-y-4 scroll-mt-28 border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#C7F464] !text-[#090909] font-mono text-xs font-bold">
                    CLAUSE {clause.number}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white">
                    {clause.title}
                  </h2>
                </div>
              </div>

              <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                {clause.summary}
              </p>

              <div className="space-y-3 text-sm text-[#A1A1AA] leading-relaxed">
                {clause.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#090909] border border-[#262626] space-y-2.5">
                {clause.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-white/90 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
