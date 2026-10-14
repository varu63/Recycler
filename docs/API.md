# Material Mundi — API Contract

Base URL: `/api` (in development the Vite proxy forwards `/api` → `http://localhost:5000`).

## Conventions

- **Success:** `{ "success": true, "data": <payload>, "message": "..." }`
- **Error:** `{ "success": false, "message": "...", "code": "VALIDATION_ERROR", "errors": { "field": ["msg"] }? }`
- **Paginated payload:** `{ "items": [...], "meta": { "page", "limit", "total", "totalPages" } }`
- **Auth:** `Authorization: Bearer <accessToken>` header. The short-lived access token is returned in
  login/register/refresh responses and kept in memory. The refresh token is an HTTP-only cookie
  (`mm_refresh`) automatically sent to `/api/auth/refresh`.
- **Error codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
  `CONFLICT` (409), `RATE_LIMITED` (429), `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_SUSPENDED`,
  `INVALID_STATE_TRANSITION`, `INSUFFICIENT_INVENTORY`, `INTERNAL_ERROR` (500).
- All DTO field names are defined in `shared/src/types.ts`; enums in `shared/src/enums.ts`.
- Dates are ISO strings. IDs are strings (`id` field, not `_id`).

## Auth — `/api/auth`

| Method | Path                | Access | Body / Notes                                                       | Response `data`      |
| ------ | ------------------- | ------ | ------------------------------------------------------------------ | -------------------- |
| POST   | `/register`         | public | `{ name, email, phone, password, confirmPassword }`                | `{ user, accessToken }` |
| POST   | `/login`            | public | `{ email, password }` — sets refresh cookie                        | `{ user, accessToken }` |
| POST   | `/logout`           | any    | clears refresh cookie                                              | `null`               |
| POST   | `/refresh`          | cookie | reads `mm_refresh` cookie                                          | `{ user, accessToken }` |
| POST   | `/forgot-password`  | public | `{ email }` — always responds generically                          | `null`               |
| POST   | `/reset-password`   | public | `{ token, password, confirmPassword }`                             | `null`               |
| POST   | `/change-password`  | auth   | `{ currentPassword, password, confirmPassword }`                   | `null`               |
| GET    | `/me`               | auth   | —                                                                  | `UserDTO`            |
| PATCH  | `/me`               | auth   | `{ name?, phone? }`                                                | `UserDTO`            |

Rate limits: login 5/15min/IP, register 10/hour/IP, forgot-password 5/15min/IP.

## Uploads — `/api/uploads`

| Method | Path               | Access      | Notes                                                                 |
| ------ | ------------------ | ----------- | --------------------------------------------------------------------- |
| POST   | `/image`           | auth        | `multipart/form-data`, field `files` (max 6, 5MB each, jpg/jpeg/png/webp). `/images` is kept as an alias. |
| DELETE | `/image/:publicId` | owner/admin | Delete an uploaded image. URL-encode the `publicId` (`material-mundi/...`). |

Response `data`: `{ "images": ImageDTO[] }` — each image is `{ url, publicId, thumbnailUrl?, width?, height?, format?, bytes? }`, validated by magic bytes. Uploads go to the Cloudinary folder `material-mundi/` when
`IMAGE_STORAGE=cloudinary` (local disk when `local`); only URL/publicId/metadata are stored in MongoDB —
never binary data. Uploads are rate limited separately (`UPLOAD_RATE_LIMIT_MAX`). Only the uploader or an
admin may delete an image, and only asset ids inside the managed folder are accepted.

## Material requests — `/api/material-requests`

| Method | Path                          | Access      | Notes                                                                 |
| ------ | ----------------------------- | ----------- | --------------------------------------------------------------------- |
| GET    | `/`                           | auth        | Customer: own requests. Admin: all requests. Query: `status,page,limit,sort,q`. Returns paginated `MaterialRequestDTO`. |
| POST   | `/`                           | customer    | `CreateMaterialRequestInput` → `MaterialRequestDTO` (status `SUBMITTED`). |
| GET    | `/:id`                        | owner/admin | `MaterialRequestDTO` (admin gets populated `user`).                   |
| POST   | `/:id/review`                 | admin       | `SUBMITTED → UNDER_REVIEW`.                                           |
| POST   | `/:id/schedule-inspection`    | admin       | `{ scheduledAt }` → status `INSPECTION`, notifies user.               |
| POST   | `/:id/inspection`             | admin       | `CreateInspectionInput` → `InspectionDTO`.                           |
| POST   | `/:id/offer`                  | admin       | `CreateOfferInput`; server computes `totalPurchasePrice = verifiedWeight × pricePerKg`. Status → `OFFER_MADE`. |
| POST   | `/:id/accept-offer`           | owner       | Offer `PENDING → ACCEPTED`, request → `ACCEPTED`.                     |
| POST   | `/:id/reject-offer`           | owner       | Offer → `REJECTED`, request → `UNDER_REVIEW`.                         |
| POST   | `/:id/purchase`               | admin       | Requires accepted offer. Creates raw inventory, request → `PURCHASED`. |
| POST   | `/:id/complete`               | admin       | `PURCHASED → COMPLETED`.                                              |
| POST   | `/:id/reject`                 | admin       | `{ reason }` → `REJECTED` (only from `SUBMITTED/UNDER_REVIEW/INSPECTION/OFFER_MADE`). |

## Offers / inspections — `/api/offers`, `/api/inspections`

- `GET /api/offers` — customer: own offers; admin: all. Query: `status,page,limit`.
- `GET /api/inspections` — admin only. Query: `page,limit`.

## Raw inventory — `/api/raw-inventory` (admin only)

- `GET /?status=&material=&page=&limit=` → paginated `RawInventoryDTO`.
- `PATCH /:id` → whitelist: `{ status?, storageLocation?, currentWeight? }`.

## Processing — `/api/processing` (admin only)

- `GET /?status=&page=&limit=` → paginated `ProcessingBatchDTO`.
- `POST /` → `{ rawInventory, processingType, inputWeight, notes? }`; batch `PENDING`, raw inventory → `PROCESSING`.
- `PATCH /:id` → `{ stage?, notes?, status? }` (`PENDING → IN_PROGRESS` starts it).
- `POST /:id/complete` → `{ outputWeight, qualityGrade, notes? }`. Server computes
  `lossWeight = inputWeight - outputWeight`, `recoveryPercentage = outputWeight / inputWeight × 100`,
  creates a `ProcessedMaterial`, marks batch `COMPLETED`, raw inventory → `PROCESSED`.

## Processed inventory — `/api/processed-inventory` (admin only)

- `GET /?status=&page=&limit=` → paginated `ProcessedMaterialDTO`.

## Marketplace — `/api/marketplace`

- `GET /` (public) — only `PUBLISHED` listings. Query: `q, material, grade, minPrice, maxPrice, inStock,
  sort (newest|price_asc|price_desc|name), page, limit` → paginated `MarketplaceListingDTO`.
- `GET /:id` (public) — `PUBLISHED` listing or 404.
- `POST /` (admin) — `CreateListingInput`. `availableQuantity` is copied from the linked processed
  material (server caps it at available stock). Status starts `DRAFT` unless `publish: true`.
- `PATCH /:id` (admin) — whitelist of listing fields + `status`. Publishing validates sufficient
  processed inventory. Transitions: `DRAFT ⇄ PUBLISHED ⇄ PAUSED`, `→ SOLD_OUT`, `→ ARCHIVED`.

## Orders — `/api/orders`

- `POST /` (customer) — `{ listingId, quantity, shippingAddress, customerNote? }`.
  Server validates quantity ≥ minOrderQuantity, atomic stock reservation (no overselling,
  no price manipulation — price is read from the listing), computes totals.
  Response: `OrderDTO` (status `PENDING`).
- `GET /` — customer: own orders; admin (role `admin`): all orders with `?status=&page=&limit=`.
- `GET /:id` — owner or admin.
- `PATCH /:id/status` (admin) — `{ status, cancelReason?, paymentStatus? }`. Legal transitions:
  `PENDING → CONFIRMED|CANCELLED`, `CONFIRMED → PROCESSING|CANCELLED`,
  `PROCESSING → READY_FOR_DISPATCH|CANCELLED`, `READY_FOR_DISPATCH → DISPATCHED|CANCELLED`,
  `DISPATCHED → DELIVERED`. Cancellation releases reserved inventory.
- `POST /:id/cancel` (owner) — only while `PENDING`; releases inventory.

## Notifications — `/api/notifications` (auth)

- `GET /?page=&limit=&unread=true` → paginated `NotificationDTO` (own only).
- `GET /unread-count` → `{ count }`.
- `POST /:id/read`, `POST /read-all`.

## Admin — `/api/admin` (role `admin` only)

- `GET /dashboard` → `{ stats: DashboardStats, charts: DashboardChartData }`.
- `GET /users?role=&status=&q=&page=&limit=` → paginated `UserDTO`.
- `PATCH /users/:id/status` → `{ status }` (`active|suspended`).
- `GET /audit-logs?entity=&action=&page=&limit=` → paginated `AuditLogDTO` (immutable).
- `GET /reports` → `ReportSummary` (+ 12-month revenue series).
- `GET /settings` → non-secret runtime configuration summary.

## Frontend service modules (`client/src/services/`)

| File                 | Covers                                                        |
| -------------------- | ------------------------------------------------------------- |
| `auth.service.ts`    | register, login, logout, refresh, me, updateProfile, password |
| `upload.service.ts`  | multipart image upload                                        |
| `requests.service.ts`| material requests, inspections, offers                        |
| `inventory.service.ts` | raw inventory, processing, processed inventory              |
| `marketplace.service.ts` | public marketplace + admin listings                       |
| `orders.service.ts`  | orders                                                        |
| `admin.service.ts`   | dashboard, users, audit logs, reports, settings               |
| `notifications.service.ts` | notifications                                            |
