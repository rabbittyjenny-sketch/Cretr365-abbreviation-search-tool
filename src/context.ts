import { createContext, useContext } from "react";
import type { Route } from "./lib/router";
import type { Speech } from "./lib/speech";

export type AppContextValue = {
  speech: Speech;
  go: (route: Route) => void;
  back: () => void;
  replace: (route: Route) => void;
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  clearSaved: () => void;
  recent: string[];
  remember: (query: string) => void;
  clearRecent: () => void;
  openMenu: () => void;
  openIntro: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppContext.Provider>");
  return value;
}
