# FurnitureX Project Status

Last updated: 2026-11-07

## Summary

FurnitureX is implemented end-to-end against a real MongoDB Atlas database. The public marketplace, authentication, seller dashboard, admin dashboard, cart, checkout, order lifecycle, reviews, notifications, analytics, and moderation flows have all been exercised with real reads and writes.

The remaining deployment-specific issue is Cloudflare Workers database access: the current global Mongoose connection cache is not safe across Worker invocations. The selected production target is Node.js hosting, where the current connection pooling is valid and the application is ready to deploy.

**Local Image Storage**: Cloudflare R2 has been replaced with local file storage in `public/uploads/`. Images are stored permanently on the server filesystem and deleted when products are removed.

## Design System Redesign (2026-11-07)

**Complete visual redesign implemented:**
- **Colors**: Clean white background (#FFFFFF), blue primary (#347DF2), black text (#111111), gray secondary (#666666), light borders (#E5E7EB)
- **Typography**: Inter font family (replaced Playfair Display + Manrope)
- **Components**: All UI components updated (Button, Badge, Input, Alert, EmptyState, StatCard, SectionHeading, Price)
- **Layout**: Simplified SiteHeader with clean navigation, compact SiteFooter, redesigned MobileMenu, CategoryMenu, UserMenu, SignOutButton
- **Pages**: Homepage restructured with simple intro, value props, categories, featured products, new arrivals, popular, sellers, CTA section
- **Dashboard**: Seller and Admin dashboards updated with clean card-based layouts

## Verified Environment

- Framework: Next.js 15 App Router, React 19, TypeScript strict mode
- Database: MongoDB Atlas, database `furniturex`
- ODM: Mongoose 9.12
- Deployment tooling: OpenNext Cloudflare 1.20.16, Wrangler 4.158.0
- Atlas connectivity: verified with ping and CRUD operations
- Local secrets: `.env.local` is populated and has permissions `600`; secrets are not committed

See `DATABASE_SETUP_REPORT.md` for the full Atlas verification report.

## Working Features

### Backend & Database
- 17 Mongoose models with indexes
- Real Atlas connection and pooling on Node.js
- User, product, category, order, cart, wishlist, like, comment, review, session, address, audit log, notification, platform setting, product view, product event, and report models
- Default platform settings are created on first read

### Authentication & Authorization
- Session-based auth with HTTP-only cookies
- Hashed session tokens stored in Atlas
- Bcrypt password hashing
- Roles: customer, seller, superadmin
- Role isolation verified: seller cannot access admin APIs and customer cannot access seller APIs
- Seller registration generates a shop slug and activates the seller account
- Signup cannot self-assign the superadmin role
- Email verification and password reset code paths exist; delivery requires Resend configuration

### Marketplace
- Homepage, marketplace, category, search, product detail, seller directory, and seller storefront
- Product approval workflow with pending/approved/rejected states
- Material changes trigger re-approval
- Price and stock updates do not require re-approval
- Likes, comments, reviews, view tracking, and wishlists
- Search by product and seller information

### Commerce
- Cart add/update/remove
- Cash-on-delivery checkout
- Configurable delivery fee
- Checkout idempotency
- Order grouping across sellers
- Order transitions: confirmed, processing, shipped, delivered
- COD marked paid on delivery
- Delivered-order reviews update sales and stock counters

### Seller Dashboard
- Product list, create, and edit
- Order list and detail
- Analytics
- Shop profile
- **Local image upload to `public/uploads/` with automatic cleanup on product deletion**

### Admin Dashboard
- Product approval and moderation
- Users, orders, categories, reports, settings, and audit log
- Analytics
- Category creation and visibility
- Platform settings update and restore

## Verification Results

All checks completed on 2026-11-07:

```text
npm run typecheck   PASS
npm run lint        PASS
npm test            PASS (4 files, 25 tests)
npm run build       PASS
npx opennextjs-cloudflare build   PASS
```

Real Atlas end-to-end run passed:

- Seller registration, login, session lookup, logout, and session revocation
- Duplicate registration rejected with `409`
- Public superadmin registration rejected with `422`
- Buyer registration and login
- Seller and admin role isolation
- Admin settings update and restore
- Category creation and public visibility
- Product creation, approval, public listing, search, and seller shop page
- Price/stock update without re-approval
- Material change re-approval
- Like, comment, cart, COD checkout, and checkout idempotency
- Buyer and seller order visibility
- Confirmed to processing to shipped to delivered transitions
- Review submission and sales/stock counter updates
- Seller and admin analytics, orders, users, and reports
- Account profile update
- **Local image upload and deletion working**

## Known Limitations

### Cloudflare Workers + Mongoose
- OpenNext production build succeeds.
- The Worker starts and serves the homepage.
- The first database request succeeds.
- Subsequent database requests fail with:
  `The Workers runtime canceled this request because it detected that your Worker's code had hung and would never generate a response.`
- Root cause: `src/lib/db/connect.ts` caches a Mongoose connection globally. Workers do not allow I/O objects to be reused across requests.
- A direct Worker probe confirmed that per-request `mongoose.connect()` + `mongoose.disconnect()` works, but the current app architecture uses the default global Mongoose connection and models.
- Do not deploy the current database code to Cloudflare Workers without redesigning the connection lifecycle.

Recommended paths:
1. Deploy on a Node.js host (current code is ready).
2. For Cloudflare, put database access behind a Durable Object that owns the connection.
3. For Cloudflare, refactor to isolated per-request connections and models, or use the native MongoDB driver with a per-request client and guaranteed disconnect.

### Email delivery
- No Resend credentials configured.
- Registration reports `verificationEmailSent: false` rather than claiming an email was sent.
- Add `RESEND_API_KEY` and `EMAIL_FROM` to enable verification and password-reset email.

## Test Data Status

- Atlas test users, products, categories, orders, reviews, comments, carts, notifications, sessions, and audit records were removed after verification.
- The production build recreated one default `platformsettings` document.
- Indexes remain installed.
- No real customer data is present.

## Environment Variables

Use `.env.example` as the contract. Required for the current Atlas-backed app:

```text
APP_URL
MONGODB_URI
MONGODB_DB=furniturex
AUTH_SECRET
```

Optional:

```text
RESEND_API_KEY
EMAIL_FROM
```

**Removed (no longer needed for local storage):**
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_R2_ACCESS_KEY_ID
- CLOUDFLARE_R2_SECRET_ACCESS_KEY
- CLOUDFLARE_R2_BUCKET_NAME
- CLOUDFLARE_R2_ENDPOINT
- NEXT_PUBLIC_CLOUDFLARE_IMAGE_DOMAIN

Never commit `.env.local`, `.dev.vars`, or Atlas credentials. `.dev.vars` has been restored to its original non-secret development value.

## Next Steps

1. Decide the production target:
   - Node.js hosting for the current implementation, or
   - Cloudflare with a Durable Object/per-request database redesign.
2. Configure Resend if email is required.
3. Run `npm run seed` only if demo catalogue data is wanted.
4. Re-run the end-to-end flow against the chosen deployment target.
