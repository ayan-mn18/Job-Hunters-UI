const pieces = ['🎉', '⭐', '🟡', '🎊', '💛', '✨', '🔵', '🟨']

/** Cheap emoji confetti. Purely decorative, so it is hidden from screen readers. */
export function Confetti({ count = 28 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="animate-fall absolute top-[-40px] text-2xl"
          style={{
            left: `${(i * 97) % 100}%`,
            animationDelay: `${(i % 10) * 0.14}s`,
            animationDuration: `${2.4 + ((i * 7) % 15) / 10}s`,
          }}
        >
          {pieces[i % pieces.length]}
        </span>
      ))}
    </div>
  )
}
