import React from 'react'
import Image from 'next/image'

interface HealthwyzLogoProps {
  width?: number
  height?: number
  className?: string
  showText?: boolean
  /** Use white text (for dark / navy backgrounds). */
  light?: boolean
}

const HealthwyzLogo: React.FC<HealthwyzLogoProps> = ({
  width = 200,
  height = 60,
  className = "",
  showText = true,
  light = false,
}) => {
  // Font size determines the visual height of text
  const fontSize = Math.max(height * 0.4, 16)
  // Icon should match the text line height (roughly 1.2x font size)
  const iconSize = Math.round(fontSize * 3)

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ width }}>
      <Image
        src="/images/logo-icon.png"
        alt="MediWyz"
        width={iconSize}
        height={iconSize}
        className="object-contain flex-shrink-0"
        priority
      />
      {showText && (
        <span
          style={{ fontSize, letterSpacing: '-0.5px', lineHeight: 1 }}
          className={`font-bold whitespace-nowrap ${light ? 'text-white' : 'text-brand-navy'}`}
        >
          MediWyz
        </span>
      )}
    </div>
  )
}

export default HealthwyzLogo
