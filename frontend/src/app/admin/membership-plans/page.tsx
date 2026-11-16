'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Layers, Plus, Edit3, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiFetch, getErrorMessage, formatBdt, computePlanPricing } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { MembershipPlan } from '@/types';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminMembershipPlansPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    durationDays: '30',
    durationType: 'MONTHLY',
    priceBdt: '',
    admissionFeeBdt: '0',
    discountPercent: '0',
    discountBdt: '0',
    discountLabel: '',
    benefitsText: '',
    eligibilityConditions: '',
    renewalRules: '',
    maxClassesPerWeek: '6',
    includesPersonalTrainer: false,
    isPublic: true,
    isActive: true,
    isFeatured: false,
    sortOrder: '0',
  });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<MembershipPlan[]>('/membership-plans');
      setPlans(Array.isArray(res) ? res : []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      description: '',
      durationDays: '30',
      durationType: 'MONTHLY',
      priceBdt: '',
      admissionFeeBdt: '0',
      discountPercent: '0',
      discountBdt: '0',
      discountLabel: '',
      benefitsText:
        'Full gym floor access\nLocker usage\nInitial fitness assessment',
      eligibilityConditions:
        'Valid National ID or Passport required at Ashkona front desk.',
      renewalRules:
        'Renewable prior to or after expiration with full history retention.',
      maxClassesPerWeek: '6',
      includesPersonalTrainer: false,
      isPublic: true,
      isActive: true,
      isFeatured: false,
      sortOrder: String(plans.length + 1),
    });
    setModalOpen(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      durationDays: String(plan.durationDays),
      durationType: plan.durationType || 'MONTHLY',
      priceBdt: String(plan.priceBdt ?? plan.priceAmount ?? 0),
      admissionFeeBdt: String(plan.admissionFeeBdt ?? plan.admissionFee ?? 0),
      discountPercent: String(plan.discountPercent ?? 0),
      discountBdt: String(plan.discountBdt ?? 0),
      discountLabel: plan.discountLabel || '',
      benefitsText: (plan.benefits || []).join('\n'),
      eligibilityConditions:
        plan.eligibilityConditions || plan.eligibilityNotes || '',
      renewalRules: plan.renewalRules || '',
      maxClassesPerWeek: String(plan.maxClassesPerWeek ?? 6),
      includesPersonalTrainer: Boolean(plan.includesPersonalTrainer),
      isPublic: Boolean(plan.isPublic ?? true),
      isActive: Boolean(plan.isActive),
      isFeatured: Boolean(plan.isFeatured),
      sortOrder: String(plan.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        durationDays: Number(form.durationDays),
        durationType: form.durationType,
        priceBdt: Number(form.priceBdt || 0),
        admissionFeeBdt: Number(form.admissionFeeBdt || 0),
        discountPercent: Math.min(100, Math.max(0, Math.round(Number(form.discountPercent || 0)))),
        discountBdt: Math.max(0, Number(form.discountBdt || 0)),
        discountLabel: form.discountLabel.trim() || undefined,
        benefits: form.benefitsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        eligibilityConditions: form.eligibilityConditions || undefined,
        renewalRules: form.renewalRules || undefined,
        maxClassesPerWeek: Number(form.maxClassesPerWeek || 6),
        includesPersonalTrainer: form.includesPersonalTrainer,
        isPublic: form.isPublic,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        sortOrder: Number(form.sortOrder || 0),
      };

      if (editingPlan) {
        await apiFetch(`/membership-plans/${editingPlan.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Membership plan updated.');
      } else {
        await apiFetch('/membership-plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'New membership plan created.');
      }
      setModalOpen(false);
      loadPlans();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: MembershipPlan) => {
    try {
      await apiFetch(`/membership-plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      showToast(
        'success',
        `Plan ${!plan.isActive ? 'activated' : 'deactivated'}.`,
      );
      loadPlans();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Membership Plans
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Pricing Tiers &amp; Benefits</span>
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4" /> Create Membership Plan
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Configured Plans</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{plans.length}</p>
          </div>
          <Layers className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Active Public Tiers</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {plans.filter((p) => p.isActive && p.isPublic).length}
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Coach-Included Plans</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {plans.filter((p) => p.includesPersonalTrainer).length}
            </p>
          </div>
          <AlertTriangle className="w-5 h-5 text-[#C7F464]" />
        </div>
      </div>

      {/* Policy Banner */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#C7F464] shrink-0 mt-0.5" />
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          <strong className="text-white">Pricing Integrity Rule:</strong> Only
          public and active plans appear on the public website. All rates,
          admission fees, and benefits are managed dynamically from this module.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title="No Membership Plans"
          description="Create your first membership tier to configure durations, benefits, and pricing."
          action={<Button onClick={openCreateModal}>Create Plan</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between ${
                plan.isFeatured ? 'border-[#C7F464]/60' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                    {plan.durationType || 'PLAN'} • {plan.durationDays} Days
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      status={plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                    />
                    {plan.isPublic && <StatusBadge status="PUBLIC" />}
                  </div>
                </div>

                <h2 className="font-display text-2xl text-white uppercase tracking-wide">
                  {plan.name}
                </h2>

                {(() => {
                  const pricing = computePlanPricing(plan);
                  return (
                    <div className="my-5 p-4 rounded-lg bg-[#171717] border border-[#303030]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-[#A1A1AA]">
                          {pricing.hasDiscount
                            ? 'Discounted Plan Rate'
                            : 'Configured Rate'}
                        </span>
                        {pricing.hasDiscount && pricing.badgeText && (
                          <span className="px-2 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 text-[#C7F464] text-[10px] font-mono font-bold uppercase tracking-wider">
                            {pricing.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="font-mono text-2xl font-bold text-white">
                          {formatBdt(pricing.discountedPrice)}
                        </span>
                        {pricing.hasDiscount && (
                          <span className="font-mono text-sm text-[#A1A1AA] line-through">
                            {formatBdt(pricing.basePrice)}
                          </span>
                        )}
                      </div>
                      {pricing.hasDiscount && (
                        <span className="block text-xs text-[#C7F464] mt-1 font-mono">
                          Saving {formatBdt(pricing.totalDiscount)}
                          {pricing.discountPercent > 0
                            ? ` (${pricing.discountPercent}%`
                            : ''}
                          {pricing.discountPercent > 0 &&
                          pricing.flatDiscount > 0
                            ? ` + ${formatBdt(pricing.flatDiscount)} flat)`
                            : pricing.discountPercent > 0
                              ? ')'
                              : ''}
                        </span>
                      )}
                      {pricing.admissionFee > 0 && (
                        <span className="block text-xs text-[#A1A1AA] mt-1">
                          + {formatBdt(pricing.admissionFee)} Admission Fee
                          {pricing.hasDiscount
                            ? ` • First Total: ${formatBdt(pricing.netFirstTotal)}`
                            : ''}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs text-[#A1A1AA] mb-4">
                  {plan.description}
                </p>

                <ul className="space-y-1.5 mb-6">
                  {(plan.benefits || []).map((benefit, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-zinc-300 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F464] shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#303030] flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEditModal(plan)}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Plan
                </Button>
                <Button
                  size="sm"
                  variant={plan.isActive ? 'ghost' : 'outline'}
                  onClick={() => toggleActive(plan)}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingPlan
            ? `Edit Plan — ${editingPlan.name}`
            : 'Create Membership Plan'
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Plan Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Quarterly Transformation"
            />
            <Select
              label="Duration Type"
              options={[
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'QUARTERLY', label: 'Quarterly' },
                { value: 'HALF_YEARLY', label: 'Half-Yearly' },
                { value: 'YEARLY', label: 'Yearly' },
                { value: 'CUSTOM_DAYS', label: 'Custom Days' },
              ]}
              value={form.durationType}
              onChange={(e) =>
                setForm({ ...form, durationType: e.target.value })
              }
            />
            <Input
              label="Duration (Days)"
              type="number"
              required
              min={1}
              value={form.durationDays}
              onChange={(e) =>
                setForm({ ...form, durationDays: e.target.value })
              }
            />
          </div>

          <Textarea
            label="Description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#090909] border border-[#303030]">
            <Input
              label="Official Price (BDT)"
              type="number"
              min={0}
              required
              value={form.priceBdt}
              onChange={(e) => setForm({ ...form, priceBdt: e.target.value })}
            />
            <Input
              label="Admission Fee (BDT)"
              type="number"
              min={0}
              value={form.admissionFeeBdt}
              onChange={(e) =>
                setForm({ ...form, admissionFeeBdt: e.target.value })
              }
            />
            <Input
              label="Max Classes / Week"
              type="number"
              min={0}
              value={form.maxClassesPerWeek}
              onChange={(e) =>
                setForm({ ...form, maxClassesPerWeek: e.target.value })
              }
            />
          </div>

          <div className="p-4 rounded-xl bg-[#090909] border border-[#303030] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                Plan Discount & Offer (Optional)
              </span>
              {(() => {
                const preview = computePlanPricing({
                  priceBdt: Number(form.priceBdt || 0),
                  admissionFeeBdt: Number(form.admissionFeeBdt || 0),
                  discountPercent: Number(form.discountPercent || 0),
                  discountBdt: Number(form.discountBdt || 0),
                  discountLabel: form.discountLabel,
                });
                return preview.hasDiscount ? (
                  <span className="text-xs font-mono text-[#C7F464]">
                    Net Plan: {formatBdt(preview.discountedPrice)} (Save{' '}
                    {formatBdt(preview.totalDiscount)}) • 1st Cycle:{' '}
                    {formatBdt(preview.netFirstTotal)}
                  </span>
                ) : (
                  <span className="text-xs text-[#A1A1AA]">
                    No active discount (full official rate)
                  </span>
                );
              })()}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Discount (%)"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 15"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm({ ...form, discountPercent: e.target.value })
                }
              />
              <Input
                label="Flat Discount (BDT)"
                type="number"
                min={0}
                placeholder="e.g. 500"
                value={form.discountBdt}
                onChange={(e) =>
                  setForm({ ...form, discountBdt: e.target.value })
                }
              />
              <Input
                label="Offer Badge Label"
                placeholder="e.g. EID OFFER or 20% OFF"
                value={form.discountLabel}
                onChange={(e) =>
                  setForm({ ...form, discountLabel: e.target.value })
                }
              />
            </div>
          </div>

          <Textarea
            label="Included Benefits (One per line)"
            value={form.benefitsText}
            onChange={(e) => setForm({ ...form, benefitsText: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Eligibility Conditions"
              value={form.eligibilityConditions}
              onChange={(e) =>
                setForm({ ...form, eligibilityConditions: e.target.value })
              }
            />
            <Input
              label="Renewal Rules"
              value={form.renewalRules}
              onChange={(e) =>
                setForm({ ...form, renewalRules: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) =>
                  setForm({ ...form, isPublic: e.target.checked })
                }
                className="accent-[#C7F464]"
              />
              Publicly Visible
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="accent-[#C7F464]"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
                className="accent-[#C7F464]"
              />
              Featured Highlight
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includesPersonalTrainer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    includesPersonalTrainer: e.target.checked,
                  })
                }
                className="accent-[#C7F464]"
              />
              Includes PT
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingPlan ? 'Save Plan Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
