"use client";

export function Spotlight({ rect }: { rect: DOMRect | null }) {
  if (!rect) return <div className="absolute inset-0 bg-black/60" />;
  const pad = 8;
  const clip = `polygon(
    0 0, 0 100%, 100% 100%, 100% 0,
    0 0,
    ${rect.left - pad}px ${rect.top - pad}px,
    ${rect.left - pad}px ${rect.bottom + pad}px,
    ${rect.right + pad}px ${rect.bottom + pad}px,
    ${rect.right + pad}px ${rect.top - pad}px,
    ${rect.left - pad}px ${rect.top - pad}px
  )`;
  return (
    <>
      <div className="absolute inset-0 bg-black/60" style={{ clipPath: clip }} />
      <div
        className="absolute pointer-events-none rounded ring-2 ring-paper"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />
    </>
  );
}
