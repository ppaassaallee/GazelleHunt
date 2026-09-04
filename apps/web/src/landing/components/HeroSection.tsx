import { TrustLine } from "@/landing/components/TrustLine";

type Props = {
  eyebrow?: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  ctaHref: string;
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
  trustLine,
  imageSrc,
  imageAlt,
}: Props) {
  return (
    <section className="relative min-h-dvh w-full overflow-hidden text-[var(--landing-fg)]">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[rgba(8,8,8,0.48)]" aria-hidden />
      <div className="relative z-10 flex min-h-dvh flex-col justify-end px-5 pb-10 pt-28 md:px-10 md:pb-12">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-4 text-[12px] tracking-[0.14em] text-[var(--landing-fg-soft)] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[clamp(2.4rem,6vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.035em]">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--landing-fg-muted)] md:text-[16px]">
            {subcopy}
          </p>
          <a
            href={ctaHref}
            className="mt-8 inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-fg)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-75"
          >
            {ctaLabel}
          </a>
        </div>
        <TrustLine>{trustLine}</TrustLine>
      </div>
    </section>
  );
}
