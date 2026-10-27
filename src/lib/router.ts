import { useCallback, useEffect, useState } from "react";

export type Route =
  | { name: "home"; q?: string }
  | { name: "term"; id: string; v?: number; from?: string }
  | { name: "category"; id: string }
  | { name: "must" }
  | { name: "az"; letter?: string }
  | { name: "saved" }
  | { name: "about" };

/** Params that should survive every navigation (embed mode etc.). */
const STICKY = ["embed", "frame"];

export function parseRoute(search: string): Route {
  const params = new URLSearchParams(search);
  if (params.get("t")) return { name: "term", id: params.get("t")!, v: Number(params.get("v") ?? 0) || 0 };
  if (params.get("c")) return { name: "category", id: params.get("c")! };
  switch (params.get("p")) {
    case "must":
      return { name: "must" };
    case "az":
      return { name: "az", letter: params.get("l") ?? undefined };
    case "saved":
      return { name: "saved" };
    case "about":
      return { name: "about" };
  }
  return { name: "home", q: params.get("q") ?? undefined };
}

export function routeToSearch(route: Route) {
  const current = new URLSearchParams(window.location.search);
  const params = new URLSearchParams();
  STICKY.forEach((key) => current.has(key) && params.set(key, current.get(key)!));
  switch (route.name) {
    case "home":
      if (route.q) params.set("q", route.q);
      break;
    case "term":
      params.set("t", route.id);
      if (route.v) params.set("v", String(route.v));
      break;
    case "category":
      params.set("c", route.id);
      break;
    case "az":
      params.set("p", "az");
      if (route.letter) params.set("l", route.letter);
      break;
    default:
      params.set("p", route.name);
  }
  const text = params.toString();
  return text ? `?${text}` : window.location.pathname;
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.search));
  const [depth, setDepth] = useState(() => (window.history.state?.depth as number | undefined) ?? 0);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      setRoute(parseRoute(window.location.search));
      setDepth((event.state?.depth as number | undefined) ?? 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback(
    (next: Route) => {
      const nextDepth = depth + 1;
      window.history.pushState({ depth: nextDepth }, "", routeToSearch(next));
      setDepth(nextDepth);
      setRoute(next);
    },
    [depth],
  );

  /** Updates the URL without adding history (used while typing a search). */
  const replace = useCallback(
    (next: Route) => {
      window.history.replaceState({ depth }, "", routeToSearch(next));
      setRoute(next);
    },
    [depth],
  );

  const back = useCallback(() => {
    if (depth > 0) window.history.back();
    else {
      window.history.replaceState({ depth: 0 }, "", routeToSearch({ name: "home" }));
      setRoute({ name: "home" });
    }
  }, [depth]);

  return { route, go, replace, back };
}
