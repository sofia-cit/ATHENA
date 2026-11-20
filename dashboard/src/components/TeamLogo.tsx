import type { Team } from '../types'
import { oscurecer, textoSobre } from '../lib/color'

interface Props {
  team: Pick<Team, 'abbr' | 'colores'>
  size?: number
  className?: string
}

/** Badge/logo SVG estilizado con los colores primarios del equipo. */
export default function TeamLogo({ team, size = 64, className }: Props) {
  const { primary, secondary } = team.colores
  const fg = textoSobre(primary)
  const gradId = `g-${team.abbr}`
  const stripeId = `s-${team.abbr}`
  const oscuro = oscurecer(primary, 0.28)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Logo ${team.abbr}`}
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={oscuro} />
        </linearGradient>
        <clipPath id={stripeId}>
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${stripeId})`}>
        <rect width="64" height="64" fill={`url(#${gradId})`} />
        {/* banda diagonal de acento */}
        <polygon points="-10,52 74,2 74,18 -10,68" fill={secondary} opacity="0.85" />
        <polygon points="-10,58 74,8 74,12 -10,62" fill={oscuro} opacity="0.35" />
        <rect width="64" height="64" rx="14" fill="none" stroke={secondary} strokeWidth="2" opacity="0.5" />
      </g>
      <text
        x="32"
        y="34"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Inter', system-ui, sans-serif"
        fontWeight="800"
        fontSize={team.abbr.length > 2 ? 19 : 23}
        fill={fg}
        style={{ letterSpacing: '0.5px' }}
      >
        {team.abbr}
      </text>
    </svg>
  )
}
