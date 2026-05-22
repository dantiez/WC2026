import { useTranslation } from "../../i18n/LanguageContext";

interface Props {
  className?: string;
  compact?: boolean;
}

export default function LanguageToggle({ className = "", compact = false }: Props) {
  const { lang, setLang, t } = useTranslation();

  const segBase =
    "px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer select-none rounded-md";
  const segActive = "bg-yellow-500 text-black";
  const segInactive = "text-text-muted hover:text-text-primary";

  return (
    <div
      role="group"
      aria-label={t("ui.languageToggleLabel")}
      className={`inline-flex items-center gap-0.5 bg-surface-3 border border-border-default p-0.5 rounded-lg ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("vn")}
        className={`${segBase} ${lang === "vn" ? segActive : segInactive}`}
        aria-pressed={lang === "vn"}
      >
        VN
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`${segBase} ${lang === "en" ? segActive : segInactive}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      {compact ? null : null}
    </div>
  );
}
