export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Preferencias de la cuenta
        </p>
      </header>

      <p className="text-sm text-[var(--text-secondary)]">
        Configuración disponible próximamente.
      </p>
      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        Local flags in <code className="rounded bg-[var(--surface-secondary)] px-1">apps/worker/.dev.vars</code> — see <code className="rounded bg-[var(--surface-secondary)] px-1">.dev.vars.example</code>.
      </p>
    </div>
  );
}
