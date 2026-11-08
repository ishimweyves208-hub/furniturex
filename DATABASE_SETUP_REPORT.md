# FurnitureX Database Setup Report

Date: 2026-11-07
Database: MongoDB Atlas
Logical database: `furniturex`
Selected production target: Node.js hosting

## Configuration

The application reads database configuration from `.env.local`:

```text
MONGODB_URI=<Atlas SRV connection string>
MONGODB_DB=furniturex
```

Operational notes:

- The connection string is stored only in `.env.local`.
- `.env.local` permissions are `600`.
- The secret was never printed or committed.
- `.env.local`, `.env*.local`, and `.dev.vars` are gitignored.
- `.dev.vars` was temporarily used for Wrangler testing and has been restored to `NEXTJS_ENV=development`.

## Connectivity Verification

Verified against the real Atlas cluster:

- Connection established successfully.
- Host resolved to the Atlas shard.
- `ping` returned OK.
- Insert, read, update, and delete operations succeeded.
- Database name confirmed as `furniturex`.
- Indexes were created on all model collections.

Schema rules verified:

- `users.email` is unique.
- `users.shopSlug` is unique and sparse.
- `sessions` stores only a token hash and indexes `tokenHash` and `expiresAt`.
- `orders.orderNumber` is unique.
- `orders` has a unique customer/idempotency/seller compound index.
- `products.slug` is unique.
- Product, order, notification, audit, analytics, and moderation indexes are present.

## End-to-End Validation

### Seller Registration

Real seller registration against Atlas passed:

- Registration returned `201`.
- Role was `seller`.
- Seller status was `active`.
- Shop slug was generated.
- Session cookie was set.
- `/api/auth/me` resolved the new user.
- `/seller` returned `200` when authenticated.
- `/seller` redirected to `/login?next=%2Fseller` when anonymous.
- Duplicate registration returned `409`.
- Public registration with `superadmin` role returned `422`.
- Password was stored as a bcrypt hash.
- Session was stored as a token hash, not the raw token.
- Welcome notification was persisted.
- Logout and session revocation worked.

### Full Marketplace Flow

The complete customer, seller, and admin flow passed:

1. Seller and superadmin login.
2. Buyer registration.
3. Seller-to-admin and buyer-to-seller API access rejected with `403`.
4. Admin settings updated and restored.
5. Category created and publicly visible.
6. Seller product created as `pending`.
7. Admin approved the product.
8. Product appeared publicly, in search, and on the seller shop page.
9. Price and stock updated without triggering re-approval.
10. Material change triggered re-approval, then was approved again.
11. Like and comment persisted.
12. Cart add succeeded.
13. COD checkout succeeded.
14. Checkout retry returned the existing order.
15. Buyer and seller could both see the order.
16. Order transitioned `confirmed -> processing -> shipped -> delivered`.
17. COD payment marked `paid`.
18. Delivered review created.
19. Product sales and stock counters updated.
20. Seller and admin analytics, orders, users, and reports loaded.
21. Account profile update succeeded.
22. R2 upload endpoint returned `503` as expected without R2 credentials.

Checkout evidence:

- Group number: `FX-20261107-B685E9`
- Subtotal: `31900`
- Delivery fee: `1234`
- Total: `33134`
- Idempotent retry returned the same order.

## Data Cleanup

After verification:

- All test users, sessions, categories, products, product events, orders, reviews, comments, likes, carts, notifications, and audit logs were deleted.
- Cleanup was guarded: it only proceeded because every user in the database was a `@furniturex.test` account.
- Indexes were preserved.
- A subsequent production build recreated one default `platformsettings` document.
- Final counts are zero for all test data collections.

## Cloudflare Workers Compatibility

### Results

- `npx opennextjs-cloudflare build` succeeds.
- The Worker starts under `wrangler dev`.
- The homepage returns `200`.
- The first database request succeeds.
- Subsequent database requests fail with:

```text
The Workers runtime canceled this request because it detected that your Worker's code had hung and would never generate a response.
```

### Diagnosis

A direct Worker probe was run with Mongoose against Atlas:

- First request with `mongodb.connect()` + query + `mongoose.disconnect()` returned `200`.
- A request that left the connection open returned `200`, but the next request failed with the same hang error.
- Restarting the Worker made the next database request succeed again.
- With `mongoose.disconnect()` on every request, requests continued to succeed.

Conclusion: the Workers runtime does not permit reusing the cached Mongoose connection/I/O objects across requests. The global connection cache in `src/lib/db/connect.ts` is the cause.

### Current Recommendation

The current code should be deployed on a Node.js runtime where global Mongoose pooling is valid.

If Cloudflare Workers is required:

1. Put all database access behind a Durable Object that owns the MongoDB connection, or
2. Refactor the data layer to use isolated per-request connections/models with a guaranteed disconnect, or
3. Use the native MongoDB driver with a per-request `MongoClient` and disconnect after each request.

The third option still requires refactoring the model/service layer because the current code uses the default Mongoose connection and globally registered models.

## Verification Commands

```text
npm run typecheck                 PASS
npm run lint                      PASS
npm test                          PASS (25 tests)
npm run build                     PASS
npx opennextjs-cloudflare build   PASS
```

## Remaining Setup

### R2 image storage

Required variables:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_BUCKET_NAME
CLOUDFLARE_R2_ENDPOINT
NEXT_PUBLIC_CLOUDFLARE_IMAGE_DOMAIN
```

Without these, upload signing returns `503`.

### Transactional email

Required variables:

```text
RESEND_API_KEY
EMAIL_FROM
```

Without these, verification and password-reset email cannot be delivered.

## Security Notes

- Do not commit Atlas credentials.
- Do not expose `MONGODB_URI` in client bundles or logs.
- Keep `.env.local` and `.dev.vars` private.
- Rotate the Atlas database password if it has ever been shared outside the secure environment.
