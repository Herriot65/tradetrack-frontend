import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  useLanguage();
  return (
    <div className="nx-empty-page flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      {/* Brand mark */}
      <img
        src="/nexora.png"
        alt="Nexora"
        className="mb-8 size-14 rounded-2xl object-contain"
      />

      {/* 404 */}
      <p className="text-[80px] font-black leading-none tracking-tight text-primary/40 sm:text-[120px]">
        404
      </p>

      <h1 className="mt-4 text-xl font-semibold text-zinc-100 sm:text-2xl">{t("Page not found")}</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">{t("The page you're looking for doesn't exist or has been moved.")}</p>

      <div className="mt-8 flex items-center gap-3">
        <Button asChild>
          <Link to="/dashboard">{t("Go to Dashboard")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">{t("Home")}</Link>
        </Button>
      </div>
    </div>
  );
}
