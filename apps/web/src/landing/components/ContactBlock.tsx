import { useState } from "react";

type Props = {
  heading: string;
  noteLabel?: string;
  source: string;
};

export function ContactBlock({ heading, noteLabel = "Optional note", source }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

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
        throw new Error(body.error || "Could not send.");
      }
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 bg-[var(--landing-surface)] px-5 py-24 text-[var(--landing-fg)] md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-20">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
          {(
            [
              ["name", "Name", "text", true],
              ["company", "Company", "text", true],
              ["email", "Email", "email", true],
            ] as const
          ).map(([id, label, type, required]) => (
            <label key={id} className="block">
              <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                {label}
              </span>
              <input
                name={id}
                type={type}
                required={required}
                className="mt-2 w-full border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none placeholder:text-[var(--landing-fg-soft)]"
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
              className="mt-2 w-full resize-none border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none placeholder:text-[var(--landing-fg-soft)]"
            />
          </label>
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="submit"
              disabled={status === "sending"}
              className="border-0 bg-transparent p-0 text-[14px] tracking-[0.04em] text-[var(--landing-fg)] transition-opacity duration-[var(--landing-ease)] hover:opacity-70 disabled:opacity-40"
            >
              {status === "sending" ? "Sending…" : "Send →"}
            </button>
            {status === "sent" ? (
              <p className="text-[13px] text-[var(--landing-fg-muted)]" role="status">
                Received.
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
    </section>
  );
}
