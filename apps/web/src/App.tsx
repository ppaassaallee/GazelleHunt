import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { CommandPalette } from "@/components/CommandPalette";
import { Shell } from "@/components/Shell";
import { HomePage } from "@/pages/HomePage";
import { PlaybooksPage } from "@/pages/PlaybooksPage";
import { RecuperaPage, type RecuperaOpenAction } from "@/pages/RecuperaPage";
import { WorkPage } from "@/pages/WorkPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import type { NavItem } from "@/components/nav";
import { isMeikapenAdmin, type MeikapenUser } from "@/lib/auth";

type ProductMode = "admin" | "recupera" | "gazellehunt";

function parseProductFromLocation(): {
  mode: ProductMode;
  action: RecuperaOpenAction;
} {
  if (typeof window === "undefined") return { mode: "admin", action: null };
  const params = new URLSearchParams(window.location.search);
  const open = params.get("open");
  const actionRaw = params.get("action");
  const action: RecuperaOpenAction =
    actionRaw === "studio" ||
    actionRaw === "add" ||
    actionRaw === "import" ||
    actionRaw === "onboarding"
      ? actionRaw
      : null;
  if (open === "recupera" || open === "recupero") {
    return { mode: "recupera", action };
  }
  if (open === "gazellehunt" || open === "gazelle") {
    return { mode: "gazellehunt", action: null };
  }
  return { mode: "admin", action: null };
}

function AuthenticatedApp({ user }: { user: MeikapenUser }) {
  const initial = parseProductFromLocation();
  const [mode, setMode] = useState<ProductMode>(initial.mode);
  const [active, setActive] = useState<NavItem>("home");
  const [recuperaAction, setRecuperaAction] = useState<RecuperaOpenAction>(
    initial.action,
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const admin = isMeikapenAdmin(user);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (mode !== "admin") return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  useEffect(() => {
    if (initial.mode === "admin") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("open");
    url.searchParams.delete("action");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [initial.mode]);

  useEffect(() => {
    if (mode !== "gazellehunt") return;
    // Gazelle Hunt workspace is the legacy app on the same meikapen.com host (/app)
    // so the session cookie set at login stays valid.
    window.location.replace("/app");
  }, [mode]);

  useEffect(() => {
    if (mode !== "admin") return;
    if (admin) return;
    // Non-admins don't use the Meikapen platform shell — send them to a product landing.
    window.location.replace("https://meikapen.com/recupero");
  }, [mode, admin]);

  function navigate(item: NavItem) {
    setActive(item);
  }

  if (mode === "gazellehunt") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] text-[var(--text-secondary)]">
        <p className="text-sm">Abriendo Gazelle Hunt…</p>
      </div>
    );
  }

  if (mode === "recupera") {
    return (
      <RecuperaPage
        key={String(recuperaAction)}
        initialAction={recuperaAction}
        isolated
        onBack={
          admin
            ? () => {
                setRecuperaAction(null);
                setMode("admin");
                setActive("home");
              }
            : undefined
        }
      />
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] text-[var(--text-secondary)]">
        <p className="text-sm">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <>
      <Shell active={active} onNavigate={navigate} onOpenCommand={() => setCommandOpen(true)}>
        {active === "home" && (
          <HomePage
            user={user}
            onOpenPlaybooks={() => setActive("playbooks")}
            onOpenRecupera={() => {
              setRecuperaAction(null);
              setMode("recupera");
            }}
            onOpenWork={() => setActive("work")}
          />
        )}
        {active === "playbooks" && (
          <PlaybooksPage
            onOpenRecupera={() => {
              setRecuperaAction(null);
              setMode("recupera");
            }}
          />
        )}
        {active === "work" && <WorkPage />}
        {active === "insights" && <InsightsPage />}
        {active === "settings" && <SettingsPage user={user} />}
      </Shell>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={navigate}
        onOpenRecupera={() => {
          setRecuperaAction(null);
          setMode("recupera");
        }}
      />
    </>
  );
}

export default function App() {
  return <AuthGate>{(user) => <AuthenticatedApp user={user} />}</AuthGate>;
}
