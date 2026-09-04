import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { listObligations, type RecuperaObligation } from "@/lib/recupera";
import type { NavItem } from "@/components/nav";

export type CommandAction = {
  id: string;
  label: string;
  hint?: string;
  group: "Ir a" | "Acciones" | "Cuentas";
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (item: NavItem) => void;
  onOpenRecupera: (opts?: { action?: "add" | "import" | "onboarding" | "studio" }) => void;
};

function matches(query: string, ...parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((part) => (part || "").toLowerCase().includes(q));
}

export function CommandPalette({ open, onClose, onNavigate, onOpenRecupera }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [accounts, setAccounts] = useState<RecuperaObligation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    void listObligations()
      .then((data) => setAccounts(data.obligations || []))
      .catch(() => setAccounts([]));
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    const nav: CommandAction[] = (
      [
        {
          id: "nav-home",
          label: "Inicio",
          group: "Ir a" as const,
          run: () => onNavigate("home"),
        },
        {
          id: "nav-playbooks",
          label: "Playbooks",
          group: "Ir a" as const,
          run: () => onNavigate("playbooks"),
        },
        {
          id: "nav-work",
          label: "Pendientes",
          group: "Ir a" as const,
          run: () => onNavigate("work"),
        },
        {
          id: "nav-insights",
          label: "Insights",
          group: "Ir a" as const,
          run: () => onNavigate("insights"),
        },
        {
          id: "nav-settings",
          label: "Configuración",
          group: "Ir a" as const,
          run: () => onNavigate("settings"),
        },
        {
          id: "nav-recupera",
          label: "Recupera",
          hint: "Cobranza",
          group: "Ir a" as const,
          run: () => onOpenRecupera(),
        },
        {
          id: "nav-rocio",
          label: "Rocío",
          hint: "Pendientes de atención",
          group: "Ir a" as const,
          run: () => onNavigate("work"),
        },
      ] satisfies CommandAction[]
    ).filter((item) => matches(query, item.label, item.hint));

    const actions: CommandAction[] = (
      [
        {
          id: "act-add",
          label: "Nueva obligación",
          group: "Acciones" as const,
          run: () => onOpenRecupera({ action: "add" }),
        },
        {
          id: "act-import",
          label: "Importar cuentas",
          group: "Acciones" as const,
          run: () => onOpenRecupera({ action: "import" }),
        },
        {
          id: "act-activate",
          label: "Activar playbook",
          group: "Acciones" as const,
          run: () => onOpenRecupera({ action: "onboarding" }),
        },
        {
          id: "act-studio",
          label: "Personalizar estrategia",
          group: "Acciones" as const,
          run: () => onOpenRecupera({ action: "studio" }),
        },
      ] satisfies CommandAction[]
    ).filter((item) => matches(query, item.label));

    const accountItems: CommandAction[] = accounts
      .filter((row) =>
        matches(query, row.payerName, row.reference, row.stageKey, String(row.balanceCents)),
      )
      .slice(0, 8)
      .map((row) => ({
        id: `obl-${row.id}`,
        label: row.payerName,
        hint: row.reference || row.stageKey,
        group: "Cuentas" as const,
        run: () => onOpenRecupera(),
      }));

    return [...nav, ...actions, ...accountItems];
  }, [accounts, onNavigate, onOpenRecupera, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  function run(item: CommandAction) {
    onClose();
    item.run();
  }

  const groups = ["Ir a", "Acciones", "Cuentas"] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 pt-[12vh] backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar y comandos"
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-modal)] border border-[var(--border)] bg-[var(--glass)] shadow-[var(--shadow-soft)] backdrop-blur-xl animate-[menu-in_var(--motion)_ease-out]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={16} className="text-[var(--text-secondary)]" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cuentas, playbooks o acciones…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-secondary)]"
            aria-autocomplete="list"
            aria-controls="command-list"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.min(value + 1, Math.max(items.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(value - 1, 0));
              } else if (event.key === "Enter" && items[active]) {
                event.preventDefault();
                run(items[active]);
              }
            }}
          />
          <kbd className="hidden rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] sm:inline">
            esc
          </kbd>
        </div>
        <ul id="command-list" role="listbox" className="max-h-[min(52vh,22rem)] overflow-y-auto py-2">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--text-secondary)]">Sin resultados</li>
          ) : (
            groups.map((group) => {
              const rows = items.filter((item) => item.group === group);
              if (!rows.length) return null;
              return (
                <li key={group} role="presentation">
                  <p className="px-4 pb-1 pt-2 text-[11px] font-medium tracking-wide text-[var(--text-secondary)] uppercase">
                    {group}
                  </p>
                  <ul role="group" aria-label={group}>
                    {rows.map((item) => {
                      const index = items.indexOf(item);
                      const selected = index === active;
                      return (
                        <li key={item.id} role="option" aria-selected={selected}>
                          <button
                            type="button"
                            className={[
                              "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-[var(--motion)]",
                              selected ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--hover)]",
                            ].join(" ")}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => run(item)}
                          >
                            <span>{item.label}</span>
                            {item.hint ? (
                              <span className="truncate text-xs text-[var(--text-secondary)]">{item.hint}</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
