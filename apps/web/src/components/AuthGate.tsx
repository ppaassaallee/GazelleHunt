import { useEffect, useState, type ReactNode } from "react";
import {
  gazelleLoginHref,
  getMe,
  meikapenAppHref,
  type MeikapenUser,
} from "@/lib/auth";

type Props = {
  children: (user: MeikapenUser) => ReactNode;
};

export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<MeikapenUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onViteDev, setOnViteDev] = useState(false);

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
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <p className="text-[11px] font-medium tracking-[0.18em] text-[var(--text-secondary)] uppercase">
          Meikapen
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Instala. Activa. Sucede.
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-[var(--text-secondary)]">
          Una sesión. Recupera, Gazelle Hunt y la plataforma.
        </p>
        <a
          href={gazelleLoginHref()}
          className="mt-8 text-sm font-semibold tracking-wide text-[var(--accent)] underline underline-offset-4"
        >
          Iniciar sesión →
        </a>
        {onViteDev ? (
          <p className="mt-8 max-w-sm text-center text-xs text-[var(--text-secondary)]">
            Tras entrar, abre la app en el Worker:{" "}
            <a className="underline" href={meikapenAppHref()}>
              {meikapenAppHref()}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return <>{children(user)}</>;
}
