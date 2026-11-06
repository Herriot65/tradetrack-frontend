import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";
import { navLinks } from "./landingData";
import LanguageSelector from "@/components/layout/LanguageSelector";
import ThemeToggle from "@/components/layout/ThemeToggle";
export default function Navbar() {
  useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <nav
        aria-label={t("Main navigation")}
        className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-2 px-4 sm:px-8"
      >
        <Link to="/" className="flex items-center gap-2.5" aria-label={t("Nexora home")}>
          <img src="/nexora.png" alt="" className="size-9 rounded-lg" />
          <span className="hidden text-[22px] font-semibold tracking-[-0.055em] min-[480px]:inline">
            nexora<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.label)}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 xl:flex">
          {!loading && (
            <Button asChild variant="ghost">
              <Link to={user ? "/dashboard" : "/login"}>{user ? t("Dashboard") : t("Log in")}</Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/register">{t("Get started")}<ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSelector />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? t("Close menu") : t("Open menu")}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>
      {mobileOpen && (
        <nav
          id="landing-mobile-menu"
          aria-label={t("Mobile navigation")}
          className="space-y-2 border-t border-border bg-card p-5 xl:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary"
            >
              {t(link.label)}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            {!loading && (
              <Button asChild variant="outline" className="flex-1">
                <Link to={user ? "/dashboard" : "/login"}>
                  {user ? t("Dashboard") : t("Log in")}
                </Link>
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link to="/register">{t("Get started")}</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
