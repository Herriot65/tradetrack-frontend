import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Box, LayoutTemplate, Monitor, Moon, Sun } from "lucide-react";
import { DropdownMenu as Menu } from "radix-ui";
import { useTheme } from "@/lib/theme";
import { useDesign } from "@/lib/design";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const icons = { light: Sun, dark: Moon, system: Monitor };
const labels = { light: "Light", dark: "Dark", system: "System" };
export default function ThemeToggle() {
  useLanguage();
  const [theme, setTheme] = useTheme();
  const [design, setDesign] = useDesign();
  const Icon = icons[theme];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={t("Theme")}
          title={`${t("Theme")}: ${design === "3d" ? "3D" : t("Classic")} · ${t(labels[theme])}`}
          className="h-9 w-9 shrink-0 px-0"
        >
          <Icon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Menu.Label className="px-3 py-2 text-xs text-muted-foreground">{t("Design")}</Menu.Label>
        <Menu.RadioGroup aria-label={t("Design")} value={design} onValueChange={setDesign}>
          {[["classic", "Classic", LayoutTemplate], ["3d", "3D", Box]].map(([value, label, DesignIcon]) => (
            <Menu.RadioItem key={value} value={value} className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary">
              <DesignIcon aria-hidden="true" className="size-4" />{t(label)}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
        <Menu.Separator className="my-1 h-px bg-border" />
        <Menu.Label className="px-3 py-2 text-xs text-muted-foreground">{t("Color mode")}</Menu.Label>
        <Menu.RadioGroup aria-label={t("Theme")} value={theme} onValueChange={setTheme}>
          {Object.entries(icons).map(([value, OptionIcon]) => (
            <Menu.RadioItem
              key={value}
              value={value}
              className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
            >
              <OptionIcon aria-hidden="true" className="size-4" />
              {t(labels[value])}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
