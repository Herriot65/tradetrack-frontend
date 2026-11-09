import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  BookOpen,
  ChartNoAxesCombined,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import { useJournal } from "@/journals/useJournal";
import { useAuth } from "@/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import JournalSwitcher from "@/components/dashboard/JournalSwitcher";
import UserSettings from "./UserSettings";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

function readCollapsed() {
  try {
    return localStorage.getItem("sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}
function Hint({ label, children }) {
  useLanguage();
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{t(label)}</TooltipContent>
    </Tooltip>
  );
}
export default function AppShell({ children }) {
  useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { journals, activeJournal } = useJournal();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const resize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const navigation = document.getElementById("app-navigation");
    navigation.querySelector("a,button")?.focus();
    const close = (event) => {
      if(event.defaultPrevented) return;
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key === "Tab") {
        const nodes = [...navigation.querySelectorAll("a[href],button:not(:disabled)")].filter(
          (node) => node.offsetParent !== null,
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document.getElementById("mobile-navigation-trigger")?.focus();
    };
  }, [mobileOpen]);
  const compact = collapsed && !mobile;
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Account";
  const initials =
    (user?.first_name?.[0] || user?.email?.[0] || "N") + (user?.last_name?.[0] || "");
  const journalRoute = location.pathname.startsWith("/journal/");
  const journal = journals.find(item => String(item.id) === location.pathname.split('/')[2]) ?? activeJournal;
  const tab = new URLSearchParams(location.search).get('tab') ?? 'trades';
  const section = location.pathname === '/coach' ? 'coach' : !journalRoute ? 'accounts' : ['analytics','breakdown'].includes(tab) ? 'analytics' : ['settings','custom-fields'].includes(tab) ? 'settings' : tab === 'overview' ? 'overview' : 'journal';
  function sectionLink(next) {
    const params = new URLSearchParams(journalRoute ? location.search : '');
    params.set('tab', next);
    return journal ? `/journal/${journal.id}?${params}` : '/dashboard';
  }
  const destinations = [
    {id:'overview', label:'Overview', icon:LayoutDashboard, tab:'overview'},
    {id:'journal', label:'Journal', icon:BookOpen, tab:'trades'},
    {id:'analytics', label:'Analytics', icon:ChartNoAxesCombined, tab:'analytics'},
    {id:'coach', label:'AI Coach', icon:Sparkles, href:'/coach'},
  ];
  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        localStorage.setItem("sidebar_collapsed", String(!value));
      } catch {
        /* Local persistence is optional. */
      }
      return !value;
    });
  }
  return (
    <div className="nx-shell" data-collapsed={compact} data-mobile-open={mobileOpen}>
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >{t("Skip to content")}</a>
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("Close navigation")}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        id="app-navigation"
        className="nx-sidebar"
        aria-label={t("Application navigation")}
        inert={mobile && !mobileOpen ? true : undefined}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-5">
          <Link
            to="/dashboard"
            aria-label={t("Nexora dashboard")}
            onClick={() => setMobileOpen(false)}
            className="flex min-w-0 items-center gap-2.5"
          >
            <img src="/nexora.png" alt="" className="size-8 shrink-0 rounded-lg" />
            {!compact && (
              <div className="min-w-0">
                <span className="text-[17px] font-semibold tracking-[-0.05em]">
                  nexora<span className="text-primary">.</span>
                </span>
                <p className="text-[8px] uppercase tracking-[0.22em] text-zinc-500">{t("Trading intelligence")}</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            className="md:hidden"
            aria-label={t("Close navigation")}
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </Button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6" aria-label={t('Main sections')}>
          {destinations.map(item=><Hint key={item.id} label={t(item.label)}>
            <Link to={item.href ?? sectionLink(item.tab)} className="nx-nav-item" data-active={section===item.id}
              aria-label={t(item.label)} aria-current={section===item.id?'page':undefined}
              aria-disabled={(!journal && !item.href) || undefined} onClick={event=>{if(!journal && !item.href)event.preventDefault();else setMobileOpen(false);}}>
              <item.icon aria-hidden="true" className="size-[18px] shrink-0"/>
              <span className="nx-nav-label">{t(item.label)}</span>
            </Link>
          </Hint>)}
        </nav>
        <div className="space-y-2 border-t border-border/60 p-3">
          <Hint label={t('Settings')}>
            {journal ? <Link to={sectionLink('settings')} className="nx-nav-item" data-active={section==='settings'} aria-label={t('Settings')} aria-current={section==='settings'?'page':undefined} onClick={()=>setMobileOpen(false)}>
              <Settings aria-hidden="true" className="size-[18px] shrink-0"/><span className="nx-nav-label">{t('Settings')}</span>
            </Link> : <button type="button" className="nx-nav-item w-full" aria-label={t('Settings')} onClick={()=>{setMobileOpen(false);setSettingsOpen(true);}}><Settings className="size-[18px] shrink-0"/><span className="nx-nav-label">{t('Settings')}</span></button>}
          </Hint>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={compact ? t("Expand sidebar") : t("Collapse sidebar")}
            aria-expanded={!compact}
            className="nx-nav-item hidden w-full md:flex"
          >
            {compact ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" />
                <span className="nx-nav-label">{t("Collapse sidebar")}</span>
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="nx-shell-body" inert={mobile && mobileOpen ? true : undefined}>
        <header className="nx-header">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button
              id="mobile-navigation-trigger"
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t("Open navigation")}
              aria-controls="app-navigation"
              aria-expanded={mobileOpen}
            >
              <Menu />
            </Button>
            <div className="w-full min-w-0 max-w-[220px]"><JournalSwitcher /></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <LanguageSelector />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("Account menu")}
                  className="flex items-center gap-2.5 rounded-lg p-1.5 outline-none transition-colors hover:bg-secondary"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-medium uppercase text-primary">
                    {initials}
                  </span>
                  <span className="hidden max-w-32 truncate text-[12px] text-zinc-300 sm:block">
                    {name}
                  </span>
                  <ChevronDown className="hidden size-3 text-zinc-500 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-[13px] font-medium">{name}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="size-4" />{t("Settings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" />{t("Sign out")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="main-content" className="nx-page">
          {children}
        </main>
      </div>
      {settingsOpen && <UserSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
