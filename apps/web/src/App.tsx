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
import type { MeikapenUser } from "@/lib/auth";

function AuthenticatedApp({ user }: { user: MeikapenUser }) {
  const [active, setActive] = useState<NavItem>("home");
  const [recuperaOpen, setRecuperaOpen] = useState(false);
  const [recuperaAction, setRecuperaAction] = useState<RecuperaOpenAction>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function navigate(item: NavItem) {
    setRecuperaOpen(false);
    setRecuperaAction(null);
    setActive(item);
  }

  function openRecupera(opts?: { action?: RecuperaOpenAction }) {
    setActive("playbooks");
    setRecuperaAction(opts?.action ?? null);
    setRecuperaOpen(true);
  }

  return (
    <>
      <Shell active={active} onNavigate={navigate} onOpenCommand={() => setCommandOpen(true)}>
        {recuperaOpen ? (
          <RecuperaPage
            key={String(recuperaAction)}
            initialAction={recuperaAction}
            onBack={() => {
              setRecuperaOpen(false);
              setRecuperaAction(null);
            }}
          />
        ) : (
          <>
            {active === "home" && (
              <HomePage
                user={user}
                onOpenPlaybooks={() => setActive("playbooks")}
                onOpenRecupera={() => openRecupera()}
                onOpenWork={() => setActive("work")}
              />
            )}
            {active === "playbooks" && (
              <PlaybooksPage onOpenRecupera={() => openRecupera()} />
            )}
            {active === "work" && <WorkPage />}
            {active === "insights" && <InsightsPage />}
            {active === "settings" && <SettingsPage user={user} />}
          </>
        )}
      </Shell>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={navigate}
        onOpenRecupera={openRecupera}
      />
    </>
  );
}

export default function App() {
  return <AuthGate>{(user) => <AuthenticatedApp user={user} />}</AuthGate>;
}
