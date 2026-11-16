'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GymSettings } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Card, Input, Textarea, Button } from '@/components/ui';

type FaqCategory =
  | 'ALL'
  | 'MEMBERSHIP'
  | 'LADIES'
  | 'FACILITIES'
  | 'PORTAL';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'ALL'>;
  categoryLabel: string;
  question: string;
  answer: string;
  highlights?: string[];
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-registration-flow',
    category: 'MEMBERSHIP',
    categoryLabel: 'Membership & Payment',
    question:
      'How do online registration, payment submission, and Member Portal approval work?',
    answer:
      'After completing Member Registration, you receive your unique IFG Member ID and are taken directly to our secure Payment Checkout page. Choose bKash, Nagad, Rocket, Bank Transfer, Card/POS, or Cash at the Ashkona desk and submit your payment once. An Admin reviews and approves your payment before unlocking full Member Portal access.',
    highlights: [
      'One payment submission per Member ID',
      'Supported methods: bKash, Nagad, Rocket, Card, Bank & Cash',
      'Instant Member Portal, Class Booking & Face Gate unlock upon Admin approval',
    ],
  },
  {
    id: 'faq-payment-edit',
    category: 'MEMBERSHIP',
    categoryLabel: 'Membership & Payment',
    question:
      'What if I entered the wrong Transaction ID (TrxID) or want to change my payment method?',
    answer:
      'While your submitted payment is in PENDING verification status, you are allowed to edit your payment submission once (1/1). After saving that edit, the updated version and change history are displayed directly to our Admin team for review and further edits are locked.',
    highlights: [
      '1-time edit allowed while status is PENDING',
      'Admin Panel tracks both original and edited versions transparently',
    ],
  },
  {
    id: 'faq-ladies-window',
    category: 'LADIES',
    categoryLabel: 'Ladies-Only Hours',
    question:
      'What are the Ladies-Only hours and what separate facilities are available for female members?',
    answer:
      'Icon Fitness Gym operates an exclusive Dedicated Ladies-Only training window every Saturday through Thursday from 01:00 PM to 03:30 PM. Female members enjoy complete floor privacy along with a dedicated Separate Ladies Changing Room, Separate Ladies Washroom & Vanity, private lockers, and female coach support.',
    highlights: [
      'Exclusive Hours: Sat–Thu, 01:00 PM – 03:30 PM',
      'Separate Ladies Changing Room, Washroom & Vanity (zero mixed traffic)',
      'Smart Face ID access gate automatically enforces female-only entry during this window',
    ],
  },
  {
    id: 'faq-opening-hours',
    category: 'FACILITIES',
    categoryLabel: 'Facilities & Gear',
    question: 'What are the daily opening and Friday gym hours?',
    answer:
      'We are open 7 days a week at Ashkona Main Road. Saturday to Thursday runs from 07:00 AM to 11:00 PM (with 01:00 PM – 03:30 PM reserved exclusively for female members). On Fridays, the club is open from 05:00 PM to 11:00 PM.',
    highlights: [
      'Sat–Thu General Access: 07:00 AM – 01:00 PM & 03:30 PM – 11:00 PM',
      'Sat–Thu Ladies Only: 01:00 PM – 03:30 PM',
      'Friday: 05:00 PM – 11:00 PM',
    ],
  },
  {
    id: 'faq-location-tour',
    category: 'FACILITIES',
    categoryLabel: 'Facilities & Gear',
    question: 'Can I visit the Ashkona club in person for a guided tour before joining?',
    answer:
      'Yes! Walk-in tours are welcome every day during open club hours at Ashkona Main Road, Dakshinkhan, Dhaka-1230. Our reception staff will walk you through the Cardio Deck, Plate-Loaded Strength Zone, Heavy Free Weights Bay, and Ladies Studio amenities.',
  },
  {
    id: 'faq-equipment-zones',
    category: 'FACILITIES',
    categoryLabel: 'Facilities & Gear',
    question: 'What training zones and equipment are included inside Icon Fitness Gym?',
    answer:
      'Your membership covers 5 specialized zones: 18+ commercial Cardio units (treadmills, ellipticals, bikes), 24+ Selectorized & Plate-Loaded strength machines, Heavy Free Weights (2.5 kg to 50 kg pairs plus competition racks), Functional Turf (kettlebells, battle ropes, TRX), and the Dedicated Ladies Studio.',
  },
  {
    id: 'faq-coaching-programs',
    category: 'PORTAL',
    categoryLabel: 'Face ID & Portal',
    question: 'Are structured workout programs and trainer guidance included?',
    answer:
      'Yes. Members can follow 6 goal-based workout blueprints (Weight Loss, Muscle Building, Strength Peaking, Beginner Foundations, Ladies Tone & Glute Sculpt, and Custom Split) inside the Member Portal. Plans marked with Personal Trainer Review include dedicated coaching check-ins, and 1-on-1 coaching add-ons are available.',
  },
  {
    id: 'faq-face-gate',
    category: 'PORTAL',
    categoryLabel: 'Face ID & Portal',
    question: 'How does the Smart Face Recognition entry gate work?',
    answer:
      'Once your membership is approved, visit the Ashkona desk for a 30-second biometric Face ID enrollment. From then on, simply walk up to the smart access terminal for touchless check-in, automatic attendance streak tracking, and gender-slot verification.',
  },
  {
    id: 'faq-freeze-policy',
    category: 'MEMBERSHIP',
    categoryLabel: 'Membership & Payment',
    question: 'Can I pause (freeze) or renew my membership if I travel?',
    answer:
      'Eligible multi-month memberships can request a temporary medical or travel freeze through front desk review. Renewals can also be submitted directly from the Member Portal billing tab ahead of expiry so you never lose your streak.',
  },
];

const QUICK_SUBJECTS = [
  'Membership Plans & Pricing',
  'Ladies-Only Slot (1:00–3:30 PM)',
  '1-on-1 Personal Coaching',
  'Payment Verification Help',
  'In-Person Club Tour',
];

export default function ContactPage() {
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [faqFilter, setFaqFilter] = useState<FaqCategory>('ALL');
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0].id);
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    interestedPlan: '',
    message: '',
  });

  useEffect(() => {
    apiFetch<GymSettings>('/settings/public')
      .then(setSettings)
      .catch(() => null);
  }, []);

  const primaryPhone =
    settings?.phonePrimary && !settings.phonePrimary.includes('Configurable')
      ? settings.phonePrimary
      : '01685475975';

  const officialEmail = settings?.emailOfficial || 'info@iconfitnessgym.com';

  const addressText = (
    settings?.addressLine ||
    'Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh'
  ).replace(/\s*\(Configurable Exact Building\/Floor in Admin Settings\)/gi, '');

  const visibleFaqs =
    faqFilter === 'ALL'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === faqFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/inquiries/public', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        interestedPlan: '',
        message: '',
      });
      toast({
        title: 'Inquiry Received',
        description:
          'Your message has been logged in our system. Our Ashkona team will follow up with you shortly.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err.message || 'Please check your input fields.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-14">
      {/* =====================================================================
          1. CLEAN EDITORIAL PAGE HEADER
          ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#262626]">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
            ASHKONA FRONT DESK • LOCATION, HOURS &amp; FAQ
          </p>
          <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide text-white leading-none">
            CONTACT ICON FITNESS GYM
          </h1>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
            Have a question about membership plans, Ladies-Only hours, payment
            approval, or coaching in Ashkona, Dhaka? Send us a direct inquiry
            or read our FAQ below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a href="#faq">
            <Button variant="secondary" size="md" className="rounded-xl">
              Browse Detailed FAQ ↓
            </Button>
          </a>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN CONTACT GRID: FACILITY HUB + MAP (LEFT) & INQUIRY FORM (RIGHT)
          ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 sm:p-8 rounded-3xl border border-[#2C2C2C] space-y-6">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#262626]">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                  ASHKONA CLUB HUB
                </span>
                <h2 className="font-display text-2xl sm:text-3xl uppercase text-white mt-0.5">
                  FACILITY &amp; DESK DETAILS
                </h2>
              </div>
              <Building2 className="w-6 h-6 text-[#C7F464] shrink-0" />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#C7F464]/15 flex items-center justify-center shrink-0 text-[#C7F464]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                    Club Address
                  </p>
                  <p className="text-sm text-white font-medium mt-0.5 leading-snug">
                    {addressText}
                  </p>
                  <a
                    href="https://maps.app.goo.gl/MFtvSDWnRHwn1fNd6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#C7F464] no-underline mt-2"
                  >
                    Open Google Maps Directions →
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#C7F464]/15 flex items-center justify-center shrink-0 text-[#C7F464]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                    Member Support Desk
                  </p>
                  <p className="text-sm text-white font-mono font-semibold mt-0.5">
                    {primaryPhone}
                  </p>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {officialEmail}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#C7F464]/15 flex items-center justify-center shrink-0 text-[#C7F464]">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-1 font-mono text-xs sm:text-sm w-full">
                  <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                    Opening Hours
                  </p>
                  <p className="text-white font-semibold">
                    Sat–Thu: 07:00 AM – 11:00 PM
                  </p>
                  <p className="text-pink-400 font-semibold">
                    (Ladies Only: 01:00 PM – 03:30 PM)
                  </p>
                  <p className="text-amber-400 font-semibold">
                    Fri: 05:00 PM – 11:00 PM
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] h-80 bg-[#141414] shadow-xl">
            <iframe
              title="Icon Fitness Gym Ashkona Map"
              src={
                settings?.googleMapsEmbedUrl &&
                  settings.googleMapsEmbedUrl.includes('output=embed')
                  ? settings.googleMapsEmbedUrl
                  : 'https://www.google.com/maps?q=Icon+Fitness+Gym,Ashkona,Dakshinkhan,Dhaka,Bangladesh&output=embed'
              }
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href="https://maps.app.goo.gl/MFtvSDWnRHwn1fNd6"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline absolute bottom-3.5 right-3.5 px-3.5 py-2 rounded-xl bg-black/85 border border-[#C7F464]/50 text-xs font-mono font-bold uppercase text-[#C7F464] hover:bg-[#C7F464] hover:text-[#090909] transition-colors"
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>

        {/* Right 7 Cols: Direct Inquiry Form */}
        <div id="inquiry-form" className="lg:col-span-7">
          <Card className="p-6 sm:p-10 rounded-3xl border border-[#2C2C2C] space-y-6 shadow-xl">
            <div className="pb-4 border-b border-[#262626] space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                DIRECT FRONT DESK CRM
              </span>
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
                SEND A DIRECT INQUIRY
              </h2>
              <p className="text-xs sm:text-sm text-[#A1A1AA]">
                Messages go straight to our Ashkona reception &amp; management
                queue for fast callback or email follow-up.
              </p>
            </div>

            {/* Quick Topic Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                Quick Topic Selection
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUBJECTS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, subject: topic }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.subject === topic
                        ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-semibold'
                        : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/60 hover:text-white'
                      }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {submitted && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 flex items-center gap-3 text-sm text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  Thank you! Your inquiry has been logged and assigned to our
                  Ashkona front-desk team.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  required
                  placeholder="e.g. Mahmudul Hasan"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
                <Input
                  label="Phone Number *"
                  required
                  placeholder="e.g. 01711000000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address *"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Interested Plan (Optional)"
                  placeholder="e.g. Quarterly Performance"
                  value={form.interestedPlan}
                  onChange={(e) =>
                    setForm({ ...form, interestedPlan: e.target.value })
                  }
                />
              </div>

              <Input
                label="Subject *"
                required
                placeholder="e.g. Membership & Personal Training Inquiry"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />

              <Textarea
                label="Your Message *"
                required
                rows={4}
                placeholder="Tell us about your fitness goals, preferred training time, or payment verification reference..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto ifg-btn-primary rounded-xl"
                isLoading={submitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit Inquiry to Front Desk
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          3. DETAILED INTERACTIVE FAQ SECTION
          ===================================================================== */}
      <section id="faq" className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              <HelpCircle className="w-4 h-4" />
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white">
              EVERYTHING YOU NEED TO KNOW
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              Detailed answers about membership onboarding, 1-time payment
              submission &amp; edit rules, Ladies-Only floor privacy, Smart Face
              ID entry, and training programs.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'ALL', label: 'All Topics' },
                { key: 'MEMBERSHIP', label: 'Membership & Payment' },
                { key: 'LADIES', label: 'Ladies-Only Hours' },
                { key: 'FACILITIES', label: 'Facilities & Hours' },
                { key: 'PORTAL', label: 'Face ID & Portal' },
              ] as Array<{ key: FaqCategory; label: string }>
            ).map((tab) => {
              const active = faqFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFaqFilter(tab.key);
                    const firstMatch =
                      tab.key === 'ALL'
                        ? FAQ_ITEMS[0]
                        : FAQ_ITEMS.find((i) => i.category === tab.key);
                    if (firstMatch) setOpenFaqId(firstMatch.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all ${active
                      ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-bold shadow-sm'
                      : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/60 hover:text-white'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Accordion List */}
          <div className="lg:col-span-8 space-y-3.5">
            {visibleFaqs.map((item, idx) => {
              const isOpen = openFaqId === item.id;
              return (
                <Card
                  key={item.id}
                  className={`p-0 overflow-hidden rounded-2xl border transition-colors ${isOpen
                      ? 'border-[#C7F464]/60 shadow-lg'
                      : 'border-[#2C2C2C] hover:border-[#C7F464]/40'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 text-[#C7F464] text-[10px] font-mono font-bold uppercase tracking-wider">
                        {String(idx + 1).padStart(2, '0')} • {item.categoryLabel}
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                        {item.question}
                      </h3>
                    </div>
                    <span
                      className={`w-8 h-8 rounded-xl border border-[#2C2C2C] bg-[#141414] flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 border-[#C7F464]' : ''
                        }`}
                    >
                      <ChevronDown className="w-4 h-4 text-[#C7F464]" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#262626] space-y-3">
                      <p className="text-sm text-[#A1A1AA] leading-relaxed">
                        {item.answer}
                      </p>
                      {item.highlights && item.highlights.length > 0 && (
                        <ul className="space-y-2 pt-1">
                          {item.highlights.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Right Support Summary Sticky Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <Card className="p-6 sm:p-7 rounded-3xl border border-[#2C2C2C] space-y-5">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                STILL NEED HELP?
              </span>
              <h3 className="font-display text-2xl sm:text-3xl uppercase text-white leading-none">
                TALK TO OUR ASHKONA TEAM
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Whether you need urgent payment verification or want to reserve a
                slot in today&apos;s Ladies-Only session, our front desk answers
                daily.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Front Desk</span>
                  <span className="font-mono font-bold text-[#C7F464]">
                    {primaryPhone}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Email</span>
                  <span className="font-mono text-white">{officialEmail}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full ifg-btn-primary rounded-xl"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Create Member Account
                  </Button>
                </Link>
                <Link href="/membership">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full rounded-xl"
                  >
                    Compare Membership Plans
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
