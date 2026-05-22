import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { vn } from "./translations/vn";
import { en } from "./translations/en";

export type Lang = "vn" | "en";

const STORAGE_KEY = "app.language";

const dictionaries = { vn, en } as const;

type Dict = typeof vn;
type Vars = Record<string, string | number>;

function resolvePath(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cursor: any = dict;
  for (const p of parts) {
    if (cursor == null) return undefined;
    cursor = cursor[p];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "vn";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "vn" || v === "en") return v;
  } catch {}
  return "vn";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", next === "vn" ? "vi" : "en");
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang === "vn" ? "vi" : "en");
    }
  }, [lang]);

  const t = useCallback(
    (path: string, vars?: Vars) => {
      const active = dictionaries[lang] as Dict;
      const fallback = dictionaries.vn;
      const value = resolvePath(active, path) ?? resolvePath(fallback, path) ?? path;
      return interpolate(value, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return ctx;
}
