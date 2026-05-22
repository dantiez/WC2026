import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { useTranslation } from "../../i18n/LanguageContext";

interface Props {
  className?: string;
}

export default function ThemeToggle({ className = "" }: Props) {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === "dark";
  const label = isDark ? t("ui.themeToggleLight") : t("ui.themeToggleDark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-3 border border-border-default text-text-primary hover:text-yellow-400 hover:border-yellow-500/40 transition-colors cursor-pointer ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
