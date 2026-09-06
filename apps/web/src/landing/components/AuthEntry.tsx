import { Button } from "@/landing/components/Button";

type Props = {
  heading: string;
  body: string;
  loginLabel: string;
  loginHref: string;
  signupLabel: string;
  signupHref: string;
};

export function AuthEntry({
  heading,
  body,
  loginLabel,
  loginHref,
  signupLabel,
  signupHref,
}: Props) {
  return (
    <section id="cuenta" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-end md:gap-16">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
            {heading}
          </h2>
          <p className="mt-5 max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
            {body}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end md:flex-col md:items-start">
          <Button href={signupHref} variant="primary" tone="light">
            {signupLabel}
          </Button>
          <Button href={loginHref} variant="ghost" tone="light">
            {loginLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
