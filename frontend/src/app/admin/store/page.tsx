'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  Banknote,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  Printer,
  Tag,
  Copy,
  Pause,
  Play,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDate, formatDateTime } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Input,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import {
  StoreProductVisual,
  STORE_CATEGORY_META,
  formatStoreCategoryLabel,
} from '@/components/shared/StoreProductVisual';
import { StoreOrderSlipModal } from '@/components/shared/StoreOrderSlipModal';
import { formatVerifiedByLabel } from '@/lib/receipt-helpers';

const CUSTOM_CATEGORIES_STORAGE_KEY = 'ifg_store_custom_categories_v1';

interface CategoryOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'BOTTLES', label: 'Water Bottles & Shakers' },
  { value: 'GLOVES', label: 'Gym Gloves' },
  { value: 'BELTS', label: 'Lifting Belts' },
  { value: 'SUPPLEMENTS', label: 'Protein & Supplements' },
  { value: 'ACCESSORIES', label: 'Straps & Accessories' },
  { value: 'APPAREL', label: 'Gym Apparel' },
];

function normalizeCategoryKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function compressProductPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminStorePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canManagePromoCodes = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'promos'>('inventory');

  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [inspectOrder, setInspectOrder] = useState<any | null>(null);
  const [slipOrder, setSlipOrder] = useState<any | null>(null);
  const [customCategories, setCustomCategories] = useState<CategoryOption[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomCategories(
            parsed.filter(
              (c): c is CategoryOption =>
                Boolean(c && typeof c.value === 'string' && typeof c.label === 'string'),
            ),
          );
        }
      }
    } catch {
      // Ignore malformed localStorage entries
    }
  }, []);

  const persistCustomCategory = useCallback((value: string, label: string) => {
    const cleanValue = normalizeCategoryKey(value || label);
    const cleanLabel = label.trim() || formatStoreCategoryLabel(cleanValue);
    if (!cleanValue) return cleanValue;
    setCustomCategories((prev) => {
      if (prev.some((c) => c.value === cleanValue)) return prev;
      const next = [...prev, { value: cleanValue, label: cleanLabel, isCustom: true }];
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
      }
      return next;
    });
    return cleanValue;
  }, []);

  const allCategoryOptions = useMemo<CategoryOption[]>(() => {
    const map = new Map<string, CategoryOption>();
    DEFAULT_CATEGORY_OPTIONS.forEach((opt) => map.set(opt.value, opt));
    customCategories.forEach((opt) => {
      if (!map.has(opt.value)) map.set(opt.value, { ...opt, isCustom: true });
    });
    products.forEach((prod) => {
      const key = normalizeCategoryKey(String(prod?.category || ''));
      if (key && !map.has(key)) {
        map.set(key, {
          value: key,
          label: formatStoreCategoryLabel(key),
          isCustom: true,
        });
      }
    });
    return Array.from(map.values());
  }, [customCategories, products]);

  const handleAddCustomCategory = () => {
    const cleanLabel = newCategoryName.trim();
    if (cleanLabel.length < 2) {
      toast({
        title: 'Category Name Required',
        description: 'Enter at least 2 characters for the custom category.',
        variant: 'error',
      });
      return;
    }
    const key = persistCustomCategory(cleanLabel, cleanLabel);
    setForm((prev) => ({ ...prev, category: key }));
    setNewCategoryName('');
    setAddingCategory(false);
    toast({
      title: 'Custom Category Saved',
      description: `"${cleanLabel}" is selected and saved to suggestions for future products.`,
      variant: 'success',
    });
  };

  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_BDT',
    discountValue: '10',
    validDays: '7',
    minOrderBdt: '',
    maxDiscountBdt: '',
    maxUses: '',
  });

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'BOTTLES',
    brand: 'Icon Pro Gear',
    description: '',
    buyingPriceBdt: '',
    priceBdt: '',
    compareAtBdt: '',
    stockQty: '10',
    unitLabel: '1 pc',
    imageUrl: '',
    badgeText: '',
    isFeatured: false,
    isActive: true,
  });

  const loadStoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, ordersRes, promosRes] = await Promise.all([
        apiFetch<any>('/store/admin/products').catch(() => ({ items: [], summary: {} })),
        apiFetch<any[]>('/store/admin/orders').catch(() => []),
        canManagePromoCodes
          ? apiFetch<any[]>('/store/admin/discount-codes').catch(() => [])
          : Promise.resolve([]),
      ]);
      setProducts(invRes?.items || []);
      setSummary(invRes?.summary || {});
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setDiscountCodes(Array.isArray(promosRes) ? promosRes : []);
    } finally {
      setLoading(false);
    }
  }, [canManagePromoCodes]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setAddingCategory(false);
    setNewCategoryName('');
    setForm({
      name: '',
      sku: '',
      category: 'BOTTLES',
      brand: 'Icon Pro Gear',
      description: '',
      buyingPriceBdt: '',
      priceBdt: '',
      compareAtBdt: '',
      stockQty: '15',
      unitLabel: '1 pc',
      imageUrl: '',
      badgeText: '',
      isFeatured: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setAddingCategory(false);
    setNewCategoryName('');
    const catKey = normalizeCategoryKey(product.category || 'BOTTLES') || 'BOTTLES';
    if (!DEFAULT_CATEGORY_OPTIONS.some((c) => c.value === catKey)) {
      persistCustomCategory(catKey, formatStoreCategoryLabel(catKey));
    }
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: catKey,
      brand: product.brand || '',
      description: product.description || '',
      buyingPriceBdt:
        product.buyingPriceBdt !== null && product.buyingPriceBdt !== undefined
          ? String(product.buyingPriceBdt)
          : '',
      priceBdt: String(product.priceBdt || ''),
      compareAtBdt: product.compareAtBdt ? String(product.compareAtBdt) : '',
      stockQty: String(product.stockQty ?? 0),
      unitLabel: product.unitLabel || '',
      imageUrl: product.imageUrl || '',
      badgeText: product.badgeText || '',
      isFeatured: Boolean(product.isFeatured),
      isActive: Boolean(product.isActive),
    });
    setModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressProductPhoto(file);
      setForm((prev) => ({ ...prev, imageUrl: compressed }));
    } catch (err: any) {
      toast({ title: 'Image Error', description: err.message, variant: 'error' });
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const normalizedCat = normalizeCategoryKey(form.category) || 'ACCESSORIES';
      if (!DEFAULT_CATEGORY_OPTIONS.some((c) => c.value === normalizedCat)) {
        persistCustomCategory(normalizedCat, formatStoreCategoryLabel(normalizedCat));
      }
      const payload = {
        name: form.name,
        ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
        category: normalizedCat,
        brand: form.brand || undefined,
        description: form.description,
        buyingPriceBdt:
          form.buyingPriceBdt !== '' ? Number(form.buyingPriceBdt) : undefined,
        priceBdt: Number(form.priceBdt),
        compareAtBdt: form.compareAtBdt ? Number(form.compareAtBdt) : undefined,
        stockQty: Number(form.stockQty),
        unitLabel: form.unitLabel || undefined,
        imageUrl: form.imageUrl || '',
        badgeText: form.badgeText || undefined,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      if (editingProduct) {
        await apiFetch(`/store/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Product Updated', variant: 'success' });
      } else {
        await apiFetch('/store/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Product Added to Store', variant: 'success' });
      }
      setModalOpen(false);
      await loadStoreData();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiFetch(`/store/admin/products/${id}`, { method: 'DELETE' });
      toast({ title: 'Product Removed / Archived', variant: 'success' });
      await loadStoreData();
    } catch (err: any) {
      toast({ title: 'Action Failed', description: err.message, variant: 'error' });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updated = await apiFetch<any>(`/store/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast({
        title:
          status === 'COMPLETED'
            ? 'Order Completed & Payment Slip Ready'
            : `Order marked ${status.replace(/_/g, ' ')}`,
        variant: 'success',
      });
      if (inspectOrder?.id === orderId) {
        setInspectOrder(updated);
      }
      if (status === 'COMPLETED' && updated) {
        setSlipOrder(updated);
      }
      await loadStoreData();
    } catch (err: any) {
      toast({ title: 'Status Update Failed', description: err.message, variant: 'error' });
    }
  };

  const openPromoModal = () => {
    setPromoForm({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      validDays: '7',
      minOrderBdt: '',
      maxDiscountBdt: '',
      maxUses: '',
    });
    setPromoModalOpen(true);
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountValue = Number(promoForm.discountValue);
    const validDays = Number(promoForm.validDays);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      toast({
        title: 'Invalid Discount Value',
        description: 'Discount value must be greater than zero.',
        variant: 'error',
      });
      return;
    }
    if (promoForm.discountType === 'PERCENTAGE' && discountValue > 100) {
      toast({
        title: 'Invalid Percentage',
        description: 'Percentage discount cannot exceed 100%.',
        variant: 'error',
      });
      return;
    }
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 3650) {
      toast({
        title: 'Invalid Validity Days',
        description: 'Validity days must be a whole number between 1 and 3650.',
        variant: 'error',
      });
      return;
    }

    setSavingPromo(true);
    try {
      const created = await apiFetch<any>('/store/admin/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          ...(promoForm.code.trim() ? { code: promoForm.code.trim().toUpperCase() } : {}),
          ...(promoForm.description.trim() ? { description: promoForm.description.trim() } : {}),
          discountType: promoForm.discountType,
          discountValue,
          validDays,
          ...(promoForm.minOrderBdt ? { minOrderBdt: Number(promoForm.minOrderBdt) } : {}),
          ...(promoForm.discountType === 'PERCENTAGE' && promoForm.maxDiscountBdt
            ? { maxDiscountBdt: Number(promoForm.maxDiscountBdt) }
            : {}),
          ...(promoForm.maxUses ? { maxUses: Number(promoForm.maxUses) } : {}),
          isActive: true,
        }),
      });
      toast({
        title: `Promo Code ${created.code} Generated`,
        description: `Valid for ${created.validDays} day${created.validDays === 1 ? '' : 's'}.`,
        variant: 'success',
      });
      setPromoModalOpen(false);
      setActiveTab('promos');
      await loadStoreData();
    } catch (err: any) {
      toast({
        title: 'Failed to Generate Promo Code',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSavingPromo(false);
    }
  };

  const handleTogglePromoActive = async (promo: any) => {
    try {
      await apiFetch(`/store/admin/discount-codes/${promo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      toast({
        title: promo.isActive ? `${promo.code} Paused` : `${promo.code} Activated`,
        variant: 'success',
      });
      await loadStoreData();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'error' });
    }
  };

  const handleExtendPromoDays = async (promo: any, extraDays = 7) => {
    const remainingDays = Math.max(
      0,
      Math.ceil((new Date(promo.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    const nextValidDays = remainingDays + extraDays;
    try {
      await apiFetch(`/store/admin/discount-codes/${promo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ validDays: nextValidDays, isActive: true }),
      });
      toast({
        title: `${promo.code} Extended`,
        description: `Valid for ${nextValidDays} days from now.`,
        variant: 'success',
      });
      await loadStoreData();
    } catch (err: any) {
      toast({ title: 'Extend Failed', description: err.message, variant: 'error' });
    }
  };

  const handleDeletePromoCode = async (promo: any) => {
    try {
      await apiFetch(`/store/admin/discount-codes/${promo.id}`, {
        method: 'DELETE',
      });
      toast({ title: `Promo Code ${promo.code} Deleted`, variant: 'success' });
      await loadStoreData();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'error' });
    }
  };

  const handleCopyPromoCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: `Copied ${code}`, variant: 'success' });
    } catch {
      toast({ title: `Code: ${code}`, variant: 'info' });
    }
  };

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'READY_FOR_PICKUP',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Gym Gear &amp; Supplements Store
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Manage water bottles, gloves, lifting belts, whey protein buying costs, selling prices, profit margins, and pickup orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManagePromoCodes && (
            <Button
              variant="secondary"
              className="rounded-xl border border-[#C7F464]/40 text-[#C7F464]"
              leftIcon={<Tag className="w-4 h-4" />}
              onClick={openPromoModal}
            >
              Generate Promo Code
            </Button>
          )}
          <Button
            variant="primary"
            className="ifg-btn-primary rounded-xl"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center text-[#C7F464]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Active Items</p>
            <p className="font-display text-2xl text-white">
              {summary.activeProducts ?? products.length}
            </p>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Stock Cost</p>
            <p className="font-display text-2xl text-amber-400">
              {formatBdt(summary.totalInventoryCostBdt ?? 0)}
            </p>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center text-[#C7F464]">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Retail Value</p>
            <p className="font-display text-2xl text-white">
              {formatBdt(summary.totalInventoryValueBdt ?? 0)}
            </p>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Sales Profit</p>
            <p className="font-display text-2xl text-emerald-400">
              {formatBdt(summary.realizedStoreProfitBdt ?? 0)}
            </p>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center text-sky-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Open Orders</p>
            <p className="font-display text-2xl text-sky-400">{pendingOrdersCount}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-[#141414] border border-[#2C2C2C] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${activeTab === 'inventory'
            ? 'bg-[#C7F464] text-[#090909]'
            : 'text-[#A1A1AA] hover:text-white'
            }`}
        >
          Products &amp; Stock ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${activeTab === 'orders'
            ? 'bg-[#C7F464] text-[#090909]'
            : 'text-[#A1A1AA] hover:text-white'
            }`}
        >
          Customer Orders ({orders.length})
        </button>
        {canManagePromoCodes && (
          <button
            type="button"
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${activeTab === 'promos'
              ? 'bg-[#C7F464] text-[#090909]'
              : 'text-[#A1A1AA] hover:text-white'
              }`}
          >
            Promo Codes ({discountCodes.length})
          </button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((p) => (
            <Card
              key={p.id}
              className="p-4 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-24 shrink-0">
                  <StoreProductVisual
                    imageUrl={p.imageUrl}
                    category={p.category}
                    name={p.name}
                    className="h-24"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#C7F464]">
                      {formatStoreCategoryLabel(p.category)}
                    </span>
                    <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                  <p className="text-xs font-mono text-[#A1A1AA]">
                    {p.unitLabel || '1 pc'} • Stock: <strong className="text-white">{p.stockQty}</strong>
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="font-display text-xl text-[#C7F464]">
                      Sell {formatBdt(p.priceBdt)}
                    </span>
                    {p.buyingPriceBdt !== null && p.buyingPriceBdt !== undefined && (
                      <span className="text-[11px] font-mono text-[#A1A1AA]">
                        Buy {formatBdt(p.buyingPriceBdt)} •{' '}
                        <strong className="text-emerald-400">
                          +{formatBdt(Number(p.priceBdt || 0) - Number(p.buyingPriceBdt || 0))} Profit
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  SKU: {p.sku || '—'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => openEditModal(p)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-400"
                    onClick={() => handleDeleteProduct(p.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : activeTab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyState
            title="No Store Orders Yet"
            description="Orders placed by members or walk-in visitors from the Gym Store will appear here."
          />
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <Card
                key={ord.id}
                className="p-5 rounded-3xl border border-[#2C2C2C] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#C7F464]">
                      {ord.orderNumber}
                    </span>
                    <StatusBadge status={ord.status} />
                    <span className="text-xs font-mono text-[#A1A1AA] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(ord.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {ord.customerName} ({ord.customerPhone})
                    {ord.memberCode ? ` • ${ord.memberCode}` : ''}
                    {ord.isMemberVerified ? ' ✓ Running Student' : ''}
                    {ord.fulfillmentType === 'DELIVERY'
                      ? ` • Online Delivery (${formatBdt(ord.deliveryFeeBdt || 0)})`
                      : ' • Desk Pickup'}
                  </p>
                  {ord.fulfillmentType === 'DELIVERY' && ord.deliveryAddress && (
                    <p className="text-xs font-mono text-[#C7F464]">
                      Ship To: {ord.deliveryAddress}
                    </p>
                  )}
                  <p className="text-xs text-[#A1A1AA]">
                    Items:{' '}
                    {(ord.items || [])
                      .map((i: any) => `${i.productName} × ${i.quantity}`)
                      .join(', ')}
                  </p>
                  <p className="text-[11px] font-mono text-[#A1A1AA]">
                    Payment: {ord.paymentMethod}
                    {Number(ord.advancePaidBdt || 0) > 0
                      ? ` • Advance Paid: ${formatBdt(ord.advancePaidBdt)} (Due: ${formatBdt(
                          Math.max(
                            0,
                            Number(ord.totalAmountBdt || 0) - Number(ord.advancePaidBdt || 0),
                          ),
                        )})`
                      : ''}
                    {ord.transactionReference ? ` • TrxID: ${ord.transactionReference}` : ''}
                    {ord.pickupNote ? ` • Note: ${ord.pickupNote}` : ''}
                  </p>
                  {ord.discountCode && Number(ord.discountAmountBdt || 0) > 0 && (
                    <p className="text-[11px] font-mono text-[#C7F464] inline-flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Promo: <span className="font-bold">{ord.discountCode}</span> (-
                      {formatBdt(ord.discountAmountBdt)}
                      {ord.subtotalBdt ? ` off ${formatBdt(ord.subtotalBdt)}` : ''})
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="font-display text-2xl text-[#C7F464] block">
                      {formatBdt(ord.totalAmountBdt)}
                    </span>
                    {ord.profitBdt !== undefined && (
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        Net Profit: +{formatBdt(ord.profitBdt)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setInspectOrder(ord)}
                    >
                      View Order
                    </Button>
                    {ord.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="ifg-btn-primary"
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => setSlipOrder(ord)}
                      >
                        Payment Slip
                      </Button>
                    )}
                    {ord.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateOrderStatus(ord.id, 'CONFIRMED')}
                      >
                        Confirm
                      </Button>
                    )}
                    {(ord.status === 'PENDING' || ord.status === 'CONFIRMED') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                      >
                        Ready for Pickup
                      </Button>
                    )}
                    {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleUpdateOrderStatus(ord.id, 'COMPLETED')}
                      >
                        Complete &amp; Slip
                      </Button>
                    )}
                    {ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-400"
                        onClick={() => handleUpdateOrderStatus(ord.id, 'CANCELLED')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : canManagePromoCodes ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
            <div>
              <p className="text-sm font-bold text-white">
                Admin &amp; Super Admin Discount Codes
              </p>
              <p className="text-xs text-[#A1A1AA]">
                Generate store promo codes with custom validity days. Only Gym Admins and Super Admins can create or manage codes.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="ifg-btn-primary rounded-xl shrink-0"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openPromoModal}
            >
              New Promo Code
            </Button>
          </div>

          {discountCodes.length === 0 ? (
            <EmptyState
              icon={<Tag className="w-8 h-8" />}
              title="No Promo Codes Yet"
              description="Generate a percentage or flat BDT discount code and set how many days it stays valid."
              action={
                <Button
                  variant="primary"
                  className="ifg-btn-primary rounded-xl"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={openPromoModal}
                >
                  Generate First Code
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {discountCodes.map((promo) => {
                const statusColors: Record<string, string> = {
                  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                  EXPIRED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                  LIMIT_REACHED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                  PAUSED: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                };
                const badgeClass =
                  statusColors[promo.effectiveStatus] ||
                  'bg-zinc-800 text-zinc-300 border-zinc-700';

                return (
                  <Card
                    key={promo.id}
                    className="p-5 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-bold tracking-wider px-3 py-1 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-[#C7F464]">
                            {promo.code}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}
                          >
                            {String(promo.effectiveStatus || 'ACTIVE').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPromoCode(promo.code)}
                          className="p-2 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[#A1A1AA] hover:text-white transition-colors"
                          title="Copy Promo Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-display text-2xl text-white">
                          {promo.discountType === 'PERCENTAGE'
                            ? `${promo.discountValue}% OFF`
                            : `${formatBdt(promo.discountValue)} OFF`}
                        </span>
                        {promo.minOrderBdt ? (
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            Min Order: {formatBdt(promo.minOrderBdt)}
                          </span>
                        ) : null}
                        {promo.maxDiscountBdt ? (
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            • Max Cap: {formatBdt(promo.maxDiscountBdt)}
                          </span>
                        ) : null}
                      </div>

                      {promo.description && (
                        <p className="text-xs text-[#A1A1AA]">{promo.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-[#A1A1AA]">
                        <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
                          <p className="text-[10px] uppercase text-[#71717A]">Validity Window</p>
                          <p className="text-white font-semibold mt-0.5">
                            {promo.validDays} Day{promo.validDays === 1 ? '' : 's'}
                          </p>
                          <p className="text-[10px] mt-0.5">
                            Expires: {formatDateTime(promo.expiresAt)}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
                          <p className="text-[10px] uppercase text-[#71717A]">Redemptions &amp; By</p>
                          <p className="text-white font-semibold mt-0.5">
                            {promo.usedCount}
                            {promo.maxUses ? ` / ${promo.maxUses} uses` : ' uses (Unlimited)'}
                          </p>
                          <p className="text-[10px] mt-0.5 truncate">
                            By: {promo.createdByName || 'Admin'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#2C2C2C]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={
                            promo.isActive ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )
                          }
                          onClick={() => handleTogglePromoActive(promo)}
                        >
                          {promo.isActive ? 'Pause' : 'Resume'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Clock className="w-3.5 h-3.5" />}
                          onClick={() => handleExtendPromoDays(promo, 7)}
                        >
                          +7 Days
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-400"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDeletePromoCode(promo)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit Product — ${editingProduct.name}` : 'Add Store Product'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
          {/* Live Product Visual & Summary Preview */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-24 shrink-0">
              <StoreProductVisual
                imageUrl={form.imageUrl}
                category={form.category}
                name={form.name || 'Product'}
                className="h-24"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[10px] font-mono uppercase text-[#C7F464] font-bold">
                  {allCategoryOptions.find((c) => c.value === form.category)?.label ||
                    formatStoreCategoryLabel(form.category)}
                </span>
                {form.badgeText && (
                  <span className="px-2 py-0.5 rounded-full bg-[#242424] border border-[#343434] text-[10px] font-mono uppercase text-white">
                    {form.badgeText}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white truncate">
                {form.name.trim() || 'New Store Product Preview'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  Upload Product Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {form.imageUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                  >
                    Use Default Artwork
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Identity & Custom Category Picker */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                1 • Product Identity & Category
              </p>
              <span className="text-[10px] font-mono text-[#71717A]">
                Custom categories auto-save for suggestions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                required
                placeholder="e.g. Icon Stainless Insulated Bottle 1L"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="SKU Code (Optional)"
                placeholder="Auto-generated if empty"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>

            {/* Category Suggestions + Custom Category Creator */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                  Product Category *
                </label>
                <button
                  type="button"
                  onClick={() => setAddingCategory((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1B2210] border border-[#C7F464]/45 text-[11px] font-mono font-semibold text-[#C7F464] hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors"
                >
                  {addingCategory ? (
                    <>
                      <X className="w-3 h-3" />
                      Close Custom Input
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Add Custom Category
                    </>
                  )}
                </button>
              </div>

              {addingCategory && (
                <div className="p-3 rounded-xl bg-[#171717] border border-[#C7F464]/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    placeholder="e.g. Pre-Workout & Energy, Recovery Gear, Kettlebells..."
                    className="flex-1 h-10 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#C7F464]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={handleAddCustomCategory}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Save & Select
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {allCategoryOptions.map((opt) => {
                  const selected = form.category === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: opt.value })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        selected
                          ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B] font-bold shadow-sm'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50 hover:text-white'
                      }`}
                    >
                      {selected ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Tag className="w-3 h-3 shrink-0 text-[#A1A1AA]" />
                      )}
                      <span>{opt.label}</span>
                      {opt.isCustom && (
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            selected
                              ? 'bg-[#0B0B0B]/15 text-[#0B0B0B]'
                              : 'bg-[#1B2210] text-[#C7F464]'
                          }`}
                        >
                          Custom
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              2 • Pricing, Inventory & Margin
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Input
                label="Buying Cost (BDT)"
                type="number"
                min={0}
                placeholder="e.g. 1950"
                value={form.buyingPriceBdt}
                onChange={(e) => setForm({ ...form, buyingPriceBdt: e.target.value })}
              />
              <Input
                label="Selling Price (BDT) *"
                type="number"
                min={1}
                required
                placeholder="e.g. 2450"
                value={form.priceBdt}
                onChange={(e) => setForm({ ...form, priceBdt: e.target.value })}
              />
              <Input
                label="Original MRP"
                type="number"
                min={1}
                placeholder="Optional"
                value={form.compareAtBdt}
                onChange={(e) => setForm({ ...form, compareAtBdt: e.target.value })}
              />
              <Input
                label="Stock Qty *"
                type="number"
                min={0}
                required
                value={form.stockQty}
                onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
              />
            </div>

            {form.priceBdt && form.buyingPriceBdt !== '' && (
              <div className="p-3 rounded-xl bg-[#1B2210] border border-[#C7F464]/35 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-[#A1A1AA]">Estimated Margin per Unit:</span>
                <span className="font-bold text-emerald-400">
                  Profit:{' '}
                  {formatBdt(Number(form.priceBdt || 0) - Number(form.buyingPriceBdt || 0))}{' '}
                  ({Number(form.priceBdt || 0) > 0
                    ? (
                      ((Number(form.priceBdt || 0) - Number(form.buyingPriceBdt || 0)) /
                        Number(form.priceBdt || 1)) *
                      100
                    ).toFixed(1)
                    : '0.0'}
                  % margin)
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Size / Weight / Unit"
                placeholder="e.g. 1L / 2 lbs / 1 Pair"
                value={form.unitLabel}
                onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
              />
              <Input
                label="Brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="Highlight Badge"
                placeholder="e.g. Bestseller"
                value={form.badgeText}
                onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Description & Storefront Visibility */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              3 • Storefront Details & Visibility
            </p>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Product Description *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Highlight material, sizing, key benefits, and Ashkona club pickup details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#C7F464]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Featured Product</p>
                  <p className="text-[11px] text-[#A1A1AA]">Pin near top of store listings</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="h-4 w-4 accent-[#C7F464]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Visible in Storefront</p>
                  <p className="text-[11px] text-[#A1A1AA]">Live on public & member stores</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 accent-[#C7F464]"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Full Store Order Details Modal */}
      <Modal
        isOpen={Boolean(inspectOrder)}
        onClose={() => setInspectOrder(null)}
        title={`Order Details — ${inspectOrder?.orderNumber || ''}`}
        description="Full customer order summary, cost/profit breakdown, and payment slip actions"
        maxWidth="max-w-3xl"
      >
        {inspectOrder && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C]">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge status={inspectOrder.status} />
                {inspectOrder.slipNumber && (
                  <span className="px-2.5 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono text-[#C7F464]">
                    Slip #{inspectOrder.slipNumber}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-[#A1A1AA]">
                Placed: {formatDateTime(inspectOrder.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                  Customer Information
                </p>
                <p className="text-sm font-bold text-white">
                  {inspectOrder.customerName}
                </p>
                <p className="text-xs font-mono text-[#A1A1AA]">
                  Phone: {inspectOrder.customerPhone}
                </p>
                {inspectOrder.customerEmail && (
                  <p className="text-xs text-[#A1A1AA]">
                    Email: {inspectOrder.customerEmail}
                  </p>
                )}
                {inspectOrder.memberCode && (
                  <p className="text-xs font-mono text-[#C7F464]">
                    Member Code: {inspectOrder.memberCode}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                  Payment &amp; Desk Attribution
                </p>
                <p className="text-sm font-bold text-white">
                  Method: {inspectOrder.paymentMethod}
                </p>
                {inspectOrder.transactionReference && (
                  <p className="text-xs font-mono text-[#C7F464]">
                    TrxID: {inspectOrder.transactionReference}
                  </p>
                )}
                <p className="text-xs text-[#A1A1AA]">
                  Processed By:{' '}
                  <strong className="text-white">
                    {formatVerifiedByLabel(
                      inspectOrder.processedByUser?.fullName || '',
                      inspectOrder.processedByUser?.role || '',
                    ) || 'Pending Desk Review'}
                  </strong>
                </p>
                {inspectOrder.pickupNote && (
                  <p className="text-xs text-[#A1A1AA]">
                    Pickup Note: {inspectOrder.pickupNote}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-2xl border border-[#2C2C2C] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#171717] border-b border-[#2C2C2C] flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#A1A1AA]">
                  Ordered Items ({(inspectOrder.items || []).length})
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Net Profit: +{formatBdt(inspectOrder.profitBdt ?? 0)}
                </span>
              </div>
              <div className="divide-y divide-[#2C2C2C]">
                {(inspectOrder.items || []).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-3 bg-[#141414]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 shrink-0">
                        <StoreProductVisual
                          imageUrl={item.product?.imageUrl}
                          category={item.product?.category || 'ACCESSORIES'}
                          name={item.productName}
                          className="h-12"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs font-mono text-[#A1A1AA]">
                          {formatBdt(item.unitPriceBdt)} × {item.quantity}
                          {item.product?.sku ? ` • SKU: ${item.product.sku}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold text-[#C7F464]">
                        {formatBdt(item.subtotalBdt)}
                      </p>
                      {item.profitBdt !== null && item.profitBdt !== undefined && (
                        <p className="font-mono text-[11px] text-emerald-400">
                          +{formatBdt(item.profitBdt)} profit
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-[#171717] border-t border-[#2C2C2C] space-y-1.5">
                {inspectOrder.discountCode && Number(inspectOrder.discountAmountBdt || 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
                      <span>Subtotal</span>
                      <span>
                        {formatBdt(
                          inspectOrder.subtotalBdt ??
                          Number(inspectOrder.totalAmountBdt || 0) +
                          Number(inspectOrder.discountAmountBdt || 0),
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-[#C7F464]">
                      <span>Promo Discount ({inspectOrder.discountCode})</span>
                      <span>-{formatBdt(inspectOrder.discountAmountBdt)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#A1A1AA]">
                    Order Total ({inspectOrder.paymentMethod})
                  </span>
                  <span className="font-display text-2xl text-[#C7F464]">
                    {formatBdt(inspectOrder.totalAmountBdt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {inspectOrder.status !== 'COMPLETED' &&
                  inspectOrder.status !== 'CANCELLED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="ifg-btn-primary"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => handleUpdateOrderStatus(inspectOrder.id, 'COMPLETED')}
                    >
                      Complete Payment &amp; Generate Slip
                    </Button>
                  )}
                {inspectOrder.status !== 'CANCELLED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => setSlipOrder(inspectOrder)}
                  >
                    {inspectOrder.status === 'COMPLETED'
                      ? 'Open Payment Slip'
                      : 'Preview Voucher'}
                  </Button>
                )}
              </div>

              <Button variant="ghost" onClick={() => setInspectOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Promo Code Modal (Admin & Super Admin Only) */}
      <Modal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title="Generate Store Promo Code"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePromoCode} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#1B2210] border border-[#C7F464]/45 text-xs leading-relaxed text-white/90">
            Only <span className="font-bold text-[#C7F464]">Gym Admin</span> and{' '}
            <span className="font-bold text-[#C7F464]">Super Admin</span> can generate
            discount codes and set how many days they stay valid.
          </div>

          <Input
            label="Promo Code (Leave blank to auto-generate)"
            value={promoForm.code}
            onChange={(e) =>
              setPromoForm((f) => ({
                ...f,
                code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
              }))
            }
            placeholder="e.g. ICON15 or EID500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-[#A1A1AA] uppercase">
                Discount Type *
              </label>
              <select
                value={promoForm.discountType}
                onChange={(e) =>
                  setPromoForm((f) => ({
                    ...f,
                    discountType: e.target.value as 'PERCENTAGE' | 'FIXED_BDT',
                  }))
                }
                className="ifg-input w-full h-11 px-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_BDT">Fixed Amount (BDT ৳)</option>
              </select>
            </div>
            <Input
              label={
                promoForm.discountType === 'PERCENTAGE'
                  ? 'Discount % *'
                  : 'Discount Amount (BDT) *'
              }
              type="number"
              required
              min="1"
              max={promoForm.discountType === 'PERCENTAGE' ? '100' : undefined}
              value={promoForm.discountValue}
              onChange={(e) =>
                setPromoForm((f) => ({ ...f, discountValue: e.target.value }))
              }
              placeholder={promoForm.discountType === 'PERCENTAGE' ? '10' : '250'}
            />
          </div>

          <div className="space-y-2">
            <Input
              label="Valid For How Many Days * (1 – 3650 days)"
              type="number"
              required
              min="1"
              max="3650"
              value={promoForm.validDays}
              onChange={(e) =>
                setPromoForm((f) => ({ ...f, validDays: e.target.value }))
              }
              placeholder="7"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 3, 7, 15, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPromoForm((f) => ({ ...f, validDays: String(d) }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${Number(promoForm.validDays) === d
                    ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-bold'
                    : 'bg-[#171717] text-[#A1A1AA] border-[#2C2C2C] hover:text-white'
                    }`}
                >
                  {d} {d === 1 ? 'Day' : 'Days'}
                </button>
              ))}
            </div>
            {Number(promoForm.validDays) >= 1 && (
              <p className="text-[11px] font-mono text-[#C7F464]">
                Will expire on:{' '}
                {formatDateTime(
                  new Date(
                    Date.now() + Number(promoForm.validDays) * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Min Order (BDT)"
              type="number"
              min="0"
              value={promoForm.minOrderBdt}
              onChange={(e) =>
                setPromoForm((f) => ({ ...f, minOrderBdt: e.target.value }))
              }
              placeholder="Optional"
            />
            {promoForm.discountType === 'PERCENTAGE' && (
              <Input
                label="Max Cap (BDT)"
                type="number"
                min="1"
                value={promoForm.maxDiscountBdt}
                onChange={(e) =>
                  setPromoForm((f) => ({ ...f, maxDiscountBdt: e.target.value }))
                }
                placeholder="Optional"
              />
            )}
            <Input
              label="Max Uses"
              type="number"
              min="1"
              value={promoForm.maxUses}
              onChange={(e) =>
                setPromoForm((f) => ({ ...f, maxUses: e.target.value }))
              }
              placeholder="Unlimited"
            />
          </div>

          <Input
            label="Campaign Note / Description (Optional)"
            value={promoForm.description}
            onChange={(e) =>
              setPromoForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="e.g. Weekend Whey & Gear Flash Sale"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPromoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="ifg-btn-primary rounded-xl"
              isLoading={savingPromo}
            >
              Generate Promo Code
            </Button>
          </div>
        </form>
      </Modal>

      <StoreOrderSlipModal
        isOpen={Boolean(slipOrder)}
        onClose={() => setSlipOrder(null)}
        order={slipOrder}
      />
    </div>
  );
}
