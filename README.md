# AgriLink — Smart Agriculture Subsidy Platform

A polished, interactive **frontend-only** prototype of a Smart Agriculture
Subsidy Application for Sri Lanka, built for demonstration to ICTA, GovTech, and
agriculture-sector stakeholders.

AgriLink lets **farmers** apply for agricultural subsidies, **government officers**
verify applications and record decisions, and **administrators** configure demo
schemes and monitor GovTech integrations. It integrates with the Sri Lanka
GovTech Developer Infrastructure Services (DIS) sandbox where browser-safe, and
uses clearly-labelled mock adapters everywhere else.

> **This is a demonstration environment with fictional data. It is not a live
> government service.** Creating an application here does not register it with any
> government department. The role switcher is a UI convenience and is not real
> authentication or authorization.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** for layout and design tokens
- **Ant Design v6** for functional UI components
- **Recharts** for data visualization, **Lucide** icons, **dayjs** for dates
- **Vitest** for unit tests

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure GovTech sandbox integrations
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
# then edit .env.local — see docs/govtech-sandbox-integrations.md

# 3. Run the dev server
npm run dev          # http://localhost:3000

# 4. Quality gates
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run build        # Production build
```

The app works fully **without any sandbox credentials** — all unavailable
integrations fall back to clearly-labelled mock adapters.

## Demo walkthrough

1. Open `/` and click **Enter the demo** (or **Sign in**).
2. Choose a role: **Farmer**, **Officer**, or **Administrator**. Use the top-bar
   **role switcher** to move between portals at any time.
3. **Farmer:** browse schemes → **Apply for Subsidy** → complete the 5-step wizard
   → submit → track the application timeline.
4. **Officer:** open the dashboard → **Applications** → review an application →
   approve/reject/request correction → **Payments** to disburse (mock or sandbox).
5. **Admin:** configure demo **Schemes**, inspect **Integrations** status, and view
   the **Audit Log**.
6. Use **Reset demo data** (sidebar) to restore the deterministic seed at any time.

## Project structure

```
app/                     # Next.js routes (farmer / officer / admin + public)
components/
  common/                # Shared UI (PageHeader, StatCard, SourceTag, Charts, …)
  layout/                # App shell, navigation
  landing/ auth/         # Landing page, login, SLUDI callback
  farmer/ officer/ admin/# Feature components per portal
lib/
  govtech/               # Typed sandbox adapters (sludi, ndx, subsidy, cultivation,
                         #   farmer-registry, payment-gateway) + config + mock data
  domain/                # Local prototype model (applications, schemes, workflow)
  eligibility/           # Configurable local eligibility engine
  storage/               # Safe localStorage repository + deterministic seed
  state/                 # React context store + selectors
  i18n/ utils/           # Translations (en/si/ta scaffold), formatting, CSV
tests/                   # Vitest unit tests (eligibility, workflow, adapters, payments)
docs/                    # govtech-sandbox-integrations.md (integration reference)
```

## Data sourcing — honesty by design

Every displayed value is labelled by its source:

- **Sandbox API** — live data from a GovTech sandbox API.
- **Simulated** — demonstration data (the real API is backend-only or unavailable).
- **Local record** — stored locally in this prototype.

A payment is only marked **Paid** when a success status is explicitly returned.
The app never silently switches from a failed real API call to mock data.

## GovTech sandbox integrations

Discovered via the connected `dis` MCP server and documented in full in
[`docs/govtech-sandbox-integrations.md`](docs/govtech-sandbox-integrations.md):

| Service | Prototype mode |
| --- | --- |
| SLUDI (eSignet OIDC) | Real discovery + authorize redirect; token exchange is backend-only → demo login |
| National Data Exchange (NDX) | Mock adapter (authorized-consumer token, backend-only) |
| Subsidy Benefit Services | Mock adapter (bearer consumer, backend-only) |
| Farmer Registration / Cultivation / Payment info | Mock adapter (bearer consumer, backend-only) |
| Payment Gateway (IPG Simulator) | Real-capable (`X-DIS-CLIENT-ID`) + mock fallback |

### Environment variables

See `.env.example`. All variables are `NEXT_PUBLIC_*` (browser-exposed) and
**non-secret**. Confidential credentials (SLUDI RSA private key, authorized-consumer
bearer tokens) are intentionally never used in this frontend-only prototype.

## Known limitations

- Real SLUDI login cannot complete in a browser-only app (token exchange needs a
  confidential RSA key + encrypted-JWT handling, which are backend-only).
- Data/verification APIs require a confidential consumer token and therefore run in
  mock mode. A server component would be required for live calls — out of scope.
- Local demo state (localStorage) is not a source of truth for real approvals or
  financial transactions, and the audit log is not tamper-proof.
- Uploaded evidence files are kept in memory for preview only and may not persist
  across a page refresh.
