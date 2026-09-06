import { useEffect, useState, type ReactNode } from "react";
import {
  gazelleLoginHref,
  gazelleSignupHref,
  getMe,
  meikapenAppHref,
  type MeikapenUser,
  type PlaybookIntent,
} from "@/lib/auth";

type Props = {
  children: (user: MeikapenUser) => ReactNode;
};

function playbookFromLocation(): PlaybookIntent | null {
  if (typeof window === "undefined") return null;
  const open = new URLSearchParams(window.location.search).get("open");
  if (open === "recupera" || open === "recupero") return "recupera";
  if (open === "gazellehunt" || open === "gazelle") return "gazellehunt";
  return null;
}

export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<MeikapenUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onViteDev, setOnViteDev] = useState(false);
  const playbook = playbookFromLocation();

  useEffect(() => {
    setOnViteDev(window.location.port === "5173");
    let cancelled = false;
    void getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] text-[var(--text-secondary)]">
        <p className="text-sm">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    const intent: PlaybookIntent = playbook || "recupera";
    const returnTo =
      intent === "gazellehunt"
        ? "/ryvo/?open=gazellehunt"
        : "/ryvo/?open=recupera";
    const signupReturn =
      intent === "gazellehunt"
        ? "/ryvo/?open=gazellehunt"
        : "/ryvo/?open=recupera&action=studio";
    const title = intent === "gazellehunt" ? "Gazelle Hunt" : "Recupero";
    const landingHref =
      intent === "gazellehunt"
        ? "https://meikapen.com/gazellehunt"
        : "https://meikapen.com/recupero";

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <p className="text-[11px] font-medium tracking-[0.18em] text-[var(--text-secondary)] uppercase">
          {title}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Instala. Activa. Sucede.
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-[var(--text-secondary)]">
          Entra desde la landing de {title}. Las plataformas operativas no se
          mezclan.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href={gazelleLoginHref({ playbook: intent, returnTo })}
            className="text-sm font-semibold tracking-wide text-[var(--accent)] underline underline-offset-4"
          >
            Iniciar sesión →
          </a>
          <a
            href={gazelleSignupHref({ playbook: intent, returnTo: signupReturn })}
            className="text-sm tracking-wide text-[var(--text-secondary)] underline underline-offset-4"
          >
            Crear cuenta →
          </a>
          <a
            href={landingHref}
            className="text-sm tracking-wide text-[var(--text-secondary)] underline underline-offset-4"
          >
            Ir a la landing →
          </a>
        </div>
        {onViteDev ? (
          <p className="mt-8 max-w-sm text-center text-xs text-[var(--text-secondary)]">
            Tras entrar, abre:{" "}
            <a
              className="underline"
              href={meikapenAppHref({
                open: intent === "gazellehunt" ? "gazellehunt" : "recupera",
              })}
            >
              {meikapenAppHref({
                open: intent === "gazellehunt" ? "gazellehunt" : "recupera",
              })}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return <>{children(user)}</>;
}
