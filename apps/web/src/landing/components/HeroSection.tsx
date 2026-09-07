import type { ReactNode } from "react";
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
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: string;
  children?: ReactNode;
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
  imageAlt = "",
  imagePosition = "center",
  children,
}: Props) {
  const reduce = useReducedMotion();
  const lines = headline.split("\n");
  const hasImage = Boolean(imageSrc);

  return (
    <section className="landing-hero relative min-h-dvh w-full overflow-hidden text-[var(--landing-fg)]">
      {hasImage ? (
        <>
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: imagePosition }}
            fetchPriority="high"
            width={1920}
            height={1080}
          />
          <div className="landing-hero__veil absolute inset-0" aria-hidden />
          <div className="landing-hero__fade absolute inset-x-0 bottom-0 h-[55%]" aria-hidden />
        </>
      ) : (
        <div className="landing-hero__solid absolute inset-0" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-end px-5 pt-28 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:justify-center md:px-10 md:pt-32 md:pb-16">
        <div
          className={`grid items-end gap-10 md:items-center ${
            children ? "md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 lg:gap-16" : ""
          }`}
        >
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="mb-4 text-[12px] tracking-[0.14em] text-[var(--landing-fg-soft)] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="whitespace-pre-line text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] font-medium tracking-[-0.04em]">
              {lines.map((line, index) => (
                <motion.span
                  key={`${line}-${index}`}
                  className="block"
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: reduce ? 0 : index * 0.08,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  {line}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="mt-6 max-w-[var(--landing-measure)] text-[16px] leading-relaxed text-[var(--landing-fg-muted)] md:text-[17px]"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: reduce ? 0 : 0.2, ease: [0.25, 1, 0.5, 1] }}
            >
              {subcopy}
            </motion.p>
            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
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
            <p className="mt-10 max-w-xl text-[12px] tracking-[0.04em] text-[var(--landing-fg-soft)] md:mt-12">
              {trustLine}
            </p>
          </div>

          {children ? (
            <motion.div
              className="landing-hero__stage w-full"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.28, ease: [0.25, 1, 0.5, 1] }}
            >
              {children}
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
