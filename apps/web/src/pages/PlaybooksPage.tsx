interface PlaybookCardProps {
  name: string;
  description: string;
  status: string;
  statusTone?: "active" | "soon";
}

function PlaybookCard({
  name,
  description,
  status,
  statusTone = "soon",
}: PlaybookCardProps) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">{name}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
            statusTone === "active"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "bg-[var(--background)] text-[var(--text-secondary)]",
          ].join(" ")}
        >
          {status}
        </span>
      </div>
    </article>
  );
}

export function PlaybooksPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Resultados operativos por playbook
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <PlaybookCard
          name="Recupera"
          description="Cobranza con Rocío"
          status="Activo soon"
          statusTone="active"
        />
        <PlaybookCard
          name="Sube"
          description="Próximamente"
          status="Próximamente"
        />
        <PlaybookCard
          name="Monetiza"
          description="Próximamente"
          status="Próximamente"
        />
      </div>
    </div>
  );
}
