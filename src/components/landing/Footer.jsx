import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Link } from "react-router-dom";

import { footerLinks } from "./landingData";

export default function Footer() {
  useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/nexora.png"
                alt="Nexora"
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-sm font-semibold text-foreground">
                Nexora Analytics
              </span>
            </Link>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t("Product")}</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/60 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {year}{" " + t("Nexora Analytics. All rights reserved.")}</p>
          <div className="flex gap-6">
            <Link
              to="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >{t("Log in")}</Link>
            <Link
              to="/register"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >{t("Sign up")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
