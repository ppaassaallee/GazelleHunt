import { ContactBlock } from "@/landing/components/ContactBlock";
import { FooterMinimal } from "@/landing/components/FooterMinimal";
import { FourColumnList } from "@/landing/components/FourColumnList";
import { HeroSection } from "@/landing/components/HeroSection";
import { PlaybookCards } from "@/landing/components/PlaybookCards";
import { SectionIntro } from "@/landing/components/SectionIntro";
import { TopNav } from "@/landing/components/TopNav";
import type { LandingCopy } from "@/landing/copy";
import { GAZELLE_APP_URL } from "@/landing/copy";

type Props = {
  copy: LandingCopy;
};

export function LandingShell({ copy }: Props) {
  const brandHome =
    copy.brand === "meikapen" ? "/" : copy.brand === "recupero" ? "/recupero" : "/gazellehunt";

  return (
    <div className="bg-white text-[var(--landing-ink)]">
      <div className="relative">
        <TopNav brandLabel={copy.brandLabel} brandHomeHref={brandHome} mode={copy.navMode} />
        <HeroSection
          eyebrow={copy.heroEyebrow}
          headline={copy.headline}
          subcopy={copy.subcopy}
          ctaLabel={copy.ctaLabel}
          ctaHref={copy.ctaHref}
          trustLine={copy.trustLine}
          imageSrc={copy.heroImage}
          imageAlt=""
        />
      </div>

      <SectionIntro id="about" heading={copy.aboutHeading} body={copy.aboutBody} />
      <FourColumnList groups={copy.columns} />

      {copy.playbooksHeading && copy.playbooks ? (
        <PlaybookCards heading={copy.playbooksHeading} cards={copy.playbooks} />
      ) : null}

      {copy.featureHeading && copy.featureBody ? (
        <SectionIntro heading={copy.featureHeading} body={copy.featureBody} />
      ) : null}

      {copy.brand === "gazellehunt" ? (
        <section className="px-5 pb-8 md:px-10">
          <div className="mx-auto max-w-6xl">
            <a
              href={GAZELLE_APP_URL}
              className="inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
            >
              Enter Gazelle Hunt →
            </a>
          </div>
        </section>
      ) : null}

      {copy.brand === "recupero" ? (
        <section className="px-5 pb-8 md:px-10">
          <div className="mx-auto max-w-6xl">
            <a
              href="/ryvo/"
              className="inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
            >
              Talk to us about collections →
            </a>
          </div>
        </section>
      ) : null}

      <ContactBlock
        heading={copy.contactHeading}
        noteLabel={copy.contactNoteLabel}
        source={copy.brand}
      />
      <FooterMinimal />
    </div>
  );
}
