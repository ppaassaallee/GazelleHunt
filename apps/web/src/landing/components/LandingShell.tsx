import { AuthEntry } from "@/landing/components/AuthEntry";
import { ContactBlock } from "@/landing/components/ContactBlock";
import { FooterMinimal } from "@/landing/components/FooterMinimal";
import { FourColumnList } from "@/landing/components/FourColumnList";
import { HeroProductStage } from "@/landing/components/HeroProductStage";
import { HeroSection } from "@/landing/components/HeroSection";
import { HowItWorks } from "@/landing/components/HowItWorks";
import { PlaybookCards } from "@/landing/components/PlaybookCards";
import { PortfolioBlock } from "@/landing/components/PortfolioBlock";
import { PricingPlans } from "@/landing/components/PricingPlans";
import { ProofStrip } from "@/landing/components/ProofStrip";
import { Reveal } from "@/landing/components/Reveal";
import { RocioBlock } from "@/landing/components/RocioBlock";
import { SectionIntro } from "@/landing/components/SectionIntro";
import { SplitCta } from "@/landing/components/SplitCta";
import { StageTimeline } from "@/landing/components/StageTimeline";
import { TopNav } from "@/landing/components/TopNav";
import { UseCases } from "@/landing/components/UseCases";
import type { LandingCopy } from "@/landing/copy";

type Props = {
  copy: LandingCopy;
};

function authProps(copy: LandingCopy) {
  if (!copy.authLoginHref || !copy.authSignupHref) return undefined;
  return {
    loginLabel: copy.authLoginLabel || "Sign in",
    loginHref: copy.authLoginHref,
    signupLabel: copy.authSignupLabel || "Sign up",
    signupHref: copy.authSignupHref,
  };
}

export function LandingShell({ copy }: Props) {
  const brandHome =
    copy.brand === "meikapen" ? "/" : copy.brand === "recupero" ? "/recupero" : "/gazellehunt";
  const auth = authProps(copy);
  const showAboutColumns = Boolean(copy.showAboutColumns);
  const showAuthEntry = Boolean(copy.showAuthEntry && copy.authHeading && copy.authBody && auth);
  const stages =
    copy.journeyStages?.map((stage) => ({
      label: stage.label,
      title: stage.title,
      bubble: stage.bubble || stage.title,
      channel: stage.channel,
    })) || [];
  const showTimeline = Boolean(copy.journeyHeading && copy.journeyBody && stages.length);
  const heroProduct =
    copy.brand === "recupero" || copy.brand === "gazellehunt" ? copy.brand : null;

  const footerLinks = [...(copy.footerLinks || [])];
  const hasCuenta = footerLinks.some((l) => l.href === "#cuenta" || l.href.includes("auth=login"));
  if (auth && !hasCuenta) {
    footerLinks.unshift({ href: "#cuenta", label: "Cuenta" });
  }

  const howBlock =
    copy.howHeading && copy.howSteps ? (
      <Reveal>
        <HowItWorks heading={copy.howHeading} steps={copy.howSteps} />
      </Reveal>
    ) : null;

  const timelineBlock = showTimeline ? (
    <StageTimeline
      heading={copy.journeyHeading!}
      body={copy.journeyBody!}
      stages={stages}
      goalLabel={copy.journeyGoalLabel}
    />
  ) : null;

  return (
    <div className="bg-white text-[var(--landing-ink)]" data-brand={copy.brand}>
      <div className="relative">
        <TopNav
          brandLabel={copy.brandLabel}
          brandHomeHref={brandHome}
          mode={copy.navMode}
          links={copy.navLinks}
          auth={auth}
        />
        <HeroSection
          eyebrow={copy.heroEyebrow}
          headline={copy.headline}
          subcopy={copy.subcopy}
          ctaLabel={copy.ctaLabel}
          ctaHref={copy.ctaHref}
          ctaSecondaryLabel={copy.ctaSecondaryLabel}
          ctaSecondaryHref={copy.ctaSecondaryHref}
          secondaryLine={copy.heroSecondaryLine}
          trustLine={copy.trustLine}
          imageSrc={copy.heroImage}
          imageAlt=""
        >
          {heroProduct ? <HeroProductStage brand={heroProduct} /> : null}
        </HeroSection>
      </div>

      {copy.playbooksHeading && copy.playbooks ? (
        <PlaybookCards heading={copy.playbooksHeading} cards={copy.playbooks} />
      ) : null}

      {/* Recupera: timeline is the brand differentiator — second section */}
      {copy.brand === "recupero" ? (
        <>
          {timelineBlock}
          {howBlock}
        </>
      ) : (
        <>
          {howBlock}
          {timelineBlock}
        </>
      )}

      {copy.featureHeading && copy.featureBody && copy.featurePoints && copy.brand === "recupero" ? (
        <RocioBlock
          heading={copy.featureHeading}
          body={copy.featureBody}
          points={copy.featurePoints}
          ctaLabel={copy.featureCtaLabel || "Ver precios"}
          ctaHref={copy.featureCtaHref || "#precios"}
        />
      ) : null}

      {copy.featureHeading && copy.featureBody && copy.brand !== "recupero" && !copy.featurePoints ? (
        <SectionIntro heading={copy.featureHeading} body={copy.featureBody} />
      ) : null}

      {copy.featureHeading && copy.featureBody && copy.featurePoints && copy.brand !== "recupero" ? (
        <section className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
          <Reveal className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-20">
            <div>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
                {copy.featureHeading}
              </h2>
              <div className="mt-8 space-y-5">
                {copy.featureBody.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-ink-muted)]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <ul className="flex flex-col justify-end gap-6 border-t border-[var(--landing-rule)] pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
              {copy.featurePoints.map((point) => (
                <li key={point} className="text-[22px] font-medium tracking-[-0.02em]">
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      {copy.proofStates?.length ? (
        <ProofStrip
          heading={copy.proofHeading}
          states={copy.proofStates}
          controlLine={copy.proofControlLine}
          reverseLine={copy.proofReverseLine}
        />
      ) : null}

      {copy.pricingHeading &&
      copy.pricingPlans &&
      copy.pricingMonthlyHeading &&
      copy.pricingMonthly &&
      copy.pricingMonthlyCtaLabel &&
      copy.pricingMonthlyCtaHref ? (
        <PricingPlans
          heading={copy.pricingHeading}
          plans={copy.pricingPlans}
          monthlyHeading={copy.pricingMonthlyHeading}
          monthly={copy.pricingMonthly}
          monthlyCtaLabel={copy.pricingMonthlyCtaLabel}
          monthlyCtaHref={copy.pricingMonthlyCtaHref}
          eyebrow={copy.pricingEyebrow}
          intro={copy.pricingIntro}
          footnote={copy.pricingFootnote}
        />
      ) : null}

      {copy.useCasesHeading && copy.useCasesSupporting && copy.useCases ? (
        <UseCases
          heading={copy.useCasesHeading}
          supporting={copy.useCasesSupporting}
          cases={copy.useCases}
        />
      ) : null}

      {copy.portfolioHeading &&
      copy.portfolioBody &&
      copy.portfolioColumns &&
      copy.portfolioCtaLabel &&
      copy.portfolioCtaHref ? (
        <PortfolioBlock
          heading={copy.portfolioHeading}
          body={copy.portfolioBody}
          columns={copy.portfolioColumns}
          ctaLabel={copy.portfolioCtaLabel}
          ctaHref={copy.portfolioCtaHref}
        />
      ) : null}

      {showAboutColumns ? (
        <>
          <SectionIntro id="about" heading={copy.aboutHeading} body={copy.aboutBody} />
          <FourColumnList groups={copy.columns} />
        </>
      ) : null}

      {showAuthEntry && auth ? (
        <AuthEntry
          heading={copy.authHeading!}
          body={copy.authBody!}
          loginLabel={auth.loginLabel}
          loginHref={auth.loginHref}
          signupLabel={auth.signupLabel}
          signupHref={auth.signupHref}
        />
      ) : null}

      {copy.splitStartHeading &&
      copy.splitStartLine &&
      copy.splitStartCtaLabel &&
      copy.splitStartHref &&
      copy.splitContactHeading &&
      copy.splitContactLine ? (
        <SplitCta
          startHeading={copy.splitStartHeading}
          startLine={copy.splitStartLine}
          startCtaLabel={copy.splitStartCtaLabel}
          startHref={copy.splitStartHref}
          contactHeading={copy.splitContactHeading}
          contactLine={copy.splitContactLine}
          noteLabel={copy.contactNoteLabel || "Nota opcional / volumen"}
          source={copy.brand}
          locale={copy.formLocale || "es"}
        />
      ) : (
        <ContactBlock
          heading={copy.contactHeading}
          noteLabel={copy.contactNoteLabel}
          source={copy.brand}
        />
      )}

      <FooterMinimal
        brand={copy.footerBrand}
        tagline={copy.footerTagline}
        links={footerLinks}
        accountId={auth ? "cuenta" : undefined}
        accountHref={auth?.signupHref}
        accountLabel={auth?.signupLabel}
      />
    </div>
  );
}
