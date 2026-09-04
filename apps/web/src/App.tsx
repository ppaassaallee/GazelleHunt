import { useState } from "react";
import { Shell } from "@/components/Shell";
import { HomePage } from "@/pages/HomePage";
import { PlaybooksPage } from "@/pages/PlaybooksPage";
import { WorkPage } from "@/pages/WorkPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import type { NavItem } from "@/components/nav";

export default function App() {
  const [active, setActive] = useState<NavItem>("home");

  return (
    <Shell active={active} onNavigate={setActive}>
      {active === "home" && <HomePage />}
      {active === "playbooks" && <PlaybooksPage />}
      {active === "work" && <WorkPage />}
      {active === "insights" && <InsightsPage />}
      {active === "settings" && <SettingsPage />}
    </Shell>
  );
}
