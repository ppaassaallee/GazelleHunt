import type { MeikapenUser } from "@/lib/auth";
import { gazelleLoginHref } from "@/lib/auth";

type Props = {
  user?: MeikapenUser | null;
};

export function SettingsPage({ user }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Cuenta Meikapen
        </p>
      </header>

      {user ? (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[var(--text-secondary)]">Nombre</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Empresa</dt>
            <dd className="font-medium">{user.companyName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Rol</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Sin sesión.</p>
      )}

      <p className="mt-8 text-xs text-[var(--text-secondary)]">
        Meikapen · meikapen.com
      </p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">
        Gestión de cuenta en{" "}
        <a className="underline" href={gazelleLoginHref()}>
          Gazelle Hunt
        </a>
        .
      </p>
    </div>
  );
}
