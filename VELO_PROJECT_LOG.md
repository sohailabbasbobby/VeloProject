# 📋 VELO PROJECT — MASTER BUILD LOG
> **Purpose:** Single source of truth for everything built, every instruction given, every decision finalised. Updated continuously. Never delete entries — only append.

---

## 🏗️ PROJECT OVERVIEW
**Velo** is a premium executive chauffeur platform with a multi-tenant architecture. It connects passengers, drivers, and fleet operators through a suite of apps and dashboards.

### Velo Brand Identity
- **Primary Colour:** `#D4AF37` (Gold)
- **Background:** `#070708` (Near Black)
- **Surface:** `#111112`
- **Accent Green (Online):** `#34C759`
- **Accent Red (Offline/Cancel):** `#FF3B30`
- **Accent Blue:** `#007AFF`
- **Font Style:** Bold, uppercase labels with wide letter-spacing

---

## 📁 PROJECT STRUCTURE (All Locations)

```
/Users/Bobby/Documents/Velo/VeloProject/
├── backend/                          ← Firebase Cloud Functions (API Gateway)
│   └── functions/index.js            ← All Firebase callable functions
├── backend-core/                     ← Core Express/TypeScript REST API
│   └── src/
│       ├── server.ts                 ← Entry point
│       ├── app.ts                    ← Express app config
│       ├── routes/                   ← API route definitions
│       ├── controllers/              ← Business logic
│       ├── models/                   ← Data models
│       ├── middleware/               ← Auth, validation
│       └── utils/                    ← Shared utilities
├── customer-mobile-app/              ← React Native iOS Customer App
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.tsx        ← Main booking screen
│       │   ├── TripHistoryScreen.tsx
│       │   ├── UpcomingBookingsScreen.tsx
│       │   ├── SavedAddressesScreen.tsx
│       │   ├── MessagingVaultScreen.tsx
│       │   ├── PaymentMethodScreen.tsx
│       │   ├── ProfileScreen.tsx
│       │   ├── SettingsScreen.tsx
│       │   └── TravelLedgerScreen.tsx
│       └── components/
│           ├── SecureBookingEngine.tsx   ← Full booking form
│           ├── SideMenuDrawer.tsx        ← Hamburger side menu
│           ├── VehicleSelectionModal.tsx ← Car class + passenger picker
│           ├── ActiveTripCard.tsx        ← Live trip tracking
│           ├── InteractiveMap.tsx        ← Map component
│           └── NavigationFooter.tsx      ← Bottom tab bar
├── driver-mobile-app/                ← React Native iOS Driver App
│   ├── App.tsx                       ← Root (state + navigation only, ~160 lines)
│   └── src/
│       ├── constants/
│       │   └── theme.ts              ← All colours, sizes, shared styles
│       ├── components/
│       │   ├── VeloSwipeTrack.tsx    ← Custom swipe-to-confirm slider
│       │   └── SidebarDrawer.tsx     ← Driver sidebar with accordions
│       └── screens/
│           ├── GatekeeperScreen.tsx  ← Stage 1: Pre-shift compliance
│           ├── DispatchScreen.tsx    ← Stage 2: Incoming trip request
│           └── ActiveRideScreen.tsx  ← Stage 3: Live trip execution
├── driver-mobile-app-web-backup/     ← Web prototype (26 components, reference only)
├── backoffice-dashboard/             ← Admin / Back-Office web portal
├── tenant-dashboard-erp/             ← Tenant ERP dashboard
└── docker-compose.production.yml    ← Production Docker config
```

---

## 👤 CUSTOMER MOBILE APP — Features Built

### Home Screen (`HomeScreen.tsx`)
- [x] Top card showing customer name (right-aligned with profile photo avatar)
- [x] Dropdown menu for switching between saved addresses
- [x] SecureBookingEngine embedded as a card
- [x] Interactive map placeholder
- [x] Side menu hamburger trigger

### Booking Engine (`SecureBookingEngine.tsx`)
- [x] Multi-stop route entry (Pickup + Drop-off + Add Stop)
- [x] Pickup time selector (Now / Schedule)
- [x] Special instructions text input
- [x] **Vehicle Requirements section (mandatory)**
  - Customer must select number of passengers (mandatory)
  - Customer selects vehicle class (optional)
  - Smart validation: warns if vehicle capacity is exceeded
  - "Get Quote" button locked until vehicle requirements are confirmed
- [x] Get Quote button (gold, locked until Vehicle Requirements confirmed)

### Vehicle Selection Modal (`VehicleSelectionModal.tsx`)
- [x] Vehicle classes: Executive Class (4 pass), First Class (3 pass), MPV (7 pass), Electric Premium (4 pass)
- [x] Passenger stepper (mandatory)
- [x] Bags stepper (optional)
- [x] Capacity validation: red warning if selected car too small
- [x] Auto-suggestion of correct vehicle class when over capacity

### Side Menu Drawer (`SideMenuDrawer.tsx`)
- [x] Menu items (in order):
  1. Profile
  2. Trip History
  3. Upcoming Bookings ← Added per instruction
  4. Saved Addresses
  5. Travel Ledger
  6. Messaging Vault
  7. Payment Methods
  8. Settings
- [x] Close button navigates back to previous screen
- [x] Main menu items navigate back to Home
- [x] Home/back-arrow navigates to Home screen

### Profile Header (Home Screen)
- [x] Customer name displayed (right-aligned)
- [x] Profile photo avatar to the right of the name
- [x] Dropdown below name for address switching (right-aligned)

### Screens
- [x] `TripHistoryScreen.tsx` — Past bookings with date, route, cost
- [x] `UpcomingBookingsScreen.tsx` — Future/upcoming bookings (same format as history)
- [x] `SavedAddressesScreen.tsx` — Saved addresses list
- [x] `MessagingVaultScreen.tsx` — In-app messaging
- [x] `PaymentMethodScreen.tsx` — Payment management
- [x] `ProfileScreen.tsx` — Customer profile editing
- [x] `SettingsScreen.tsx` — App settings
- [x] `TravelLedgerScreen.tsx` — Travel spending breakdown

---

## 🚗 DRIVER MOBILE APP — Features Built

### App Stages
| Stage | Screen | Description |
|-------|--------|-------------|
| STAGE1 | GatekeeperScreen | Pre-shift compliance tunnel |
| STAGE2_IDLE | App.tsx (inline) | Online & Listening radar |
| STAGE2_TAKEOVER | DispatchScreen | Incoming trip assignment |
| STAGE3 | ActiveRideScreen | Live trip execution |
| LANDSCAPE_PAGING | App.tsx (inline) | Fullscreen digital paging board |

### GatekeeperScreen (Pre-Shift Compliance)
- [x] Driver profile header (name + vehicle: Mercedes-Benz S-Class • Black • Reg: LN26 XAA)
- [x] 4 compliance checkboxes (tap to toggle with gold checkmark):
  - Pristine exterior body
  - Cabin vacuumed & prepped
  - Tyre pressure verified
  - Fuel/Battery > 75%
- [x] Odometer mileage entry (mandatory text input)
- [x] Rear cabin photo capture (tap to toggle)
- [x] **Swipe-to-Go-Online slider** (green, disabled until ALL items complete)

### DispatchScreen (Incoming Trip)
- [x] "TRIP REQUEST" header with tenant name (Elite Limos)
- [x] Net settlement payout box (adapts to payroll type)
- [x] Requested pickup time box
- [x] Route itinerary (pickup node → drop-off node with connector)
- [x] Emergency Cancellation button (requires admin approval)
- [x] Swipe-to-Accept slider (green)

### ActiveRideScreen (Live Trip)
- [x] Passenger monogram card (J / MR. JOHN / GOLDMAN SACHS)
- [x] Pickup address info box
- [x] Pickup time info box
- [x] Grace period countdown timer (Phase 2 only, 15 min = 900 seconds)
- [x] No-Show Cancellation button (appears when countdown hits 0)
- [x] Call & Message action buttons
- [x] Emergency Cancellation button (admin verified)
- [x] Phase-based swipe sliders:
  - Phase 1: Blue — "I HAVE ARRIVED"
  - Phase 2: Green — "START TRIP"
  - Phase 3: Red — "END TRIP"
- [x] Digital Paging Board shortcut (tap → fullscreen passenger name)

### SidebarDrawer (☰ Menu)
- [x] Driver profile card (tap to expand → edit name, phone, address)
- [x] Shift Net Revenue Journal widget
- [x] Accordion sections:
  - 📋 Trip History (with per-trip expense logging: Parking, Tolls, Airport Fees + custom)
  - 📊 Ledger & Earnings (shift time, miles driven, net earnings)
  - ⚙️ App Settings (Payroll type toggle: 80/20 % split vs Fixed Wage)
- [x] **Swipe-to-Go-Offline slider** (red) pinned at bottom

### Admin Cancellation Overlay
- [x] Full-screen lockout when cancellation is pending
- [x] 3-second mock approval delay → Alert confirms override
- [x] "Withdraw Cancellation Ticket" button to cancel the request

### Post-Trip Summary & Feedback
- [x] Golden animated Post-Trip card slides up on trip completion
- [x] Displays Trip Duration, Distance Driven, Base Net Earnings, Tip, and Total Payout
- [x] Interactive 5-star customer rating system (defaults to 5 stars)
- [x] Optional multi-line text input for driver feedback
- [x] Swipe-to-Return-to-Pool slider (blue)

### DriverMap Component (`src/components/DriverMap.tsx`) ✅ ADDED 05 Jun 2026
- [x] Full-screen `react-native-maps` MapView, identical dark theme to Customer App
- [x] 21-rule custom Velo pitch-black map style (matching Customer App)
- [x] `showsUserLocation={true}` — driver's real GPS blue dot shown
- [x] Gold car marker (🚘 with gold border ring) at Manchester city centre (default)
- [x] Green **P** pickup marker — appears when stage = DISPATCHED or ACTIVE
- [x] Red **D** dropoff marker — appears when stage = ACTIVE (trip started)
- [x] Map stage adapts automatically to app stage:
  - STAGE2_IDLE → `IDLE` (just GPS dot + car)
  - STAGE2_TAKEOVER → `DISPATCHED` (pickup marker appears)
  - STAGE3 → `ACTIVE` (both pickup + dropoff markers)
- [x] Default region: Manchester city centre (53.4808, -2.2426)
- [x] Mock pickup: Manchester Piccadilly Station
- [x] Mock dropoff: Manchester Airport T2
- [x] `pitchEnabled=false`, `rotateEnabled=false` — clean flat view for driving
- [x] Top status bar updated to use `rgba(7,7,8,0.88)` glass effect so map shows through

### Map Dependencies & Architecture Decision
- [x] `react-native-maps` npm installed (v1.27.2)
- [x] `pod install` run — 75 pods linked
- ⚠️ **New Architecture (Fabric) is MANDATORY in React Native 0.82+** — cannot be disabled
- ⚠️ `react-native-maps` with Apple Maps (default) does NOT work with New Architecture
- ⚠️ `react-native-maps` with New Architecture requires `PROVIDER_GOOGLE` + Google Maps API key
- [x] **Current solution: `MapErrorBoundary` wraps `<DriverMap>`** — catches native crash silently
- [x] **Fallback UI:** animated dark map (gold GPS ping rings + 🚘 marker + road grid) — looks premium
- **Production path:** Set up Google Maps API key → switch to `PROVIDER_GOOGLE` → real map works
- **Alternative path (no API key):** Replace with `@maplibre/maplibre-react-native` (OSM tiles, free, New Arch compatible)


- [x] Custom drag-to-confirm slider (PanResponder)
- [x] Configurable: text, trackColor, thumbColor, textColor
- [x] Snap-back animation if not dragged far enough (< 80%)
- [x] Complete animation if dragged to 80%+
- [x] Disabled state (opacity 0.3)

---

## ⚙️ TECHNICAL DECISIONS FINALISED

| Decision | Chosen Approach |
|----------|----------------|
| New Architecture (RN 0.82+) | Mandatory — cannot be disabled. Both apps run New Arch. |
| Map for Driver App | `MapErrorBoundary` + animated fallback for dev. Production = Google Maps API key or MapLibre. |
| Auth bypass (UI mockup) | Mock session injected into state; Firebase Auth listener commented out |
| Backend API calls (UI mockup) | All `secureFetch` calls wrapped in `/* MOCKED */` comments so they are easy to find and re-enable |
| Driver App structure | Monolithic App.tsx refactored into modular files (see structure above) |
| Payroll display | Adapts to `PERCENTAGE_SPLIT` (80/20) or `FIXED_WAGE` based on settings |
| Grace period | 15 minutes (900 seconds) countdown timer, starts on "I HAVE ARRIVED" swipe |

---

## 🏢 MULTI-TENANT DISPATCH ARCHITECTURE (New Engine)
The system is being upgraded to natively handle Multi-Tenant / Multi-Operator dispatch logic for independent drivers:
- **Core Concept:** A driver has a unique `DriverID` but can be registered under multiple `TenantIDs` (e.g., Elite Limos, Blacklane).
- **Incoming Jobs:** Dispatch cards will prominently feature the `tenantName` and `operatorLogo` so the driver knows the source.
- **Conflict Engine:** 
  - The system will auto-calculate ETA and location delta between accepted trips.
  - E.g., If Trip A ends in Liverpool at 17:00, and an incoming Trip B is in Manchester at 17:30, the system flags a "Schedule Conflict".
  - A modal will force the driver to choose which trip to keep, automatically forfeiting the other.
- **Sidebar Menu:** The Driver's ☰ menu will list "Registered Operators", giving them full visibility into their active channels.

## 📝 USER INSTRUCTIONS LOG (Chronological)

### Customer App Instructions
1. Close button should be on the right; navigates back to previous screen
2. All menu items navigate back to main menu; main menu button goes to Home
3. Add "Upcoming Bookings" menu item above "Saved Addresses" — shows same as History
4. On booking screen: mandatory car type + passenger/bag selection with capacity validation
5. On home screen: show customer profile photo to the right of the customer name
6. Fix alignment of customer name and dropdown (right-aligned, not centered)
7. Profile picture to the right, then name and dropdown below it

### Driver App Instructions
1. Put Login screen on hold until app content is finalised (auth bypassed)
26. Mileage entry box was missing — added back (odometer verification)
7. All API calls mocked (Compliance Error: Unauthorized was appearing)
8. Refactor 700-line App.tsx into modular files for easier management
9. Create master project log file
10. Add map to Driver App — same dark theme as Customer App
    - Result: New Architecture blocks react-native-maps/Apple Maps
    - Fix: MapErrorBoundary with premium animated fallback (app never crashes)
11. Build Post-Trip screen with golden theme, metrics, stars, and feedback input.
12. Build custom Interactive Cancellation Modal (Vehicle Issue, Too Small, etc.).
13. Align all bottom sheets to sit perfectly flush with standard paddings.

---

## 🔜 PENDING / TO-DO

### Customer App
- [ ] Connect SecureBookingEngine to live backend quote API
- [ ] Implement real Firebase Auth for customer login
- [ ] Connect InteractiveMap to live mapping SDK (Google Maps / Apple Maps)
- [ ] Build actual profile photo upload
- [ ] Build real saved addresses CRUD to backend

### Driver App
- [ ] Re-enable Firebase Auth login screen when app content is finalised
- [ ] Re-enable `secureFetch` API calls when backend is ready
- [ ] Implement real camera capture for rear cabin photo
- [ ] Connect odometer to fleet API endpoint
- [ ] Replace mock GPS coordinates with real device location
- [ ] Add polyline route line between pickup → dropoff on map
- [ ] Build Defect Report Form (was in web backup, needs porting)
- [ ] Build Post-Job Expense Modal (was in web backup, needs porting)
- [ ] Build Vehicle Issues / Fault Log section
- [ ] Build My Roster screen
- [ ] Build real in-app Messaging

### Backend / Infrastructure
- [ ] Connect all apps to production Firebase project
- [ ] Enable Firebase Cloud Functions for quote engine
- [ ] Set up production Docker deployment

---

## 🛡️ SAFETY & VERSION CONTROL NOTES
- **Legacy UI Deleted:** The old web prototypes (`driver-mobile-app-web-backup/` and `customer-mobile-app-web-backup2/`) and legacy mock images have been completely deleted from the workspace to enforce a clean React Native codebase.
- **Git Locked:** All finalized items, features, and native UI elements built up to this point have been safely committed and locked into the `main` branch via Git. If we ever need to revert or look at the web UI, it is permanently preserved in the Git history.
- All mocked API calls are wrapped in `/* MOCKED FOR UI TESTING */` comments so they are easy to find and re-enable
- This file (`VELO_PROJECT_LOG.md`) lives at the project root and must be updated whenever a new feature is built or a decision is made

============================================================
COMMAND: Backend Controllers Refactoring & Transaction Interceptor Sweep
Date: 2026-08-23
Prompt Text:
Refactor all backend controllers to enforce strict TypeScript typing, eliminate untyped 500 error fallbacks, standardize Express next(error) delegation, implement explicit BEGIN / COMMIT / ROLLBACK database transaction blocks, and introduce high-level PostgreSQL error interception (Code 57014) in app.ts.
Actions Taken:
- Standardized error routing with next(error) across clearing, fleet, payroll, onboarding, and analytics controllers.
- Re-engineered clearing.controller.ts and fleet.controller.ts to wrap mutations in explicit PostgreSQL pool client transactions with BEGIN/COMMIT/ROLLBACK.
- Implemented global error interceptor in src/app.ts for PostgreSQL timeouts (Error 57014 -> 503 Service Unavailable).
- Verified TypeScript compilation cleanly via `npx tsc --noEmit` (Exit Code 0).
============================================================
