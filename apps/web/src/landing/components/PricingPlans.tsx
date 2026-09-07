import { Button } from "@/landing/components/Button";
import type { PricingPlan } from "@/landing/copy";

type Monthly = {
  title: string;
  price: string;
};

type Props = {
  heading: string;
  plans: PricingPlan[];
  monthlyHeading: string;
  monthly: Monthly[];
  monthlyCtaLabel: string;
  monthlyCtaHref: string;
  eyebrow?: string;
  intro?: string;
  footnote?: string;
};

export function PricingPlans({
  heading,
  plans,
  monthlyHeading,
  monthly,
  monthlyCtaLabel,
  monthlyCtaHref,
  eyebrow = "Precios mensuales",
  intro = "Elige el plan que se ajusta a tu operación. Pagas mes a mes. Sin permanencia.",
  footnote,
}: Props) {
  return (
    <section
      id="precios"
      className="scroll-mt-24 bg-[var(--landing-surface)] px-5 py-24 text-[var(--landing-fg)] md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] tracking-[0.18em] text-[var(--landing-fg-soft)] uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl whitespace-pre-line text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-fg-muted)]">
          {intro}
        </p>

        <ul className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {plans.map((plan) => {
            const featured = Boolean(plan.featured);
            return (
              <li
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 md:p-8 ${
                  featured
                    ? "border-[var(--landing-fg)] bg-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "border-[rgba(255,255,255,0.16)] bg-transparent"
                }`}
              >
                {plan.badge ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-[var(--brand-accent)] px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-white uppercase">
                    {plan.badge}
                  </span>
                ) : null}
                <p className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                  {plan.name}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <p className="text-[clamp(2.25rem,4.5vw,3.25rem)] leading-none font-medium tracking-[-0.05em]">
                    {plan.price}
                  </p>
                </div>
                {plan.priceNote ? (
                  <p className="mt-2 text-[13px] text-[var(--landing-fg-muted)]">{plan.priceNote}</p>
                ) : (
                  <p className="mt-2 text-[13px] text-transparent select-none">.</p>
                )}
                <ul className="mt-8 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-[14px] leading-snug text-[var(--landing-fg-muted)]"
                    >
                      <span
                        aria-hidden
                        className={`mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full ${
                          featured ? "bg-[var(--brand-accent)]" : "bg-[var(--landing-fg-soft)]"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Button
                    href={plan.ctaHref}
                    variant={featured ? "primary" : "secondary"}
                    tone="dark"
                    className="w-full"
                  >
                    {plan.ctaLabel}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        {footnote ? (
          <p className="mt-6 text-[12px] text-[var(--landing-fg-soft)]">{footnote}</p>
        ) : null}

        <div className="mt-20 rounded-2xl border border-[rgba(255,255,255,0.16)] px-7 py-10 md:px-10">
          <h3 className="text-[20px] font-medium tracking-[-0.02em]">{monthlyHeading}</h3>
          <ul className={`mt-8 grid gap-8 ${monthly.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {monthly.map((item) => (
              <li key={item.title} className="border-t border-[rgba(255,255,255,0.14)] pt-5">
                <p className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                  {item.title}
                </p>
                <p className="mt-3 text-[18px] font-medium">{item.price}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button href={monthlyCtaHref} variant="ghost" tone="dark">
              {monthlyCtaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
