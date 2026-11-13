import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, BarChart3, ScanLine } from "lucide-react";
import LanguageSelector from "@/components/layout/LanguageSelector";
import DepthScene from "@/components/motion/DepthScene";
import ThemeToggle from "@/components/layout/ThemeToggle";
export default function AuthLayout({ children }) {
  useLanguage();
  return (
    <div className="nx-auth">
      <aside className="nx-auth-story">
        <Link to="/" className="flex w-fit items-center gap-3">
          <img src="/nexora.png" alt="" className="size-10 rounded-xl" />
          <span className="text-2xl font-semibold tracking-[-0.06em]">
            nexora<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="nx-auth-story-copy relative my-16 max-w-md">
          <div className="nx-auth-depth"><DepthScene /></div>
          <p className="nx-eyebrow mb-6">{t("The journal behind your edge")}</p>
          <h2 className="text-[clamp(36px,4vw,58px)] font-medium leading-[1.07] tracking-[-0.055em]">{t("Better decisions")}<br />{t("start with a")}<br />
            <span className="text-primary">{t("clearer picture.")}</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">{t("Bring your trades, your process, and your performance together. Understand what works. Build on it.")}</p>
          <div className="mt-10 space-y-4">
            {[
              { icon: BookOpen, text: "A journal for every trading approach" },
              { icon: BarChart3, text: "Analytics that make your history useful" },
              { icon: ScanLine, text: "The details behind every decision" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-[12px] text-zinc-400">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-card">
                  <Icon className="size-3.5 text-primary" />
                </span>
                {t(text)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Nexora Analytics</span>
          <Link to="/" className="flex items-center gap-1 hover:text-primary">{t("Explore the platform")}<ArrowUpRight className="size-3" />
          </Link>
        </div>
      </aside>
      <main className="nx-auth-content relative !pt-24">
        <div className="absolute right-4 top-4 flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelector />
        </div>
        <div className="nx-auth-form-surface w-full max-w-[400px]">
          <Link to="/" className="mb-10 flex items-center justify-center gap-2 md:hidden">
            <img src="/nexora.png" alt="" className="size-9 rounded-lg" />
            <span className="text-xl font-semibold tracking-tight">nexora.</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
