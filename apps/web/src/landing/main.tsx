import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LandingShell } from "@/landing/components/LandingShell";
import { copyForPath, type LandingCopy } from "@/landing/copy";
import "@/landing/landing.css";

function LandingApp() {
  const [copy, setCopy] = useState<LandingCopy>(() => copyForPath(window.location.pathname));

  useEffect(() => {
    document.title = copy.documentTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", copy.metaDescription);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = copy.metaDescription;
      document.head.appendChild(meta);
    }
  }, [copy]);

  useEffect(() => {
    function sync() {
      setCopy(copyForPath(window.location.pathname));
    }
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return <LandingShell copy={copy} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingApp />
  </StrictMode>,
);
