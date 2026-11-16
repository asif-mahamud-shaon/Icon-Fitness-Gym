# 01. Project Overview — Icon Fitness Gym

> **Location:** Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh  
> **Architecture:** Next.js 14 App Router · NestJS 10 REST API · PostgreSQL 16 (`41` Models)

---

## 1.1 Executive Summary

**Icon Fitness Gym** is a full-stack web platform, Pro-Shop gear store, member & trainer portal, smart access-control controller, and comprehensive gym management ERP built for **Icon Fitness Gym** in **Ashkona, Dakshinkhan, Dhaka**.

Unlike static gym templates, this platform is a real transactional system backed by PostgreSQL (`41` Prisma models), a modular NestJS REST API (`25` domain modules), dual-theme UI support, hybrid RBAC with delegatable employee permissions, and database-level concurrency & audit guarantees.

---

## 1.2 Core Platform Objectives

- **Brand Showcase & Website CMS**  
  Architectural Light-default (`#F8FAFC` / `#FFFFFF` / `#84CC16`) + toggleable Dark Cinematic (`#090909` / `#141414` / `#C7F464`) design system with configurable Homepage blocks, header pins, Ashkona Google Map, and JSON-LD `HealthClub` SEO.
- **Icon Gear Store, Online Delivery & QR Slip Tracking (`/store`)**  
  Full supplement & gear storefront featuring **Ashkona Desk Pickup (`৳0`)** and **Online Home Delivery (`৳80` Dhaka / `৳150` Nationwide)**, promo codes, **Running Gym Student ID (`IFG-****`)** auto-fill & `৳0` advance waiver, auto-downloading **PNG Cash Memo Payment Slips**, and public **4-stage Live QR Order Tracking** (`/verify/order/[code]`).
- **Member Portal (`/member/*`)**  
  Self-service tracking of `Asia/Dhaka` membership validity, renewal requests, concurrency-safe class bookings, assigned workout plans, biometric consent (`/member/access`), receipts, and Store ordering (`/member/store`).
- **Trainer Portal (`/trainer/*`)**  
  Assigned roster with health/goal insights (KYC & biometric ciphers strictly redacted), class/session attendance, physical Ladies-Session check-ins, and workout authoring.
- **Admin ERP Command Center (`/admin/*`)**  
  Executive Recharts KPIs, Member/Payment lifecycles, **Store POS & Profit Analytics**, **CRM Leads & Retention Radar**, **HRM Staff Payroll & Utility Bills**, **Website CMS**, **18-Key Employee Permission Matrix**, CSV exports, and immutable `AuditLog`.

---

## 1.3 User Personas & Access Scopes

| Persona                 | Role Enum     | Primary Workspace          | Key Capabilities                                                       |
| :---------------------- | :------------ | :------------------------- | :--------------------------------------------------------------------- |
| **Visitor / Guest**     | `PUBLIC`      | `/(public)/*`, `/store`    | Browse plans/schedules, shop w/ `৳500` advance, track QR orders        |
| **Gym Member**          | `MEMBER`      | `/member/*`                | Manage membership, classes, workouts, biometrics, receipts, `৳0` store |
| **Fitness Trainer**     | `TRAINER`     | `/trainer/*`               | Coach assigned clients, mark class attendance, build workout plans     |
| **Front-Desk Staff**    | `STAFF`       | `/admin/*` *(Permitted)*   | Register walk-ins, verify payments, Store POS/CRM, manual gate checks  |
| **Gym Administrator**   | `ADMIN`       | `/admin/*` *(Full Ops)*    | Pricing, refunds, promo codes, HRM payroll, CMS, CSVs, gate rules      |
| **Super Administrator** | `SUPER_ADMIN` | `/admin/*` *(Unrestricted)*| Admin/staff account creation, role changes, full audit log control     |

---

## 1.4 Official Ashkona Session Schedule (`Asia/Dhaka`)

| Session Window                 | Days       | Hours (`Asia/Dhaka`)  | Session Type     | Entry Policy                                              |
| :----------------------------- | :--------- | :-------------------- | :--------------- | :-------------------------------------------------------- |
| **Morning & Midday General**   | Sat – Thu  | `07:00 AM – 01:00 PM` | `MALE_SESSION`   | Active Male & Female Members                              |
| **Dedicated Ladies-Only Slot** | Sat – Thu  | `01:00 PM – 03:30 PM` | `FEMALE_SESSION` | **Female Members only** + checked-in Female Trainer req.  |
| **Afternoon & Evening General**| Sat – Thu  | `03:30 PM – 11:00 PM` | `MALE_SESSION`   | Active Male & Female Members                              |
| **Friday Evening Session**     | Friday     | `05:00 PM – 11:00 PM` | `MALE_SESSION`   | Active Male & Female Members                              |

---

← [Back to README](../README.md) · Next: [02. Requirements Specification →](./REQUIREMENTS.md)
