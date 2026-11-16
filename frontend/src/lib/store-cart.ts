export interface StoreCartItem {
  product: any;
  quantity: number;
}

export type StoreCartMap = Record<string, StoreCartItem>;

const CART_STORAGE_KEY = 'ifg_store_cart_v1';

export function readStoredCart(): StoreCartMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredCart(cart: StoreCartMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredCart(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface ProductCategoryHighlights {
  usageTitle: string;
  usagePoints: string[];
  carePoints: string[];
}

export function getProductHighlights(category: string): ProductCategoryHighlights {
  const upper = String(category || '').toUpperCase();

  if (upper === 'SUPPLEMENTS') {
    return {
      usageTitle: 'Nutrition & Supplement Standards',
      usagePoints: [
        'Factory-sealed batch checked for authenticity and expiry before shelf placement.',
        'Ideal for post-workout recovery, lean strength progression, and daily protein/creatine targets.',
        'Ask our certified coaches at the Ashkona floor for personalized scoop timing.',
      ],
      carePoints: [
        'Store tub tightly sealed in a cool, dry location away from direct sunlight.',
        'Inspect seal integrity at our Ashkona Front Desk upon pickup.',
        'Consumable sealed nutrition items cannot be returned once factory seal is opened.',
      ],
    };
  }

  if (upper === 'BOTTLES') {
    return {
      usageTitle: 'Hydration & Daily Gym Utility',
      usagePoints: [
        'BPA-free, food-grade construction built for pre-workout, intra-workout, and protein shakes.',
        'Leak-tested cap seal safe for gym bags and locker storage.',
        'Fits standard treadmill, bike, and cable machine bottle holders.',
      ],
      carePoints: [
        'Rinse immediately after protein or BCAA mixes to prevent odor buildup.',
        'Hand-wash warm with mild soap for longest finish & seal durability.',
        'Free chilled purified water refill stations available on the Ashkona gym floor.',
      ],
    };
  }

  if (upper === 'BELTS' || upper === 'GLOVES' || upper === 'ACCESSORIES') {
    return {
      usageTitle: 'Strength Performance & Joint Support',
      usagePoints: [
        'Engineered for barbell squats, deadlifts, bench pressing, rows, and heavy cable pulls.',
        'Reinforced stitching and heavy-duty hardware built for high-frequency training.',
        'Try sizing / grip fit directly at the Ashkona Reception Desk before final handover.',
      ],
      carePoints: [
        'Air dry after heavy training sessions; avoid machine drying leather or neoprene gear.',
        'Check velcro, prongs, and wrist loops regularly for optimal lifting tension.',
        'Exchangeable at Ashkona Desk within 48 hours if unused with original tag.',
      ],
    };
  }

  return {
    usageTitle: 'Performance Apparel & Training Fit',
    usagePoints: [
      'Breathable sweat-wicking athletic construction suited for strength and HIIT sessions.',
      'Athletic cut tailored for unrestricted shoulder and squat range of motion.',
      'Available size verification right at our Ashkona Reception Desk.',
    ],
    carePoints: [
      'Machine wash cold with similar colors; do not iron over performance logos.',
      'Hang dry to retain 4-way stretch elasticity.',
      'Size exchange supported at Ashkona Desk if unworn with tags intact.',
    ],
  };
}
