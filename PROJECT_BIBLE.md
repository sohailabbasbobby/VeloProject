# 📖 VELO PROJECT BIBLE

> **Purpose**: This is the exhaustive, exact, and self-contained Master Specification Document for the Velo Executive Services platform. It supersedes all previous documentation and prototypes.

---

## 1. COMPLETE BUSINESS MODEL & FINANCIAL FRAMEWORK

Velo operates a zero-commission, multi-tenant marketplace for executive chauffeurs. 

### 1.1 Pay-as-you-go Model (Transactional)
When a driver fulfills a trip on the Velo network, the platform extracts a flat operational fee based *strictly* on the wholesale base fare of the trip:
- **Trips UNDER £7.00**: The platform extracts exactly **£0.50** from the fulfilling driver.
- **Trips £7.00 and ABOVE**: The platform extracts exactly **£1.00** from the fulfilling driver.

### 1.2 Subscription Model (Recurring)
Drivers can opt into a subscription model instead of pay-as-you-go:
- **Subscription Fee**: Exactly **£50.00 per week**, billed automatically via a cron-style worker.
- **Commission**: **0% commission** per trip.
- Drivers on the subscription model do *not* pay the £0.50 or £1.00 transactional platform fees.

### 1.3 VAT Policy (CRITICAL RULE)
- **VAT applies strictly and exclusively to drivers**, never to retail customers.
- Customer retail fares remain entirely free of direct VAT line-item extraction.
- The 20% standard UK VAT is calculated *only* on the platform fees (the £0.50, £1.00, or £50.00 charged to the driver), producing the Gross Platform Extraction.

### 1.4 Driver Pay Structures (Onboarding Models)
Drivers can be onboarded under three distinct remuneration frameworks by their Tenant fleet operators:
1. **Percentage Revenue Share (Commission)**: The driver keeps a percentage (e.g., 80%) of the net wholesale fare.
2. **Hourly + Trip Bonus (Salaried)**: The driver receives a fixed hourly rate plus a flat bonus per completed trip.
3. **Custom Framework**: A hybrid structure tailored to bespoke B2B tenant contracts.

---

## 2. ARCHITECTURE & ECOSYSTEM OVERVIEW

The Velo platform is divided into four primary technical pillars:

### 2.1 Backend Core
- **Stack**: Node.js, Express, TypeScript, PostgreSQL (via `pg`).
- **Functionality**: Serves as the central nervous system.
- **Components**:
  - `veloClearingEngine.ts`: Executes exact financial mathematics for B2B trades.
  - `subscription.worker.ts`: Background job processing weekly recurring subscriptions.
  - `controllers/`: Handles Fleet, Payroll, Analytics, and Escrow logic.

### 2.2 Tenant Back-Office ERP & Admin Dashboard
- **Stack**: React, Custom CSS (Velo charcoal & gold aesthetic).
- **Functionality**: The administrative hub for fleet operators to manage personnel, vehicles, clients, and dispatch.
- **UI Architecture**: Uses a universal modal architecture. All creation/editing flows open highly consistent, pre-filled forms.

### 2.3 Customer Mobile Application
- **Stack**: React Native (New Architecture enabled).
- **Functionality**: Secure booking engine, trip history, profile management, interactive map (`react-native-maps` via `PROVIDER_GOOGLE`).
- **Security**: Firebase Authentication secured, interacting with backend via JWT tokens in headers.

### 2.4 Driver Mobile Application
- **Stack**: React Native (New Architecture enabled).
- **Functionality**: Pre-shift gatekeepers (vehicle checks), custom swipe-to-confirm sliders, active ride routing, and live map navigation (`PROVIDER_GOOGLE`).

---

## 3. EXACT FEATURE SPECIFICATIONS

### 3.1 Entity Separations
The database schema and ERP UI rigorously separate distinct business entities. They must never be merged:
- **Drivers (Chauffeurs)**: Human operators. Tracked by compliance, licenses, and ratings.
- **Vehicles**: Physical assets. Tracked by registration plates, MOT, capacity, and lease costs.
- **Corporate Accounts**: B2B clients booking on behalf of staff (invoicing).
- **Private Clients**: High-net-worth individuals booking for themselves.

### 3.2 Pre-filling Onboarding Forms & Edit Flows
- **Strict Rule**: When a user clicks "Edit" on a profile (Chauffeur, Vehicle, or Client) or selects "Add New Staff" in the ERP, the system must trigger a standardized, robust form (e.g., `OnboardChauffeurModal`). 
- If editing an existing entity, this form must automatically pre-fill with live database data.
- It must save directly to the live backend state, ensuring data integrity.

### 3.3 Real-time Synchronization Rules
- **The Golden Rule**: Every decision, update, or feature must be implemented simultaneously across the backend, database schemas, and back-office UI.
- No static arrays or mocked data are permitted in production. 
- A change made in the Back-Office ERP (e.g., unassigning a driver) must immediately reflect in the backend database and subsequently propagate down to the Driver Mobile App.

### 3.4 Module Status Tracking
- **Backend Controllers & Transaction Integrity**: ✅ Complete
  - `src/controllers/clearing.controller.ts`
  - `src/controllers/fleet.controller.ts`
  - `src/controllers/payroll.controller.ts`
  - `src/controllers/onboarding.controller.ts`
  - `src/controllers/analytics.controller.ts`
  - `src/app.ts` (Global Error Interceptor)
- **Platform Health Check & Diagnostic Hub**: ✅ Complete
  - `backend-core/src/services/health.service.ts`
  - `backend-core/src/controllers/health.controller.ts`
  - `backend-core/src/routes/health.routes.ts`
  - `tenant-dashboard-erp/src/components/PlatformHealthWidget.jsx`
  - `tenant-dashboard-erp/src/components/PlatformHealthWidget.css`
- **Master Platform Hardening & Audit**: ✅ Complete
  - `backend-core/src/config/db.ts` (Pool Guardrails)
  - `backend-core/src/server.ts` (Graceful Shutdown)
  - `backend-core/src/app.ts` (Helmet, Request ID)
  - `tenant-dashboard-erp/src/components/ErrorBoundary.jsx`

### 3.5 Verification & Audits
- **2026-08-23**: Verified TypeScript compilation cleanly via `npx tsc --noEmit` inside `backend-core` (Exit Code 0).

---
*Generated by Velo Systems Architect.*
