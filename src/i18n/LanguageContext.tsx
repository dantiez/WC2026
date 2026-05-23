import { createContext, useContext, useMemo, type ReactNode } from "react";
import { vn } from "./translations/vn";

export type Lang = "vn";

type Dict = typeof vn;
type Vars = Record<string, string | number>;

function resolvePath(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cursor: unknown = dict;
  for (const p of parts) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[p];
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

const translate = (path: string, vars?: Vars) => {
  const value = resolvePath(vn, path) ?? path;
  return interpolate(value, vars);
};

const VALUE: LanguageContextValue = {
  lang: "vn",
  setLang: () => {},
  t: translate,
};

const LanguageContext = createContext<LanguageContextValue>(VALUE);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => VALUE, []);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", "vi");
  }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext);
}
