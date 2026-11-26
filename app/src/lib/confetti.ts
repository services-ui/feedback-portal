/**
 * Tiny canvas confetti — one shared fixed canvas, one rAF loop that only runs while
 * particles are alive. ~100 particles, DPR capped at 2, so it stays smooth on mid-range Android.
 */
const COLORS = ['#0066FF', '#00B2FF', '#15355C', '#7FB8FF', '#FFC53D', '#FF8FA3']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  w: number
  h: number
  color: string
  shape: 0 | 1
  life: number
  wobble: number
}

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let raf = 0
let last = 0

function ensureCanvas() {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '60',
  })
  document.body.appendChild(canvas)
  ctx = canvas.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
}

function resize() {
  if (!canvas || !ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.floor(window.innerWidth * dpr)
  canvas.height = Math.floor(window.innerHeight * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function tick(now: number) {
  if (!ctx || !canvas) return
  const dt = Math.min((now - last) / 16.67, 2.5)
  last = now
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40)
  for (const p of particles) {
    p.vy += 0.16 * dt
    p.vx *= Math.pow(0.985, dt)
    p.vy *= Math.pow(0.985, dt)
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vr * dt
    p.wobble += 0.12 * dt
    p.life -= dt
    const alpha = Math.min(1, p.life / 30)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.scale(1, Math.cos(p.wobble))
    ctx.fillStyle = p.color
    if (p.shape === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    else {
      ctx.beginPath()
      ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  if (particles.length) raf = requestAnimationFrame(tick)
  else {
    raf = 0
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }
}

export interface ConfettiOptions {
  x: number
  y: number
  count?: number
  spread?: number // radians
  power?: number
  angle?: number // radians, -PI/2 = up
}

export function fireConfetti({ x, y, count = 90, spread = Math.PI * 0.9, power = 11, angle = -Math.PI / 2 }: ConfettiOptions) {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  ensureCanvas()
  const small = window.innerWidth < 640
  const n = small ? Math.round(count * 0.75) : count
  for (let i = 0; i < n; i++) {
    const a = angle + (Math.random() - 0.5) * spread
    const v = power * (0.45 + Math.random() * 0.75)
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 5,
      h: 4 + Math.random() * 4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() > 0.3 ? 0 : 1,
      life: 120 + Math.random() * 60,
      wobble: Math.random() * Math.PI,
    })
  }
  if (!raf) {
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
}
