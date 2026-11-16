'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  Info,
  MapPin,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react';
import { apiFetch, formatBdt } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  getProductHighlights,
  readStoredCart,
  StoreCartMap,
  writeStoredCart,
} from '@/lib/store-cart';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import {
  STORE_CATEGORY_META,
  StoreCategoryIcon,
  StoreProductVisual,
} from '@/components/shared/StoreProductVisual';
import { StoreCheckoutModal } from '@/components/shared/StoreCheckoutModal';

export default function StoreProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';
  const { toast } = useToast();

  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<StoreCartMap>({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setNotFoundError(false);
    try {
      const data = await apiFetch<{ product: any; relatedProducts: any[] }>(
        `/store/products/${encodeURIComponent(slug)}`,
      );
      setProduct(data.product);
      setRelatedProducts(
        Array.isArray(data.relatedProducts) ? data.relatedProducts : [],
      );
      setQty(1);
    } catch {
      setProduct(null);
      setNotFoundError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setCart(readStoredCart());
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    writeStoredCart(cart);
  }, [cart, cartHydrated]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

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

  const addItemToCart = (item: any, addCount = 1, openBag = false) => {
    const stock = Number(item.stockQty || 0);
    if (stock <= 0) return;

    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = Math.min(stock, (existing?.quantity || 0) + addCount);
      return {
        ...prev,
        [item.id]: { product: item, quantity: nextQty },
      };
    });

    if (openBag) {
      setCheckoutOpen(true);
    } else {
      toast({
        title: 'Added to Gear Bag',
        description: `${addCount} × ${item.name} added to your pickup bag.`,
        variant: 'success',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 space-y-8">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-6 h-[440px] rounded-3xl" />
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFoundError || !product) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-14">
        <EmptyState
          title="Product Not Found"
          description="This gear or supplement item may be temporarily unavailable or archived from the catalog."
          action={
            <Link href="/store">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Gym Store
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const stock = Number(product.stockQty || 0);
  const price = Number(product.priceBdt || 0);
  const compareAt = product.compareAtBdt ? Number(product.compareAtBdt) : null;
  const savingsBdt =
    compareAt && compareAt > price ? Math.round(compareAt - price) : 0;
  const savingsPct =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0;
  const catMeta = STORE_CATEGORY_META[product.category];
  const highlights = getProductHighlights(product.category);
  const currentInBag = cart[product.id]?.quantity || 0;
  const maxAddable = Math.max(0, stock - currentInBag);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 space-y-12">
      {/* Top Breadcrumb & Cart Quick Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 uppercase tracking-wider text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gear &amp; Fuel Store</span>
          </Link>
          <span className="text-[#52525B]">/</span>
          <span className="inline-flex items-center gap-1.5 text-[#C7F464] uppercase">
            <StoreCategoryIcon category={product.category} className="w-3.5 h-3.5" />
            {catMeta?.label || product.category}
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          className="ifg-btn-primary rounded-2xl"
          leftIcon={<ShoppingBag className="w-4 h-4" />}
          onClick={() => setCheckoutOpen(true)}
        >
          View Bag ({totalCartUnits}) • {formatBdt(totalCartBdt)}
        </Button>
      </div>

      {/* Main Two-Column Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Visual & Authenticity Badges */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-4 sm:p-5 rounded-3xl border border-[#2C2C2C] space-y-4">
            <div className="relative dark-media-card">
              <StoreProductVisual
                imageUrl={product.imageUrl}
                category={product.category}
                name={product.name}
                className="h-[340px] sm:h-[430px]"
              />
              {product.badgeText && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#090909]/85 border border-[#C7F464]/50 text-xs font-mono font-bold uppercase text-[#C7F464]">
                  {product.badgeText}
                </span>
              )}
              <span
                className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-bold border bg-[#090909]/85 ${
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
                    ? `Only ${stock} Left`
                    : `${stock} Units Ready`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C7F464] shrink-0" />
                <span className="text-[#E4E4E7] font-medium">
                  100% Authentic Sealed
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C7F464] shrink-0" />
                <span className="text-[#E4E4E7] font-medium">
                  Ashkona Desk Pickup
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#C7F464] shrink-0" />
                <span className="text-[#E4E4E7] font-medium">
                  Cash / bKash / Nagad
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Detailed Product Specifications, Pricing & Purchase Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[#C7F464] uppercase font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                {product.brand || 'Icon Fitness Gear'}
              </span>
              {product.unitLabel && (
                <span className="px-3 py-1 rounded-full bg-[#171717] border border-[#2C2C2C] text-white uppercase">
                  {product.unitLabel}
                </span>
              )}
              {product.sku && (
                <span className="px-3 py-1 rounded-full bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA]">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-[1.02]">
              {product.name}
            </h1>
          </div>

          {/* Pricing Block */}
          <Card className="p-5 rounded-3xl border border-[#2C2C2C] space-y-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl sm:text-5xl text-[#C7F464]">
                {formatBdt(price)}
              </span>
              {compareAt && compareAt > price && (
                <span className="text-lg font-mono line-through text-[#A1A1AA]">
                  {formatBdt(compareAt)}
                </span>
              )}
              {savingsBdt > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono font-bold text-[#C7F464]">
                  <Tag className="w-3.5 h-3.5" />
                  Save {formatBdt(savingsBdt)} ({savingsPct}% OFF)
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#A1A1AA]">
              Member &amp; Walk-in Fixed Price • Instant Reserve for Ashkona Front Desk Handover
            </p>
          </Card>

          {/* Full Product Overview */}
          <div className="space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Product Description &amp; Details
            </h2>
            <p className="text-sm sm:text-base text-[#D4D4D8] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Structured Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">Brand</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">
                {product.brand || 'Icon Fitness Gear'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">Category</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">
                {catMeta?.label || product.category}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                Size / Pack / Spec
              </p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">
                {product.unitLabel || 'Standard Unit'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                SKU Reference
              </p>
              <p className="text-sm font-mono font-semibold text-white mt-0.5 truncate">
                {product.sku || 'IFG-STORE'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                Stock Status
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  stock === 0
                    ? 'text-rose-400'
                    : stock <= 5
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {stock === 0 ? 'Out of Stock' : `${stock} Available`}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                Pickup Point
              </p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">
                Ashkona Front Desk
              </p>
            </div>
          </div>

          {/* Quantity + Add to Bag + Instant Reserve CTA */}
          <Card className="p-5 rounded-3xl border border-[#2C2C2C] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase text-[#A1A1AA]">
                  Select Quantity
                </p>
                {currentInBag > 0 && (
                  <p className="text-xs text-[#C7F464] font-mono mt-0.5">
                    {currentInBag} already in your bag
                  </p>
                )}
              </div>

              <div className="inline-flex items-center gap-2 bg-[#171717] border border-[#2C2C2C] rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1 || stock === 0}
                  className="w-9 h-9 rounded-lg bg-[#141414] flex items-center justify-center text-white hover:text-[#C7F464] disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono text-sm font-bold text-white">
                  {stock === 0 ? 0 : qty}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQty((q) => Math.min(Math.max(1, maxAddable || stock), q + 1))
                  }
                  disabled={stock === 0 || qty >= (maxAddable || stock)}
                  className="w-9 h-9 rounded-lg bg-[#141414] flex items-center justify-center text-white hover:text-[#C7F464] disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                disabled={stock === 0 || maxAddable === 0}
                className="rounded-2xl"
                leftIcon={<ShoppingBag className="w-4 h-4" />}
                onClick={() => addItemToCart(product, qty, false)}
              >
                {stock === 0
                  ? 'Sold Out'
                  : maxAddable === 0
                    ? 'Max Stock in Bag'
                    : `Add to Bag (${formatBdt(price * qty)})`}
              </Button>

              <Button
                variant="primary"
                size="lg"
                disabled={stock === 0}
                className="ifg-btn-primary rounded-2xl"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  if (maxAddable > 0) {
                    addItemToCart(product, Math.min(qty, maxAddable), true);
                  } else {
                    setCheckoutOpen(true);
                  }
                }}
              >
                Reserve &amp; Checkout Now
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Category Highlights, Care & Ashkona Desk Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C7F464]">
            <Package className="w-4 h-4" />
            <span>{highlights.usageTitle}</span>
          </div>
          <ul className="space-y-2.5 text-sm text-[#D4D4D8]">
            {highlights.usagePoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C7F464]">
            <Info className="w-4 h-4" />
            <span>Storage, Sizing &amp; Care</span>
          </div>
          <ul className="space-y-2.5 text-sm text-[#D4D4D8]">
            {highlights.carePoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C7F464]">
            <MapPin className="w-4 h-4" />
            <span>How Ashkona Desk Pickup Works</span>
          </div>
          <ol className="space-y-2.5 text-sm text-[#D4D4D8] list-decimal list-inside">
            <li>
              Click <strong>Reserve &amp; Checkout Now</strong> to lock your stock with
              an instant Order ID.
            </li>
            <li>
              Pay in person via Cash / Card at the Ashkona Reception Desk or submit bKash /
              Nagad TrxID online.
            </li>
            <li>
              Show your Order ID at Reception to inspect &amp; collect your sealed product.
            </li>
          </ol>
        </Card>
      </div>

      {/* Related Gym Gear & Supplements */}
      {relatedProducts.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                Complete Your Training Kit
              </p>
              <h2 className="font-display text-2xl sm:text-3xl uppercase text-white">
                Related Gear &amp; Supplements
              </h2>
            </div>
            <Link
              href="/store"
              className="text-xs font-mono uppercase text-[#C7F464] hover:underline inline-flex items-center gap-1"
            >
              <span>Browse Full Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rel) => {
              const relStock = Number(rel.stockQty || 0);
              return (
                <Card
                  key={rel.id}
                  className="p-4 rounded-3xl border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-3">
                    <Link
                      href={`/store/${rel.slug}`}
                      className="block relative dark-media-card"
                    >
                      <StoreProductVisual
                        imageUrl={rel.imageUrl}
                        category={rel.category}
                        name={rel.name}
                        className="h-40"
                      />
                    </Link>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                        {STORE_CATEGORY_META[rel.category]?.label || rel.category}
                      </p>
                      <Link href={`/store/${rel.slug}`} className="block group">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#C7F464] transition-colors line-clamp-2">
                          {rel.name}
                        </h3>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-between gap-2">
                    <span className="font-display text-xl text-[#C7F464]">
                      {formatBdt(rel.priceBdt)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/store/${rel.slug}`}
                        className="inline-flex items-center gap-1 px-2.5 h-8 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/60 text-xs font-semibold text-white"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={relStock === 0}
                        className="rounded-xl"
                        onClick={() => addItemToCart(rel, 1, false)}
                      >
                        + Add
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Bag Shortcut */}
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
        onOrderSuccess={loadProduct}
      />
    </div>
  );
}
