import { useEffect, useMemo, useState } from "react";
import { Art } from "./components/Art";
import { DoodleDefs, SceneDeskLeft, SceneDeskRight } from "./components/doodles";
import { AppContext, type AppContextValue } from "./context";
import { useRouter, type Route } from "./lib/router";
import { useSpeech } from "./lib/speech";
import { useRecent, useSaved, useStored } from "./lib/store";
import { AboutScreen } from "./screens/About";
import { Detail } from "./screens/Detail";
import { Home } from "./screens/Home";
import { AZScreen, CategoryScreen, MustKnowScreen, SavedScreen } from "./screens/Lists";
import { Menu, Onboarding } from "./screens/Overlays";

const params = new URLSearchParams(window.location.search);
/** ?embed=1 (or running inside an iframe) drops the phone frame and fills the iframe. */
const embedded = params.has("embed") || window.self !== window.top;

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case "term":
      return <Detail id={route.id} variantIndex={route.v} />;
    case "category":
      return <CategoryScreen id={route.id} />;
    case "must":
      return <MustKnowScreen />;
    case "az":
      return <AZScreen />;
    case "saved":
      return <SavedScreen />;
    case "about":
      return <AboutScreen />;
    default:
      return <Home query={route.q ?? ""} />;
  }
}

const routeKey = (route: Route) => (route.name === "home" ? "home" : JSON.stringify(route));

export default function App() {
  const { route, go, back, replace } = useRouter();
  const speech = useSpeech();
  const saved = useSaved();
  const recent = useRecent();
  const [introDone, setIntroDone] = useStored<boolean>("intro-done", false);
  const [showIntro, setShowIntro] = useState(() => (params.has("intro") ? true : !introDone && !embedded && route.name === "home" && !route.q));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("is-embed", embedded);
  }, []);

  // Each screen scrolls on its own; reset to top when the screen changes.
  const key = routeKey(route);
  useEffect(() => {
    document.querySelector(".screen-scroll")?.scrollTo({ top: 0 });
  }, [key]);

  const value = useMemo<AppContextValue>(
    () => ({
      speech,
      go,
      back,
      replace,
      ...saved,
      ...recent,
      openMenu: () => setMenuOpen(true),
      openIntro: () => setShowIntro(true),
    }),
    [speech, go, back, replace, saved, recent],
  );

  const finishIntro = () => {
    setIntroDone(true);
    setShowIntro(false);
  };

  return (
    <AppContext.Provider value={value}>
      <DoodleDefs />
      <div className="desk">
        <Art slot="desk-left" className="desk-art desk-art--left" fallback={<SceneDeskLeft />} />
        <Art slot="desk-right" className="desk-art desk-art--right" fallback={<SceneDeskRight />} />
        <div className="device">
          <div className="device-screen">
            <div className="screen" key={key}>
              <Screen route={route} />
            </div>
            {menuOpen ? <Menu onClose={() => setMenuOpen(false)} /> : null}
            {showIntro ? <Onboarding onDone={finishIntro} /> : null}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
