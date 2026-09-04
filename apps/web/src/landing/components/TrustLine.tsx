type Props = {
  children: string;
};

export function TrustLine({ children }: Props) {
  return (
    <p className="mt-16 max-w-2xl text-[12px] tracking-[0.04em] text-[var(--landing-fg-soft)] md:mt-20">
      {children}
    </p>
  );
}
