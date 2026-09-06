import { Button } from "@/landing/components/Button";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  eyebrow?: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  secondaryLine?: string;
  trustLine: string;
  imageSrc: string;
  imageAlt: string;
};

export function HeroSection({
  eyebrow,
  headline,
  subcopy,
  ctaLabel,
  ctaHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  secondaryLine,
  trustLine,
  imageSrc,
  imageAlt,
}: Props) {
  const reduce = useReducedMotion();
  const lines = headline.split("\n");

  return (
    <section className="relative min-h-dvh w-full overflow-hidden text-[var(--landing-fg)]">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[rgba(8,8,8,0.56)]" aria-hidden />
      <div className="relative z-10 flex min-h-dvh flex-col justify-end px-5 pb-10 pt-28 md:px-10 md:pb-12">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-4 text-[12px] tracking-[0.14em] text-[var(--landing-fg-soft)] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="whitespace-pre-line text-[clamp(2.6rem,6.5vw,5.25rem)] leading-[1.0] font-medium tracking-[-0.035em]">
            {lines.map((line, index) => (
              <motion.span
                key={`${line}-${index}`}
                className="block"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: reduce ? 0 : index * 0.08, ease: [0.25, 1, 0.5, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="mt-5 max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-fg-muted)] md:text-[16px]"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: reduce ? 0 : 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            {subcopy}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: reduce ? 0 : 0.32, ease: [0.25, 1, 0.5, 1] }}
          >
            <Button href={ctaHref} variant="primary" tone="dark" size="lg">
              {ctaLabel}
            </Button>
            {ctaSecondaryLabel && ctaSecondaryHref ? (
              <Button href={ctaSecondaryHref} variant="ghost" tone="dark">
                {ctaSecondaryLabel}
              </Button>
            ) : null}
          </motion.div>
          {secondaryLine ? (
            <motion.p
              className="mt-4 text-[13px] tracking-[0.02em] text-[var(--landing-fg-soft)]"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.42, delay: reduce ? 0 : 0.48, ease: [0.25, 1, 0.5, 1] }}
            >
              {secondaryLine}
            </motion.p>
          ) : null}
        </div>
        <p className="mt-16 max-w-2xl text-[12px] tracking-[0.04em] text-[var(--landing-fg-soft)] md:mt-20">
          {trustLine}
        </p>
      </div>
    </section>
  );
}
