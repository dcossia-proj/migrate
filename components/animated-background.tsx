"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Particle system for flowing elements
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      width: number
      height: number
      opacity: number
      color: string
      life: number
      maxLife: number
    }> = []

    // Greyscale color palette
    const colors = [
      "rgba(156, 163, 175, 0.3)", // gray-400
      "rgba(107, 114, 128, 0.25)", // gray-500
      "rgba(75, 85, 99, 0.3)", // gray-600
      "rgba(55, 65, 81, 0.25)", // gray-700
      "rgba(209, 213, 219, 0.2)", // gray-300
      "rgba(229, 231, 235, 0.25)", // gray-200
      "rgba(243, 244, 246, 0.2)", // gray-100
      "rgba(156, 163, 175, 0.35)", // silver-ish
    ]

    // Create initial particles
    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        width: Math.random() * 8 + 4, // Pill width
        height: Math.random() * 3 + 2, // Pill height
        opacity: Math.random() * 0.2 + 0.15, // Fixed opacity between 0.15-0.35
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 500 + 300,
      }
    }

    // Initialize particles
    for (let i = 0; i < 80; i++) {
      particles.push(createParticle())
    }

    // Animation loop
    const animate = () => {
      // Clear canvas with subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#111827")
      gradient.addColorStop(0.5, "#1f2937")
      gradient.addColorStop(1, "#000000")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        // Add subtle drift
        particle.vx += (Math.random() - 0.5) * 0.005
        particle.vy += (Math.random() - 0.5) * 0.005

        // Limit velocity
        particle.vx = Math.max(-0.5, Math.min(0.5, particle.vx))
        particle.vy = Math.max(-0.5, Math.min(0.5, particle.vy))

        // Wrap around edges
        if (particle.x < -particle.width) particle.x = canvas.width + particle.width
        if (particle.x > canvas.width + particle.width) particle.x = -particle.width
        if (particle.y < -particle.height) particle.y = canvas.height + particle.height
        if (particle.y > canvas.height + particle.height) particle.y = -particle.height

        // Use constant opacity - no breathing or fading
        const currentOpacity = particle.opacity

        // Draw pill-shaped particle with glow effect
        ctx.save()
        ctx.globalAlpha = currentOpacity

        // Outer glow (pill shape)
        const glowRadius = Math.max(particle.width, particle.height) * 1.5
        ctx.beginPath()
        ctx.roundRect(
          particle.x - particle.width / 2 - glowRadius / 4,
          particle.y - particle.height / 2 - glowRadius / 4,
          particle.width + glowRadius / 2,
          particle.height + glowRadius / 2,
          Math.min(particle.width, particle.height) * 2,
        )
        const glowGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glowRadius)
        glowGradient.addColorStop(0, particle.color)
        glowGradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = glowGradient
        ctx.fill()

        // Inner pill particle
        ctx.beginPath()
        ctx.roundRect(
          particle.x - particle.width / 2,
          particle.y - particle.height / 2,
          particle.width,
          particle.height,
          Math.min(particle.width, particle.height) / 2,
        )
        ctx.fillStyle = particle.color
        ctx.fill()

        ctx.restore()

        // Remove dead particles and create new ones
        if (particle.life >= particle.maxLife) {
          particles[index] = createParticle()
        }
      })

      // Draw connecting lines between nearby particles
      ctx.save()
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 80) {
            const opacity = (1 - distance / 80) * 0.05
            ctx.globalAlpha = opacity
            ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
            ctx.lineWidth = 0.3
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
          }
        })
      })
      ctx.restore()

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <>
      {/* Canvas for dynamic particles */}
      <canvas ref={canvasRef} className="fixed inset-0 -z-10" style={{ background: "transparent" }} />

      {/* Additional CSS-based flowing elements for layered effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {/* Flowing ribbon elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/20 to-transparent transform -skew-y-12 animate-flow-1"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/15 to-transparent transform skew-y-8 animate-flow-2"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/10 to-transparent transform -skew-y-6 animate-flow-3"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/20 to-transparent transform skew-y-4 animate-flow-4"></div>
        </div>

        {/* Subtle overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
      </div>

      <style jsx>{`
        @keyframes flow-1 {
          0%, 100% { transform: translateX(-100%) skewY(-12deg) scaleY(0.6); }
          50% { transform: translateX(100%) skewY(-12deg) scaleY(1.4); }
        }
        @keyframes flow-2 {
          0%, 100% { transform: translateX(100%) skewY(8deg) scaleY(1.2); }
          50% { transform: translateX(-100%) skewY(8deg) scaleY(0.8); }
        }
        @keyframes flow-3 {
          0%, 100% { transform: translateX(-50%) skewY(-6deg) scaleY(0.9); }
          50% { transform: translateX(50%) skewY(-6deg) scaleY(1.1); }
        }
        @keyframes flow-4 {
          0%, 100% { transform: translateX(75%) skewY(4deg) scaleY(1.3); }
          50% { transform: translateX(-75%) skewY(4deg) scaleY(0.7); }
        }

        .animate-flow-1 { animation: flow-1 25s ease-in-out infinite; }
        .animate-flow-2 { animation: flow-2 30s ease-in-out infinite reverse; }
        .animate-flow-3 { animation: flow-3 35s ease-in-out infinite; }
        .animate-flow-4 { animation: flow-4 40s ease-in-out infinite reverse; }
      `}</style>
    </>
  )
}
