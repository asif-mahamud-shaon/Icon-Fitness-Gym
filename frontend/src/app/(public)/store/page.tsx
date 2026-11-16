'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Sparkles,
  MapPin,
  CreditCard,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { apiFetch, formatBdt } from '@/lib/api';
import {
  readStoredCart,
  StoreCartMap,
  writeStoredCart,
} from '@/lib/store-cart';
import {
  Card,
  Button,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import {
  StoreProductVisual,
  StoreCategoryIcon,
  STORE_CATEGORY_META,
  formatStoreCategoryLabel,
} from '@/components/shared/StoreProductVisual';
import { StoreCheckoutModal } from '@/components/shared/StoreCheckoutModal';

const CATEGORY_TABS = [
  { key: 'ALL', label: 'All Gear & Fuel' },
  { key: 'BOTTLES', label: 'Water Bottles' },
  { key: 'GLOVES', label: 'Gym Gloves' },
  { key: 'BELTS', label: 'Lifting Belts' },
  { key: 'SUPPLEMENTS', label: 'Protein & Creatine' },
  { key: 'ACCESSORIES', label: 'Straps & Wraps' },
  { key: 'APPAREL', label: 'Gym Apparel' },
];

export default function GymStorePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<StoreCartMap>({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>('/store/products');
      setProducts(Array.isArray(list) ? list : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCart(readStoredCart());
    setCartHydrated(true);
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    writeStoredCart(cart);
  }, [cart, cartHydrated]);

  const dynamicCategoryTabs = useMemo(() => {
    const known = new Set(CATEGORY_TABS.map((t) => t.key));
    const extras: Array<{ key: string; label: string }> = [];
    for (const p of products) {
      const key = String(p.category || '').trim().toUpperCase();
      if (key && !known.has(key)) {
        known.add(key);
        extras.push({ key, label: formatStoreCategoryLabel(key) });
      }
    }
    return [...CATEGORY_TABS, ...extras];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.brand || '').toLowerCase().includes(q) ||
        String(p.description || '').toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, search]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalCartUnits = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const totalCartBdt = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.product.priceBdt || 0) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const addToCart = (product: any) => {
    if (Number(product.stockQty || 0) <= 0) return;
    setCart((prev) => {
      const existing = prev[product.id];
      const nextQty = Math.min(
        Number(product.stockQty || 1),
        (existing?.quantity || 0) + 1,
      );
      return {
        ...prev,
        [product.id]: { product, quantity: nextQty },
      };
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const entry = prev[productId];
      if (!entry) return prev;
      const maxStock = Number(entry.product.stockQty || 0);
      const next = entry.quantity + delta;
      if (next <= 0) {
        const clone = { ...prev };
        delete clone[productId];
        return clone;
      }
      return {
        ...prev,
        [productId]: { ...entry, quantity: Math.min(maxStock, next) },
      };
    });
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-[#141414] border border-[#2C2C2C] p-6 sm:p-10 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/30 text-[11px] font-mono font-bold uppercase tracking-widest text-[#C7F464]">
              <Sparkles className="w-3.5 h-3.5" />
              Icon Pro Gear &amp; Supplements
            </div>
            <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white leading-none">
              Gym Gear, Bottles, Belts &amp;{' '}
              <span className="text-[#C7F464]">Nutrition</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
              Order insulated gym water bottles, padded lifting gloves, 10mm
              powerlifting belts, authentic whey protein, creatine, and lifting
              straps directly for fast pickup at our Ashkona Reception Desk.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-[#A1A1AA]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C7F464]" />
                100% Authentic Sealed Gear
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C7F464]" />
                Ashkona Pickup &amp; Nationwide Online Delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#C7F464]" />
                Cash / bKash / Nagad / Card
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <Button
              variant="primary"
              size="lg"
              className="ifg-btn-primary rounded-2xl"
              leftIcon={<ShoppingBag className="w-5 h-5" />}
              onClick={() => setCheckoutOpen(true)}
            >
              View Bag ({totalCartUnits}) • {formatBdt(totalCartBdt)}
            </Button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {dynamicCategoryTabs.map((tab) => {
            const active = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap border transition-all ${
                  active
                    ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                    : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50 hover:text-white'
                }`}
              >
                {tab.key !== 'ALL' && (
                  <StoreCategoryIcon category={tab.key} className="w-3.5 h-3.5" />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search water bottle, belt, protein..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
          />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-96 rounded-3xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No Matching Gear Found"
          description="Try another category or clear your search filter to view all gym gear and supplements."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearch('');
              }}
            >
              Show All Products
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const qtyInCart = cart[product.id]?.quantity || 0;
            const stock = Number(product.stockQty || 0);
            const price = Number(product.priceBdt || 0);
            const compareAt = product.compareAtBdt
              ? Number(product.compareAtBdt)
              : null;
            const catMeta = STORE_CATEGORY_META[product.category];

            return (
              <Card
                key={product.id}
                className="p-4 rounded-3xl border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-all flex flex-col justify-between gap-4 overflow-hidden"
              >
                <div className="space-y-3.5 min-w-0">
                  <Link
                    href={`/store/${product.slug}`}
                    className="block relative dark-media-card group"
                  >
                    <StoreProductVisual
                      imageUrl={product.imageUrl}
                      category={product.category}
                      name={product.name}
                      className="h-48"
                    />
                    {product.badgeText && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-sm border border-[#C7F464]/50 text-[10px] font-mono font-bold uppercase text-[#C7F464] shadow-sm">
                        {product.badgeText}
                      </span>
                    )}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border bg-black/85 backdrop-blur-sm shadow-sm ${
                        stock === 0
                          ? 'border-rose-500/40 text-rose-400'
                          : stock <= 5
                            ? 'border-amber-500/40 text-amber-400'
                            : 'border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      {stock === 0
                        ? 'Out of Stock'
                        : stock <= 5
                          ? `${stock} Left`
                          : `${stock} In Stock`}
                    </span>
                  </Link>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase text-[#A1A1AA]">
                      <span className="truncate">
                        {catMeta?.label || formatStoreCategoryLabel(product.category)}
                      </span>
                      {product.unitLabel && (
                        <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] shrink-0">
                          {product.unitLabel}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/store/${product.slug}`}
                      className="block group"
                    >
                      <h2 className="text-base font-bold text-white group-hover:text-[#C7F464] transition-colors leading-snug line-clamp-2">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2C2C2C] space-y-2.5 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl text-[#C7F464]">
                        {formatBdt(price)}
                      </span>
                      {compareAt && compareAt > price && (
                        <span className="text-xs font-mono line-through text-[#A1A1AA]">
                          {formatBdt(compareAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Link
                      href={`/store/${product.slug}`}
                      title={`View full details for ${product.name}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/60 text-xs font-semibold text-white hover:text-[#C7F464] transition-colors w-full"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Details</span>
                    </Link>

                    {qtyInCart > 0 ? (
                      <div className="inline-flex items-center justify-between gap-1 bg-[#171717] border border-[#C7F464]/50 rounded-xl px-1.5 h-9 w-full">
                        <button
                          type="button"
                          onClick={() => updateCartQty(product.id, -1)}
                          className="w-7 h-7 rounded-lg bg-[#141414] flex items-center justify-center text-white hover:text-[#C7F464]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-center font-mono text-xs font-bold text-white">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(product.id, 1)}
                          disabled={qtyInCart >= stock}
                          className="w-7 h-7 rounded-lg bg-[#141414] flex items-center justify-center text-white hover:text-[#C7F464] disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={stock === 0}
                        className="rounded-xl w-full h-9 px-3 justify-center"
                        leftIcon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                        onClick={() => addToCart(product)}
                      >
                        {stock === 0 ? 'Sold Out' : 'Add'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Mobile / Bottom Quick Bag Bar */}
      {totalCartUnits > 0 && !checkoutOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-8 z-40">
          <Button
            variant="primary"
            size="lg"
            className="ifg-btn-primary rounded-2xl shadow-2xl"
            leftIcon={<ShoppingBag className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout Bag ({totalCartUnits}) • {formatBdt(totalCartBdt)}
          </Button>
        </div>
      )}

      <StoreCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        setCart={setCart}
        onOrderSuccess={loadCatalog}
      />
    </div>
  );
}
