/**
 * Hunty — the app mascot. A yellow blob with a net, drawn inline so it can
 * change mood without loading anything.
 */
export type Mood = 'happy' | 'hunting' | 'sleepy' | 'proud'

export function Mascot({ mood = 'happy', size = 120 }: { mood?: Mood; size?: number }) {
  const eye = mood === 'sleepy' ? 'sleepy' : mood === 'proud' ? 'proud' : 'open'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={mood === 'hunting' ? 'animate-wiggle' : 'animate-bob'}
      aria-label={`Hunty the mascot, looking ${mood}`}
      role="img"
    >
      {/* net, only while hunting */}
      {mood === 'hunting' && (
        <g stroke="#16130c" strokeWidth="6" strokeLinecap="round" fill="none">
          <line x1="118" y1="118" x2="146" y2="146" />
          <circle cx="112" cy="112" r="24" fill="#dce7ff" />
          <path d="M96 106h32M96 118h32M106 96v32M118 96v32" strokeWidth="3" />
        </g>
      )}

      {/* body */}
      <path
        d="M80 16c34 0 56 22 56 52 0 34-24 60-56 60S24 102 24 68C24 38 46 16 80 16Z"
        fill="#ffd23f"
        stroke="#16130c"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* cheeks */}
      <ellipse cx="46" cy="86" rx="9" ry="6" fill="#ff6f5e" opacity=".55" />
      <ellipse cx="114" cy="86" rx="9" ry="6" fill="#ff6f5e" opacity=".55" />

      {/* eyes */}
      {eye === 'open' && (
        <>
          <circle cx="60" cy="66" r="9" fill="#16130c" />
          <circle cx="100" cy="66" r="9" fill="#16130c" />
          <circle cx="63" cy="62" r="3" fill="#fff" />
          <circle cx="103" cy="62" r="3" fill="#fff" />
        </>
      )}
      {eye === 'sleepy' && (
        <g stroke="#16130c" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M52 66q8 8 16 0" />
          <path d="M92 66q8 8 16 0" />
        </g>
      )}
      {eye === 'proud' && (
        <g stroke="#16130c" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M52 70q8-10 16 0" />
          <path d="M92 70q8-10 16 0" />
        </g>
      )}

      {/* mouth */}
      <path
        d={mood === 'sleepy' ? 'M70 92h20' : 'M64 90q16 18 32 0'}
        stroke="#16130c"
        strokeWidth="6"
        fill={mood === 'sleepy' ? 'none' : '#16130c'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* antenna */}
      <g stroke="#16130c" strokeWidth="6" strokeLinecap="round">
        <path d="M80 16V4" />
        <circle cx="80" cy="4" r="5" fill="#2f6bff" />
      </g>

      {mood === 'sleepy' && (
        <text x="126" y="42" fontSize="20" fontFamily="Fredoka, sans-serif" fill="#6b6355">
          z
        </text>
      )}
    </svg>
  )
}
