export default function ProductPreview() {
  return (
    <figure className="nx-product-preview overflow-hidden rounded-2xl border border-zinc-700/70 bg-card shadow-2xl shadow-black/30">
      <img
        src="/screenshots/journal-analytics.jpg"
        alt="Nexora journal analytics showing trade performance, an equity curve, and a drawdown chart using sample trades."
        width={2160}
        height={2520}
        fetchPriority="high"
        decoding="async"
        className="block h-auto w-full"
      />
      <figcaption className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
        Actual Nexora workspace with synthetic sample trades. Your journal shows your own results.
      </figcaption>
    </figure>
  );
}
