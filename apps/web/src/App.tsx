import { useState } from "react";
import { Shell } from "@/components/Shell";
import { HomePage } from "@/pages/HomePage";
import { PlaybooksPage } from "@/pages/PlaybooksPage";
import { RecuperaPage } from "@/pages/RecuperaPage";
import { WorkPage } from "@/pages/WorkPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import type { NavItem } from "@/components/nav";

export default function App() {
  const [active, setActive] = useState<NavItem>("home");
  const [recuperaOpen, setRecuperaOpen] = useState(false);

  function navigate(item: NavItem) {
    setRecuperaOpen(false);
    setActive(item);
  }

  return (
    <Shell active={active} onNavigate={navigate}>
      {recuperaOpen ? (
        <RecuperaPage onBack={() => setRecuperaOpen(false)} />
      ) : (
        <>
          {active === "home" && <HomePage />}
          {active === "playbooks" && (
            <PlaybooksPage onOpenRecupera={() => setRecuperaOpen(true)} />
          )}
          {active === "work" && <WorkPage />}
          {active === "insights" && <InsightsPage />}
          {active === "settings" && <SettingsPage />}
        </>
      )}
    </Shell>
  );
}
