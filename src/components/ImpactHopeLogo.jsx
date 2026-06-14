/**
 * Impact Hope Rwanda Logo Component
 * Orange stamp-style logo matching brand identity
 */
const ImpactHopeLogo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer ring */}
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="7" fill="none" strokeDasharray="210 80" strokeDashoffset="-5" strokeLinecap="round" />
    {/* Inner ring */}
    <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="5" fill="none" strokeDasharray="155 65" strokeDashoffset="-5" strokeLinecap="round" />
    {/* IH text */}
    <text
      x="50"
      y="57"
      textAnchor="middle"
      fill="currentColor"
      fontSize="20"
      fontWeight="900"
      fontFamily="Outfit, Inter, sans-serif"
      letterSpacing="-1"
    >
      IH
    </text>
  </svg>
)

export default ImpactHopeLogo
