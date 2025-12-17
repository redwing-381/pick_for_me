import React from 'react'

interface GridBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function GridBackground({ children, className = '' }: GridBackgroundProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Grid lines background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
