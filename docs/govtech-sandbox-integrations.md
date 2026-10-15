# GovTech Sandbox Integration Reference — AgriLink

This document is the **source of truth** for how the AgriLink prototype integrates
with the Sri Lanka GovTech Developer Infrastructure Services (DIS) sandbox. Every
contract below was discovered through the connected **`dis` MCP server**
(`https://mcp.staging.devportal.gov.lk/mcp`) and the official OpenAPI documents it
exposes. No endpoint, payload, or field in this document was invented.

> **Prototype boundary.** AgriLink is a **frontend-only** Next.js prototype. It has
> no custom backend, no database server, and no newly created server API. Where a
> documented sandbox operation cannot safely run in a browser (confidential client
> secret, server-side token exchange, encrypted JWT handling), the UI uses an
> explicit, clearly-labelled **mock adapter** and this document records the exact
> limitation. The app never fabricates a successful real API result.

Common base URL for the data/verification/payment APIs:
`https://api.staging.devportal.gov.lk`

Authentication for most data APIs is `BearerAuth` (JWT) "issued for authorized
pre-defined consumers". Obtaining that consumer token requires a confidential
server-side credential exchange, so **these calls cannot be made directly and
safely from the browser**. See each service for the resulting prototype approach.

---

## 1. SLUDI — Sri Lanka Unique Digital Identity (eSignet OIDC)

- **Official service name:** SLUDI OpenID Provider (eSignet) — Relying Party API
- **Catalogue:** API id 2, version v1.0.0, category IDENTITY
- **Base URL:** `https://api.staging.devportal.gov.lk/sludi`
- **Login UI origin (sandbox):** `https://esignet.dev.digieconcenter.gov.lk`

### Supported operations

| Operation | Method | Path | Where it runs |
| --- | --- | --- | --- |
| OpenID Provider configuration | GET | `/.well-known/openid-configuration` | Browser or backend |
| Authorization (browser redirect) | GET | `/authorize` | **Browser redirect only** |
| Token (code → tokens) | POST | `/oauth/v2/token` | **Backend only** |
| UserInfo (consented claims) | GET | `/oidc/userinfo` | **Backend only** |

### Flow (documented)

1. Build an `/authorize` URL with `response_type=code`, `scope` (must include
   `openid`), `client_id`, `redirect_uri` (must exactly match a registered URI),
   `state` (CSRF), `nonce` (replay), and `acr_values`.
   Sandbox OTP ACR: `mosip:idp:acr:static-code` (fixed OTP `111111` in mock data).
2. eSignet shows the SLUDI login UI, authenticates, collects consent, then
   redirects back to `redirect_uri?code=...&state=...`.
3. The code is exchanged at `/oauth/v2/token` using **`private_key_jwt`** client
   authentication: a JWT signed with the client's registered **RSA private key**
   sent as `client_assertion`. Returns `id_token`, `access_token`.
4. `/oidc/userinfo` returns consented claims as a **nested JWT (JWS then JWE
   encrypted to the client's public key)** — must be decrypted and verified.

### Required environment variables

```
NEXT_PUBLIC_SLUDI_AUTHORIZE_URL   # eSignet /authorize origin (public, browser)
NEXT_PUBLIC_SLUDI_CLIENT_ID       # OIDC client id (public identifier)
NEXT_PUBLIC_SLUDI_REDIRECT_URI    # registered callback, e.g. http://localhost:3000/auth/callback
NEXT_PUBLIC_SLUDI_SCOPE           # e.g. "openid profile email"
NEXT_PUBLIC_SLUDI_ACR_VALUES      # e.g. "mosip:idp:acr:static-code"
```

The RSA **private key is never placed in any `NEXT_PUBLIC_*` variable** and never
ships to the browser.

### Integration approach (REAL login implemented)

Real end-to-end SLUDI login is implemented using a minimal **server-side route
handler** so the private key never reaches the browser:

- **In the browser** (`lib/govtech/sludi.ts`): `fetchOpenIdConfiguration()`,
  `buildAuthorizeUrl()` (with CSRF `state` + `nonce` stored in `sessionStorage`),
  and the `/auth/callback` page which reads `code`/`state` and POSTs the `code` to
  the server route.
- **On the server** (`app/api/auth/sludi/callback/route.ts` +
  `lib/govtech/sludi-server.ts`, `import "server-only"`, Node runtime):
  1. Signs the `private_key_jwt` client assertion with the RSA key from
     `SLUDI_CLIENT_PRIVATE_KEY` (server-only env; `importPKCS8` + `jose`).
  2. Exchanges the code at the token endpoint.
  3. Retrieves UserInfo — handles both a signed JWT (JWS/PS256, verified against the
     IdP JWKS) and a nested encrypted JWT (JWE decrypted with the private key).
  4. Returns **only non-sensitive claims** (`name`, `email`, `phone_number`,
     `nic`, `sub`, …) to the browser. Tokens and the private key never leave the
     server; errors never echo token/key material.

The eSignet endpoints (resolved from live discovery):
`token = /v1/esignet/oauth/v2/token`, `userinfo = /v1/esignet/oidc/userinfo`,
`jwks = /.well-known/jwks.json`. Sandbox OTP for the static-code ACR is `111111`.

Toggle real login with `NEXT_PUBLIC_SLUDI_LOGIN_ENABLED=true` plus the server
secrets. When disabled, the UI falls back to the clearly-labelled demo login and
never claims a real authentication occurred.

### Why a server route in a "frontend-only" prototype

A browser-only app cannot safely hold the RSA private key or decrypt the UserInfo
JWE. The route handler is a thin **backend-for-frontend** used solely for the
SLUDI secret-bearing exchange — there is still no custom business backend or
database. All application/business logic remains client-side.

### Sandbox limitations

- The redirect URI must be registered on the OIDC client (done:
  `http://localhost:3000/auth/callback`). For other hosts, register their callback.
- UserInfo signature verification falls back to decoding claims if the JWKS cannot
  verify the token; such claims are surfaced but their provenance is noted.

### Error & loading states

- Discovery/authorize failures surface as a non-blocking warning on the login page
  and the Admin → Integrations panel; the demo login remains available.

---

## 2. NDX — National Data Exchange

- **Official service name:** National Data Exchange (NDX API)
- **Catalogue:** API id 4, version v1.0.0, category NATIONAL_DATA_EXCHANGE
- **Base URL:** `https://api.staging.devportal.gov.lk/national-data-exchange`

### Supported operations

| Operation | Method | Path |
| --- | --- | --- |
| Retrieve citizen data by NIC | GET | `/citizen-data/{idCardNumber}?fields=a,b,c` |
| Query citizen data by NIC (body) | POST | `/citizen-data` |

Looks up **citizen, company, land parcel, or vehicle** registry fields by NIC. The
caller lists only the field names it needs (e.g. `surname`, `deed`, `extent`,
`landType`, `cultivatedCrop`, `ownershipType`, `gpsCoordinates`); NDX resolves which
registry each field belongs to.

### Response model (status-driven)

- `status: "ok"` → `data` has every requested field.
- `status: "partial"` → some `data` returned + `consentId` + `consentPortalUrl`
  for the rest.
- `status: "consent_required"` → no data; `consentId` + `consentPortalUrl`. The
  citizen approves once at the portal; repeating the identical request then returns
  the data. Approvals stay valid for a window.
- Errors: `bad_request` (unknown/ambiguous field — e.g. use `civilAddressLine1` not
  `addressLine1`), `unauthorized`, `denied` (403), `not_found`, `conflict`,
  `unprocessable_entity`, `error`.

### Required environment variables

```
NEXT_PUBLIC_NDX_BASE_URL   # https://api.staging.devportal.gov.lk/national-data-exchange
# Consumer authorization token is confidential and server-side only — not shipped to browser.
```

### Frontend integration approach

- NDX sits behind the DIS gateway and expects an authorized consumer identity. That
  authorization is not a browser-safe credential, so AgriLink does not call NDX
  directly from the browser in this prototype.
- `lib/govtech/ndx.ts` encodes the **exact request/response types** and a typed
  `lookupCitizenData()` signature so the integration is ready, plus a **mock
  adapter** returning deterministic land/cultivation data for demo NICs. The UI
  tags every NDX-derived field as `sandbox` or `mock` and surfaces the
  consent-required flow visually (consent portal URL) when exercised against the
  real service.

### Sandbox limitations

- Consent-gated fields require an interactive citizen approval at
  `consentPortalUrl`. No live Sri Lankan land/farmer records are assumed.

---

## 3. Subsidy Benefit Services — Department of Agrarian Development

- **Catalogue:** API id 11, version v1.0.0, category CITIZEN_SERVICES
- **Base URL:** `https://api.staging.devportal.gov.lk/subsidy-benefit-services-v1-0-0`
- **Auth:** `BearerAuth` (JWT, authorized consumer) — backend-only.

| Operation | Method | Path | Key response fields |
| --- | --- | --- | --- |
| Get Farmer Subsidy Eligibility | GET | `/api/v1/farmers/{farmerId}/subsidy-eligibility?subsidyType=&cultivationSeason=` | `farmerId, eligible, subsidyType, cultivationSeason, reason` |
| Get Farmer Benefit History | GET | `/api/v1/farmers/{farmerId}/benefits?benefitType=&fromDate=&toDate=` | `farmerId, benefits[]{benefitType,year,amount,paymentDate}` |

- **Frontend approach:** typed in `lib/govtech/subsidy.ts`. Bearer consumer token is
  confidential, so the browser prototype uses a deterministic **mock adapter** for
  eligibility and benefit history, clearly labelled. The eligibility engine
  (`lib/eligibility`) keeps its agriculture-specific rules separate from this API's
  single yes/no result.

---

## 4. Farmer Registration Management

- **Catalogue:** API id 7, v1.0.0, IDENTITY. **Auth:** BearerAuth (backend-only).
- **Base URL:** `https://api.staging.devportal.gov.lk/farmer-registration-management`

| Operation | Method | Path |
| --- | --- | --- |
| Verify Farmer by NIC | GET | `/api/v1/farmers/verify/{nic}` → `{nic, farmerId?, isRegisteredFarmer, farmerStatus?}` |
| Get Farmer Profile | GET | `/api/v1/farmers/{farmerId}` |
| Update Farmer Profile | PUT | `/api/v1/farmers/{farmerId}` |
| Search Farmer | GET | `/api/v1/farmers/search?nic=&farmerId=&name=&district=&dsDivision=` |
| Register Farmer | POST | `/api/v1/farmers` |

- **Frontend approach:** typed in `lib/govtech/farmer-registry.ts` with a mock
  adapter (confidential bearer token). Used for the "registered farmer" status in
  the profile and officer verification checks.

---

## 5. Farmland Cultivation Verification

- **Catalogue:** API id 8, v1.0.0, VERIFICATION. **Auth:** BearerAuth (backend-only).
- **Base URL:** `https://api.staging.devportal.gov.lk/farmland-cultivation-verification-v1-0-0`

| Operation | Method | Path |
| --- | --- | --- |
| Get Farmer Land Details | GET | `/api/v1/farmers/{farmerId}/lands` → `lands[]{landId,landType,extent,unit,cropType,location,district}` |
| Verify Active Cultivation | GET | `/api/v1/farmers/{farmerId}/cultivation-status?cultivationSeason=` → `{farmerId,season,isCultivating,crop}` |

- **Frontend approach:** typed in `lib/govtech/cultivation.ts` + mock adapter.
  Feeds the land/cultivation step of the wizard and the officer review workspace.

---

## 6. Farmer Payment Information

- **Catalogue:** API id 6, v1.0.0, PAYMENT. **Auth:** BearerAuth (backend-only).
- **Base URL:** `https://api.staging.devportal.gov.lk/farmer-payment-information`

| Operation | Method | Path |
| --- | --- | --- |
| Verify Farmer Bank Details | GET | `/api/v1/farmers/{farmerId}/payment-details` → `{farmerId,bankName,accountNumber(masked),accountStatus}` |

- **Frontend approach:** typed in `lib/govtech/farmer-registry.ts` + mock adapter.
  Used to show the masked disbursement account before payment.

---

## 7. Payment Gateway — IPG Simulator (G2P disbursement simulation)

- **Catalogue:** API id 77 (Payment Gateway), v1.0.0, PAYMENT.
- **Host:** `https://ipg.dis.int.govtech.lk`
- **Auth:** API key header **`X-DIS-CLIENT-ID`** (isolates sandbox data per client).
  This is **not** a confidential secret — it is a client-scoping identifier — so
  this API is **browser-callable** in the prototype (subject to CORS).

| Operation | Method | Path |
| --- | --- | --- |
| Initiate a sandbox payment | POST | `/api/sandbox/initiate` |
| List / create / update / delete merchants | GET/POST/PUT/DELETE | `/playground-action/merchants[/{merchantId}]` |
| List / get transactions | GET | `/playground-action/transactions[/{transactionId}]` |
| Change transaction status | POST | `/playground-action/change-transaction-status` |

- `initiate` requires an existing `merchant_id` for the client, `amount` (positive
  number), `currency` (3 letters, e.g. `LKR`), `notify_url`, `return_url`, and
  `metadata{first_name,last_name,email}`. Returns `{transaction_id, redirect_url}`
  (a checkout UI URL on the same host). The checkout UI then sets status to
  `SUCCESS/FAILED/CANCELED/PENDING`.
- **Frontend approach:** typed in `lib/govtech/payment-gateway.ts`. Officer Payments
  can attempt a **real sandbox initiate** when `NEXT_PUBLIC_PAYMENT_GATEWAY_ENABLED`
  is set, otherwise a labelled **mock disbursement** is used. Duplicate-click
  protection prevents repeated initiate calls; on timeout/ambiguous outcome the app
  checks `GET /transactions/{id}` rather than blindly retrying. A payment is only
  marked **Paid** when a `SUCCESS`/`COMPLETED` status is explicitly returned.

### Required environment variables

```
NEXT_PUBLIC_PAYMENT_GATEWAY_BASE_URL   # https://ipg.dis.int.govtech.lk
NEXT_PUBLIC_PAYMENT_GATEWAY_CLIENT_ID  # X-DIS-CLIENT-ID (data isolation id, not a secret)
NEXT_PUBLIC_PAYMENT_GATEWAY_MERCHANT_ID
NEXT_PUBLIC_PAYMENT_GATEWAY_ENABLED    # "true" to attempt real sandbox calls
```

---

## 8. Capabilities summary (real vs simulated in this prototype)

| Capability | Real contract documented | Callable from browser-only prototype | Prototype mode |
| --- | --- | --- | --- |
| SLUDI discovery + authorize redirect | Yes | Yes | Real |
| SLUDI token exchange + userinfo | Yes | Via server route (private key stays server-side) | **Real** (when `NEXT_PUBLIC_SLUDI_LOGIN_ENABLED=true`) |
| NDX citizen/land lookup | Yes | No (authorized consumer token) | Mock adapter |
| Subsidy eligibility / benefit history | Yes | No (bearer consumer token) | Mock adapter |
| Farmer registration / profile / search | Yes | No (bearer consumer token) | Mock adapter |
| Farmland + cultivation verification | Yes | No (bearer consumer token) | Mock adapter |
| Farmer bank details | Yes | No (bearer consumer token) | Mock adapter |
| Payment Gateway (IPG simulator) | Yes | Yes (`X-DIS-CLIENT-ID`, subject to CORS) | Real-capable + mock fallback |

### Items requiring manual configuration before any real call

- A DIS **Application** must be created and subscribed to the relevant APIs, with an
  **SLUDI OIDC client** registered (redirect URI `http://localhost:3000/auth/callback`).
  At discovery time, `list_my_applications` returned **no applications**, so all
  data APIs run in mock mode until an application + credentials are provisioned.
- For the data/verification APIs, a server-side component holding the confidential
  consumer credential would be required to make real calls — intentionally out of
  scope for this frontend-only prototype.

_Discovered via the `dis` MCP on 2026-10-14 against the staging catalogue._
