import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { CategoryMenu } from "@/components/layout/CategoryMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { dashboardPathForRole, getCurrentUser } from "@/lib/auth/session";
import { getCartCount } from "@/services/cart";
import { listActiveCategories } from "@/services/products";
import type { CategoryDTO } from "@/types";

export async function SiteHeader() {
  const user = await getCurrentUser();
  let categories: CategoryDTO[] = [];
  let cartCount = 0;
  try {
    categories = await listActiveCategories();
    if (user) cartCount = await getCartCount(user.id);
  } catch (error) {
    console.error("[layout] failed to load marketplace navigation", error);
  }

  const dashboardPath = user ? dashboardPathForRole(user.role) : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Logo className="shrink-0" />

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          >
            Home
          </Link>
          <Link
            href="/marketplace"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          >
            Marketplace
          </Link>
          <CategoryMenu categories={categories} />
          <Link
            href="/about"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          >
            About
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
            aria-label="Search furniture"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/wishlist"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary sm:flex"
            aria-label="Wishlist"
          >
            <Heart className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="ml-1">
              <UserMenu name={user.name} role={user.role} dashboardPath={dashboardPath} />
            </div>
          ) : (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
              >
                Login
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          <MobileMenu
            categories={categories}
            user={user ? { name: user.name, role: user.role, dashboardPath } : null}
            cartCount={cartCount}
          />
        </div>
      </div>
    </header>
  );
}
