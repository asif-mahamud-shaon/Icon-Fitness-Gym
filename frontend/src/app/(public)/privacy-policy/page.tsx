import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ScanFace,
  Lock,
  Database,
  CreditCard,
  UserCheck,
  Clock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

const PRIVACY_SECTIONS = [
  {
    id: 'controller-scope',
    number: '01',
    title: 'Scope & Data Controller Identity',
    summary: 'Legal entity, physical jurisdiction, and digital platform coverage.',
    paragraphs: [
      'This Privacy & Biometric Data Protection Policy governs the collection, processing, storage, and protection of personal information across the Icon Fitness Gym physical facility in Ashkona, Dakshinkhan, Dhaka-1230, Bangladesh, as well as our digital Member Portal, Trainer Portal, Admin Command Center, and Smart Biometric Access Control Kiosks.',
      'By registering for a Member Account, enrolling in our touchless Face Recognition entry system, reserving group classes, or submitting inquiries, you acknowledge the data practices detailed in this document.',
    ],
    bullets: [
      'Data Controller: Icon Fitness Gym (Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh)',
      'Official Privacy & Support Desk: info@iconfitnessgym.com • Phone: 01685475975',
      'Applicable to all Members, Prospective Visitors, Certified Trainers, and Administrative Staff',
    ],
  },
  {
    id: 'information-collected',
    number: '02',
    title: 'Categories of Personal & Fitness Information Collected',
    summary: 'Onboarding identity records, emergency contacts, and training metrics.',
    paragraphs: [
      'We collect only the specific categories of personal and athletic data required to verify your identity, maintain floor safety, assign structured workout blueprints, and administer your membership lifecycle:',
    ],
    bullets: [
      'Identity & Onboarding Profile: Full legal name, verified phone number, email address, residential address in Dhaka, gender (required to enforce our General vs. Ladies-Only daily operating windows), and unique Member ID (e.g., IFG-2026-XXXX).',
      'Emergency & Medical Safety Records: Emergency contact name, relationship, phone number, and optional self-disclosed orthopedic or fitness notes shared with your assigned coach.',
      'Training & Attendance Telemetry: Assigned workout programs, exercise sets/reps, group class reservations, waitlist timestamps, and physical check-in/check-out timestamps.',
    ],
  },
  {
    id: 'biometric-face-id',
    number: '03',
    title: 'Smart Biometric & Face Recognition Privacy Protocol',
    summary: 'Strict isolation and encryption of facial recognition check-in data.',
    paragraphs: [
      'Icon Fitness Gym operates an automated Smart Access Control Gate at our Ashkona entrance to ensure rapid, touchless member entry and strict enforcement of our daily Ladies-Only training window (01:00 PM – 03:30 PM, Saturday–Thursday).',
      'Your facial enrollment template and reference portrait are processed exclusively for internal facility access verification and are never sold, licensed, or shared with external marketing networks or third-party databases.',
    ],
    bullets: [
      'Purpose Limitation: Biometric templates are used solely to verify (a) identity match, (b) active non-expired membership status, and (c) gender eligibility for the active session window.',
      'Encrypted Template Storage: Mathematical facial feature vectors are stored in an isolated database table protected by role-based access controls and cryptographic hashing.',
      'Manual Check-In Alternative: Members who prefer not to enroll in optical face recognition may request assisted Member ID / QR verification at the Ashkona Front Desk.',
    ],
  },
  {
    id: 'financial-security',
    number: '04',
    title: 'Financial Records & Zero Raw Card/PIN Storage',
    summary: 'How bKash, Nagad, Rocket, POS card, and cash transactions are audited.',
    paragraphs: [
      'Icon Fitness Gym enforces a strict Zero Raw Payment Credential Policy. We never collect, transmit, or store raw credit/debit card numbers, CVV security codes, or mobile banking (bKash / Nagad / Rocket) PINs in our database.',
    ],
    bullets: [
      'Transaction Reference Auditing: Only the payment method label, transaction reference ID (TrxID), BDT amount, and staff verification timestamp are recorded.',
      'Immutable Digital Receipts: Once a payment is verified by authorized staff, an official sequential digital receipt (IFG-RCP-YYYY-XXXX) is generated in your Member Portal.',
      'No Unauthorized Auto-Billing: We never perform recurring automatic deductions from your mobile wallet or bank card without your explicit initiation.',
    ],
  },
  {
    id: 'rbac-isolation',
    number: '05',
    title: 'Role-Based Access Control (RBAC) & Member Data Isolation',
    summary: 'Strict architectural separation between Member, Trainer, and Admin portals.',
    paragraphs: [
      'Our software architecture enforces strict server-side Role-Based Access Control (RBAC) and JWT token validation on every API request:',
    ],
    bullets: [
      'Member-to-Member Isolation: A member can never view another member’s profile, attendance log, phone number, or payment history.',
      'Trainer Scope Restriction: Certified trainers can view fitness goals and workout assignments for members they coach, but have zero access to financial ledgers or administrative settings.',
      'Audit Logging: All administrative actions—including payment verifications, membership freezes, and biometric enrollments—are permanently recorded in an internal security audit trail.',
    ],
  },
  {
    id: 'session-tokens',
    number: '06',
    title: 'Authentication Tokens, Cookies & Portal Security',
    summary: 'Cryptographic password hashing and session lifecycle protection.',
    paragraphs: [
      'All account passwords are hashed using industry-standard bcrypt cryptographic salted rounds before storage. Plain-text passwords are never logged or visible to gym staff.',
      'When you sign into the Icon Fitness Portal, short-lived JSON Web Tokens (JWT) and refresh tokens are used to maintain your authenticated session and theme preferences (Dark / Light mode) without tracking you across external websites.',
    ],
    bullets: [
      'Zero Third-Party Ad Trackers: We do not embed third-party behavioral advertising pixels inside your Member Portal.',
      'Instant Session Revocation: Signing out immediately clears local authentication tokens from your browser.',
    ],
  },
  {
    id: 'cctv-facility',
    number: '07',
    title: 'On-Premises CCTV & Ladies-Only Window Privacy',
    summary: 'Physical security monitoring and strict privacy in changing areas.',
    paragraphs: [
      'For member safety and equipment protection, common training floors and the entrance reception lobby at our Ashkona facility are monitored by closed-circuit security cameras.',
    ],
    bullets: [
      'Strict Changing Room Privacy: Zero cameras are ever installed inside locker rooms, changing areas, washrooms, or prayer spaces.',
      'Ladies-Only Session Protection: During the daily 01:00 PM – 03:30 PM Ladies-Only window (Saturday–Thursday), floor supervision is conducted exclusively by our certified Female Trainer and authorized female staff.',
    ],
  },
  {
    id: 'retention-rights',
    number: '08',
    title: 'Data Retention, Archival & Your Member Rights',
    summary: 'Inspecting, updating, or requesting deletion of your personal records.',
    paragraphs: [
      'Active membership records are retained for the duration of your membership plus a statutory financial audit period for verified tax and accounting receipts.',
      'You have the right to inspect your personal profile, update your contact and emergency details via the Member Portal, request export of your attendance and payment receipts, or request revocation of your biometric template upon membership termination.',
    ],
    bullets: [
      'Self-Service Profile Updates: Update your phone, address, and emergency contact anytime under Member Portal → My Profile.',
      'Direct Privacy Inquiries: Contact our Ashkona Front Desk in person, call 01685475975, or email info@iconfitnessgym.com.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-14">
      {/* ====================================================================
          1. HERO DOCUMENT BANNER
          ==================================================================== */}
      <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] p-6 sm:p-10 lg:p-14 shadow-2xl">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15">
              <ShieldCheck className="w-4 h-4 text-[#C7F464]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
                DATA PROTECTION &amp; BIOMETRIC PRIVACY CHARTER
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-black/80 border border-white/15 text-xs font-mono text-zinc-300">
              DOC REF: IFG-PRIVACY-2026 • ASHKONA, DHAKA
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide text-white leading-[0.95]">
              PRIVACY &amp;{' '}
              <span className="text-[#C7F464]">DATA SECURITY</span> POLICY
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              How Icon Fitness Gym protects your personal identity, biometric
              Face ID templates, health notes, class bookings, and payment
              verification records across our Ashkona club and digital portals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/15">
            {[
              {
                icon: <Lock className="w-4 h-4 text-[#C7F464]" />,
                label: 'PASSWORD & AUTH',
                value: 'Bcrypt + JWT RBAC',
                sub: 'Strict Role Isolation',
              },
              {
                icon: <ScanFace className="w-4 h-4 text-[#C7F464]" />,
                label: 'BIOMETRIC TEMPLATES',
                value: 'Encrypted Vectors',
                sub: 'Zero 3rd-Party Sharing',
              },
              {
                icon: <CreditCard className="w-4 h-4 text-[#C7F464]" />,
                label: 'PAYMENT PRIVACY',
                value: 'Zero Card/PIN Storage',
                sub: 'Reference ID Audit Only',
              },
              {
                icon: <UserCheck className="w-4 h-4 text-[#C7F464]" />,
                label: 'MEMBER ISOLATION',
                value: '100% Private Profiles',
                sub: 'Protected Portal Records',
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
          2. STICKY TABLE OF CONTENTS + 8 DETAILED CLAUSES
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          <Card className="p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C7F464]">
              <FileText className="w-4 h-4" />
              <span>POLICY DIRECTORY</span>
            </div>
            <nav className="space-y-1.5">
              {PRIVACY_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:text-[#C7F464] hover:bg-[#C7F464]/10 transition-colors no-underline"
                >
                  <span className="font-mono font-bold text-[#C7F464]">
                    {sec.number}
                  </span>
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
            </nav>
          </Card>

          <Card className="p-6 rounded-3xl space-y-4">
            <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
              DATA PROTECTION OFFICER &amp; DESK
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
              <Link href="/terms">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Terms &amp; Conditions
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
          {PRIVACY_SECTIONS.map((sec) => (
            <Card
              key={sec.id}
              id={sec.id}
              className="p-6 sm:p-8 rounded-3xl space-y-4 scroll-mt-28 border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#C7F464] !text-[#090909] font-mono text-xs font-bold">
                    SECTION {sec.number}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white">
                    {sec.title}
                  </h2>
                </div>
              </div>

              <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                {sec.summary}
              </p>

              <div className="space-y-3 text-sm text-[#A1A1AA] leading-relaxed">
                {sec.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#090909] border border-[#262626] space-y-2.5">
                {sec.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-white/90 leading-relaxed"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                    <span>{bullet}</span>
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
