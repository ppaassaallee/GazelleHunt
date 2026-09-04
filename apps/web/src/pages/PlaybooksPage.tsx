import { ArrowUpRight } from "lucide-react";

type PlaybookRowProps = {
  name: string;
  description: string;
  status: string;
  active?: boolean;
  onOpen?: () => void;
  href?: string;
};

function PlaybookRow({
  name,
  description,
  status,
  active,
  onOpen,
  href,
}: PlaybookRowProps) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={[
            "text-[11px] font-medium",
            active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]",
          ].join(" ")}
        >
          {status}
        </span>
        {active ? <ArrowUpRight size={14} className="text-[var(--text-secondary)]" /> : null}
      </div>
    </>
  );

  const className =
    "flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[var(--text-primary)] no-underline hover:bg-[var(--hover)]";

  if (href) {
    return (
      <a href={href} className={className}>
        {body}
      </a>
    );
  }
  if (onOpen) {
    return (
      <button type="button" className={className} onClick={onOpen}>
        {body}
      </button>
    );
  }
  return <div className={`${className} opacity-70`}>{body}</div>;
}

type Props = {
  onOpenRecupera: () => void;
};

export function PlaybooksPage({ onOpenRecupera }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
          Meikapen
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Playbooks</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Instala. Activa. Sucede.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] divide-y divide-[var(--border)]">
        <PlaybookRow
          name="Gazelle Hunt"
          description="by Meikapen · contratación"
          status="Abrir"
          active
          href="/gazellehunt"
        />
        <PlaybookRow
          name="Recupera"
          description="by Meikapen · Rocío powered by Meikapen"
          status="Abrir"
          active
          onOpen={onOpenRecupera}
        />
        <PlaybookRow
          name="Sube"
          description="by Meikapen · Retención + crecimiento"
          status="Pronto"
        />
        <PlaybookRow
          name="Monetiza"
          description="by Meikapen · Conversión"
          status="Pronto"
        />
      </div>
    </div>
  );
}
