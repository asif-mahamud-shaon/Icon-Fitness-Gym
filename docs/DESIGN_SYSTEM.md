# 03. Design System — Icon Fitness Gym

> **Dual-Theme Architectural UI:** Light Mode Default (`#F8FAFC` + `#84CC16`) · Dark Cinematic Toggle (`#090909` + `#C7F464`)  
> **Fonts:** `Anton` · `Inter` · `Space Grotesk`

---

## 3.1 Dual-Theme Philosophy (`ThemeContext`)

The UI delivers crisp studio clarity in Light Mode by default and high-contrast cinematic focus in Dark Mode, persisted in `localStorage['ifg_theme_mode']`:

- **Light Mode (`data-theme="light"`, Default):** Clean slate canvas (`#F8FAFC`), pure white elevated surfaces (`#FFFFFF`), high-legibility Slate-900 typography (`#0F172A`), and sharp moss-lime accents (`#84CC16`).
- **Dark Cinematic Mode (`data-theme="dark"`):** Deep Obsidian canvas (`#090909`), Charcoal sidebars (`#141414`), elevated cards (`#1E1E1E`), and high-visibility Electric Lime (`#C7F464`).
- **Restraint:** Crisp `1px` structural borders, tabular numerals (`tabular-nums`) for all `৳` BDT metrics, zero decorative rainbow gradients, and zero clutter.

---

## 3.2 Color Tokens

### Light Mode (Default Canvas)
| Token             | CSS Variable          | Hex       | Usage                                    |
| :---------------- | :-------------------- | :-------- | :--------------------------------------- |
| Canvas            | `--bg-obsidian`       | `#F8FAFC` | Primary page canvas                      |
| Secondary Section | `--bg-charcoal`       | `#FFFFFF` | Sidebar, navbar, section containers      |
| Card Surface      | `--bg-surface`        | `#FFFFFF` | Modals, cards, dropdowns, bento tiles    |
| Elevated Surface  | `--bg-elevated`       | `#F1F5F9` | Hover rows, input fills, soft badges     |
| Accent Lime       | `--accent-lime`       | `#84CC16` | Primary CTAs, active tabs, focus accents |
| Lime Hover        | `--accent-lime-hover` | `#65A30D` | Hover state for primary buttons          |
| Primary Text      | `--text-primary`      | `#0F172A` | Headings, body text, strong labels       |
| Secondary Text    | `--text-secondary`    | `#475569` | Captions, metadata, table subheaders     |
| Muted Border      | `--border-muted`      | `#E2E8F0` | 1px card hairlines, table dividers       |

### Dark Mode (`html[data-theme='dark']`)
| Token             | CSS Variable          | Hex       | Usage                                    |
| :---------------- | :-------------------- | :-------- | :--------------------------------------- |
| Obsidian Black    | `--bg-obsidian`       | `#090909` | Primary dark canvas                      |
| Charcoal          | `--bg-charcoal`       | `#141414` | Sidebar, secondary containers            |
| Card Surface      | `--bg-surface`        | `#1E1E1E` | Cards, modals, dropdowns                 |
| Elevated Surface  | `--bg-elevated`       | `#282828` | Hover rows and raised controls           |
| Electric Lime     | `--accent-lime`       | `#C7F464` | Primary CTAs, active badges, metrics     |
| Lime Hover        | `--accent-lime-hover` | `#D4F882` | Primary hover accent                     |
| Primary Text      | `--text-primary`      | `#FFFFFF` | High-emphasis headings and body copy     |
| Secondary Text    | `--text-secondary`    | `#A1A1AA` | Descriptions and secondary labels        |
| Muted Border      | `--border-muted`      | `#2A2A2A` | Hairline structural borders              |

### Semantic Status Indicators
- **Success (`#22C55E` / Emerald):** Active memberships, verified payments, granted gate access, delivered orders
- **Warning (`#F59E0B` / Amber):** Pending TrxID checks, expiring soon, non-member `৳500` advance alerts
- **Danger (`#EF4444` / Rose):** Expired, suspended, denied entry, destructive warnings
- **Info (`#38BDF8` / Sky):** Courier transit stages, trainer guidance, operational announcements

---

## 3.3 Typography Scale (`next/font/google`)

| Role            | Font Family     | CSS Variable     | Weights       | Conventions                                    |
| :-------------- | :-------------- | :--------------- | :------------ | :--------------------------------------------- |
| **Display**     | `Anton`         | `--font-display` | `400`         | Uppercase hero titles and architectural headers |
| **Body & UI**   | `Inter`         | `--font-sans`    | `400 – 700`   | Clean UI copy, forms, tables, portal sidebars  |
| **Metrics/IDs** | `Space Grotesk` | `--font-mono`    | `500, 600, 700` | `tabular-nums` for `৳` BDT totals, `IFG-*` IDs |

---

## 3.4 Layout Shells & Core Components

- **Container & Grids:** `max-w-container` (`1360px`) centered wrapper; 12-column desktop Bento grids collapsing cleanly to mobile stacks.
- **Public Chrome:** `PublicNavbar` (CMS links + theme toggle + bag badge) · `PublicFooter` · `MobileBottomNav`.
- **Portal Shell (`PortalShell`):** Fixed `280px` desktop sidebar + mobile drawer, top bar, notifications, theme toggle, and permission-filtered menus.
- **Store & Cash Memo Components:**
  - `StoreCheckoutModal`: 2-step Bag → Delivery/Payment wizard + `IFG-****` Gym ID verification + official Contact bKash card.
  - `StoreOrderSlipModal` & `download-order-slip.ts`: Printable/downloadable PNG Cash Memo matching Admin POS receipts.
  - `QrCodeSvg` & `PromoCodeInput`: Live QR matrix rendering and coupon validation.
- **Portals & Biometrics:** `ReceiptModal`, `FaceVerificationFormModal`, `AdminSettingsWorkspace`, `Card`, `StatCard`, `StatusBadge`, `Modal`, `Pagination`.

---

← [02. Requirements](./REQUIREMENTS.md) · Next: [04. System Architecture →](./SYSTEM_ARCHITECTURE.md)
