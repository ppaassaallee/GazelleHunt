import type { ColumnGroup } from "@/landing/copy";

type Props = {
  groups: ColumnGroup[];
};

export function FourColumnList({ groups }: Props) {
  return (
    <section className="border-y border-[var(--landing-rule)] px-5 py-20 md:px-10 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] tracking-[0.18em] text-[var(--landing-ink-muted)] uppercase">
              {group.title}
            </p>
            <ul className="mt-5 space-y-3">
              {group.items.map((item) => (
                <li key={item} className="text-[15px] leading-snug text-[var(--landing-ink)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
