import { motion, useReducedMotion } from "motion/react";

type RecuperaCard = {
  label: string;
  detail: string;
  tone: "ok" | "warn" | "muted" | "accent";
};

type GazelleStat = {
  label: string;
  value: string;
};

const RECUPERA_CARDS: RecuperaCard[] = [
  { label: "Pagó", detail: "Q1,250 · portal", tone: "ok" },
  { label: "Prometió", detail: "Viernes · WhatsApp", tone: "accent" },
  { label: "Necesita ayuda", detail: "Escuchar · Rocío", tone: "warn" },
  { label: "Escalado", detail: "Sale del automático", tone: "muted" },
];

const GAZELLE_STATS: GazelleStat[] = [
  { label: "Invitados", value: "128" },
  { label: "Abrieron", value: "91" },
  { label: "Completaron", value: "64" },
  { label: "Sin respuesta", value: "17" },
];

function toneDot(tone: RecuperaCard["tone"]) {
  if (tone === "ok") return "bg-emerald-400";
  if (tone === "warn") return "bg-amber-400";
  if (tone === "accent") return "bg-[var(--brand-accent)]";
  return "bg-white/35";
}

export function HeroProductStage({ brand }: { brand: "recupero" | "gazellehunt" }) {
  const reduce = useReducedMotion();

  if (brand === "recupero") {
    return (
      <div className="landing-product-stage" aria-hidden>
        <div className="landing-product-stage__frame">
          <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Hoy</p>
          <p className="mt-2 text-[28px] leading-none font-medium tracking-[-0.04em] text-white">
            18 cuentas
          </p>
          <p className="mt-2 text-[13px] text-white/55">en seguimiento</p>
          <ul className="mt-6 space-y-2.5">
            {RECUPERA_CARDS.map((card, index) => (
              <motion.li
                key={card.label}
                className="landing-product-card"
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: reduce ? 0 : 0.35 + index * 0.07,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-sm ${toneDot(card.tone)}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-white">{card.label}</span>
                  <span className="block text-[12px] text-white/50">{card.detail}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-product-stage" aria-hidden>
      <div className="landing-product-stage__frame">
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Lista · Atención</p>
        <p className="mt-2 text-[28px] leading-none font-medium tracking-[-0.04em] text-white">
          Progreso
        </p>
        <p className="mt-2 text-[13px] text-white/55">esta semana</p>
        <ul className="mt-7 grid grid-cols-2 gap-3">
          {GAZELLE_STATS.map((stat, index) => (
            <motion.li
              key={stat.label}
              className="landing-product-stat"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: reduce ? 0 : 0.35 + index * 0.07,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
              <span className="block text-[11px] tracking-[0.12em] text-white/45 uppercase">
                {stat.label}
              </span>
              <span className="mt-2 block text-[26px] leading-none font-medium tracking-[-0.04em] text-white">
                {stat.value}
              </span>
            </motion.li>
          ))}
        </ul>
        <div className="landing-product-toast mt-5">
          <span className="h-8 w-8 shrink-0 rounded-md bg-[var(--brand-accent)]/25 text-center text-[13px] leading-8 text-white">
            ✓
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-white">Reporte listo</span>
            <span className="block text-[12px] text-white/50">Evaluación completada</span>
          </span>
        </div>
      </div>
    </div>
  );
}
