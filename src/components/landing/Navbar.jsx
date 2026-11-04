import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "./landingData";
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link to="/" className="flex items-center gap-2.5" aria-label="Nexora home">
          <img src="/nexora.png" alt="" className="size-9 rounded-lg" />
          <span className="text-[22px] font-semibold tracking-[-0.055em]">
            nexora<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">
              Get started
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </nav>
      {mobileOpen && (
        <nav
          id="landing-mobile-menu"
          aria-label="Mobile navigation"
          className="space-y-2 border-t border-border bg-card p-5 md:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
