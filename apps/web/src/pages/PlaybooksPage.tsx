type PlaybookCardProps = {
  name: string;
  description: string;
  status: string;
  statusTone?: "active" | "soon";
  onOpen?: () => void;
};

function PlaybookCard({
  name,
  description,
  status,
  statusTone = "soon",
  onOpen,
}: PlaybookCardProps) {
  const className =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-opacity hover:opacity-95";

  const body = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-medium">{name}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
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
  );

  if (onOpen) {
    return (
      <button type="button" className={className} onClick={onOpen}>
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}

type Props = {
  onOpenRecupera: () => void;
};

export function PlaybooksPage({ onOpenRecupera }: Props) {
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
          status="Abrir"
          statusTone="active"
          onOpen={onOpenRecupera}
        />
        <PlaybookCard
          name="Sube"
          description="Retención + crecimiento"
          status="Próximamente"
        />
        <PlaybookCard
          name="Monetiza"
          description="Conversión"
          status="Próximamente"
        />
      </div>
    </div>
  );
}
