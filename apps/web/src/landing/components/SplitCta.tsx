import { useState } from "react";
import { Button } from "@/landing/components/Button";

type Props = {
  startHeading: string;
  startLine: string;
  startCtaLabel: string;
  startHref: string;
  contactHeading: string;
  contactLine: string;
  noteLabel: string;
  source: string;
  locale?: "en" | "es";
};

export function SplitCta({
  startHeading,
  startLine,
  startCtaLabel,
  startHref,
  contactHeading,
  contactLine,
  noteLabel,
  source,
  locale = "es",
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const labels =
    locale === "es"
      ? { name: "Nombre", company: "Empresa", email: "Email", send: "Enviar", sending: "Enviando…", received: "Recibido.", fail: "No se pudo enviar." }
      : { name: "Name", company: "Company", email: "Email", send: "Send", sending: "Sending…", received: "Received.", fail: "Could not send." };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          company: String(data.get("company") || ""),
          email: String(data.get("email") || ""),
          note: String(data.get("note") || ""),
          source,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || labels.fail);
      }
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : labels.fail);
    }
  }

  return (
    <section id="contacto" className="scroll-mt-24 bg-[var(--landing-surface)] px-5 py-24 text-[var(--landing-fg)] md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:gap-20">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
            {startHeading}
          </h2>
          <p className="mt-5 text-[15px] text-[var(--landing-fg-muted)]">{startLine}</p>
          <div className="mt-10">
            <Button href={startHref} variant="primary" tone="dark" size="lg">
              {startCtaLabel}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.15] font-medium tracking-[-0.03em]">
            {contactHeading}
          </h2>
          <p className="mt-4 text-[14px] text-[var(--landing-fg-muted)]">{contactLine}</p>
          <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-5">
            {(
              [
                ["name", labels.name, "text"],
                ["company", labels.company, "text"],
                ["email", labels.email, "email"],
              ] as const
            ).map(([id, label, type]) => (
              <label key={id} className="block">
                <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                  {label}
                </span>
                <input
                  name={id}
                  type={type}
                  required
                  className="mt-2 w-full border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                {noteLabel}
              </span>
              <textarea
                name="note"
                rows={3}
                className="mt-2 w-full resize-none border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none"
              />
            </label>
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button type="submit" variant="secondary" tone="dark" disabled={status === "sending"}>
                {status === "sending" ? labels.sending : labels.send}
              </Button>
              {status === "sent" ? (
                <p className="text-[13px] text-[var(--landing-fg-muted)]" role="status">
                  {labels.received}
                </p>
              ) : null}
              {status === "error" ? (
                <p className="text-[13px] text-[#ffb4a8]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
