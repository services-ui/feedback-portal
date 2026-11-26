import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Sparkles } from './Sparkles'
import { EMOJI_LEVELS } from '../data/feedback'
import { EASE_OUT } from '../lib/motion'
import type { Rating, RatingVariant } from '../types'

interface Props {
  value: Rating | null
  onChange: (r: Rating) => void
  variant: RatingVariant
  labelledBy: string
}

/**
 * Per-mood face. Index 0 is "not rated yet" — a calm, blinking face waiting for input.
 * Mouth paths all share one command structure (M … Q …) so Motion can morph between them.
 */
const MOODS = [
  { bg: '#EEF2F8', glow: '#C9D3E3', ink: '#8A94A6', eyeW: 24, eyeH: 24, eyeR: 999, brow: 0, browO: 0, browY: 0, mouth: 'M40 36 Q50 36 60 36', blush: 0, shine: 0 },
  { bg: '#FFE1DB', glow: '#FF9E8C', ink: '#7A1F12', eyeW: 22, eyeH: 22, eyeR: 999, brow: 24, browO: 1, browY: 6, mouth: 'M22 48 Q50 14 78 48', blush: 0, shine: 0 },
  { bg: '#FFE9D2', glow: '#FFB677', ink: '#7A3A0B', eyeW: 24, eyeH: 19, eyeR: 999, brow: -16, browO: 1, browY: 0, mouth: 'M26 42 Q50 26 74 42', blush: 0, shine: 0 },
  { bg: '#FFF3CF', glow: '#F5CF63', ink: '#6B4E0A', eyeW: 30, eyeH: 11, eyeR: 6, brow: 0, browO: 0.0, browY: 0, mouth: 'M28 36 Q50 36 72 36', blush: 0, shine: 0 },
  { bg: '#DAF1FA', glow: '#7FD3F2', ink: '#0B4A63', eyeW: 26, eyeH: 26, eyeR: 999, brow: 0, browO: 0, browY: 0, mouth: 'M24 30 Q50 54 76 30', blush: 0.55, shine: 1 },
  { bg: '#DCE7FF', glow: '#7FA8FF', ink: '#0A2E73', eyeW: 32, eyeH: 32, eyeR: 999, brow: 0, browO: 0, browY: 0, mouth: 'M16 26 Q50 72 84 26', blush: 0.85, shine: 1 },
] as const

const LABELS = ['Slide to rate', ...EMOJI_LEVELS.map((l) => l.label)]
const SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const
const THUMB = 60

export function MoodSlider({ value, onChange, variant, labelledBy }: Props) {
  const reduce = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<Rating | null>(null)
  const [burst, setBurst] = useState(0)
  const [touched, setTouched] = useState(value !== null)
  const pointerId = useRef<number | null>(null)
  const moved = useRef(false)
  const startX = useRef(0)

  const x = useMotionValue(0)
  const xVelocity = useVelocity(x)
  const widthRef = useRef(0)
  useLayoutEffect(() => {
    widthRef.current = width
    x.set(x.get()) // re-run the fill transform with the new width
  }, [width, x])
  const fill = useTransform(x, (v) => (widthRef.current ? Math.min(1, Math.max(0, v / widthRef.current)) : 0))
  // Squash/tilt the thumb a touch with drag speed — it feels like it has mass.
  const tilt = useTransform(xVelocity, [-1600, 0, 1600], [-14, 0, 14])

  const shown = (dragging ? preview : value) ?? 0
  const mood = MOODS[shown]
  const level = shown ? EMOJI_LEVELS[shown - 1] : null
  const stopX = (r: Rating) => ((r - 1) / 4) * width

  // Measure the track (responsive) and keep the thumb on its stop.
  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (dragging) return
    const target = value ? stopX(value) : width / 2
    animate(x, target, reduce ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.25, velocity: xVelocity.get() })
  }, [value, width, dragging]) // eslint-disable-line

  const nearest = (px: number) => (Math.round((Math.min(Math.max(px, 0), width) / width) * 4) + 1) as Rating

  const tick = () => {
    try {
      navigator.vibrate?.(6)
    } catch {
      /* unsupported */
    }
  }

  const commit = (r: Rating) => {
    setTouched(true)
    onChange(r)
    setBurst((b) => b + 1)
    tick()
  }

  const localX = (e: PointerEvent) => e.clientX - (trackRef.current?.getBoundingClientRect().left ?? 0)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!width || (e.pointerType === 'mouse' && e.button !== 0)) return
    pointerId.current = e.pointerId
    moved.current = false
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
    const px = localX(e)
    x.stop()
    x.set(Math.min(Math.max(px, 0), width)) // jump to finger — the thumb *is* the finger now
    setPreview(nearest(px))
    setDragging(true)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    if (Math.abs(e.clientX - startX.current) > 3) moved.current = true
    const px = localX(e)
    // 1:1 inside the track, rubber-band beyond the ends.
    const over = px < 0 ? px : px > width ? px - width : 0
    x.set(Math.min(Math.max(px, 0), width) + over * 0.2)
    const n = nearest(px)
    if (n !== preview) {
      setPreview(n)
      tick()
    }
  }

  const end = (e: PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    const n = cancelled ? value : nearest(localX(e))
    setDragging(false)
    setPreview(null)
    if (n) commit(n)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }
    let next: number | null = null
    if (e.key in keys) next = value ? value + keys[e.key] : 3
    if (e.key === 'Home') next = 1
    if (e.key === 'End') next = 5
    if (next === null) return
    e.preventDefault()
    commit(Math.min(5, Math.max(1, next)) as Rating)
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-[26px] px-4 pt-6 pb-3 sm:rounded-[28px] sm:px-8 sm:pt-8 sm:pb-5"
      initial={false}
      animate={{ backgroundColor: mood.bg }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      {/* Mood glow behind the face */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[-30%] left-1/2 h-[120%] w-[120%] -translate-x-1/2 rounded-full"
        initial={false}
        animate={{ background: `radial-gradient(closest-side, ${mood.glow}88, ${mood.glow}00)` }}
        transition={{ duration: 0.5 }}
      />

      {/* ── The face ── */}
      <div aria-hidden className="relative mx-auto flex h-[116px] w-[200px] flex-col items-center justify-center min-[400px]:h-[126px] sm:h-[170px]">
        <div className="flex items-end gap-10 sm:gap-12">
          {[-1, 1].map((side) => (
            <div key={side} className="relative flex flex-col items-center">
              {/* Brow */}
              <motion.span
                className="absolute -top-4 block h-[6px] w-8 rounded-full"
                initial={false}
                animate={{
                  backgroundColor: mood.ink,
                  opacity: mood.browO,
                  rotate: side * -mood.brow,
                  y: mood.browY,
                }}
                transition={SPRING}
              />
              {/* Eye — outer blinks, inner morphs */}
              <motion.span
                className="grid h-8 place-items-center"
                animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }}
                transition={{ duration: 3.6, times: [0, 0.92, 0.96, 1], repeat: Infinity, delay: side > 0 ? 0.02 : 0 }}
              >
                <motion.span
                  className="relative block"
                  initial={false}
                  animate={{
                    width: mood.eyeW,
                    height: mood.eyeH,
                    borderRadius: mood.eyeR,
                    backgroundColor: mood.ink,
                    x: shown === 0 && !reduce ? [0, -5, -5, 5, 5, 0] : 0,
                    y: shown === 0 && !reduce ? [0, 3, 3, 3, 3, 0] : 0,
                  }}
                  transition={{
                    ...SPRING,
                    x: shown === 0 ? { duration: 4.2, times: [0, 0.12, 0.4, 0.52, 0.8, 0.92], repeat: Infinity, ease: 'easeInOut' } : SPRING,
                    y: shown === 0 ? { duration: 4.2, times: [0, 0.12, 0.4, 0.52, 0.8, 0.92], repeat: Infinity, ease: 'easeInOut' } : SPRING,
                  }}
                >
                  <motion.span
                    className="absolute top-[18%] right-[18%] h-[30%] w-[30%] rounded-full bg-white"
                    initial={false}
                    animate={{ opacity: mood.shine, scale: mood.shine ? 1 : 0.4 }}
                    transition={SPRING}
                  />
                </motion.span>
              </motion.span>
            </div>
          ))}
        </div>

        <div className="relative mt-1.5 h-[58px] w-[108px] sm:mt-2 sm:h-[72px] sm:w-[130px]">
          {/* Blush */}
          {[-1, 1].map((side) => (
            <motion.span
              key={side}
              className="absolute top-1 h-4 w-7 rounded-full bg-[#FF7A93]"
              style={{ [side < 0 ? 'left' : 'right']: -8 }}
              initial={false}
              animate={{ opacity: mood.blush * 0.55, scale: mood.blush ? 1 : 0.6 }}
              transition={SPRING}
            />
          ))}
          <svg viewBox="0 0 100 72" className="h-full w-full overflow-visible">
            <motion.path
              fill="none"
              strokeWidth={9}
              strokeLinecap="round"
              initial={false}
              animate={{ d: mood.mouth, stroke: mood.ink }}
              transition={SPRING}
            />
          </svg>
        </div>
      </div>

      {/* ── Big sliding label ── */}
      <div className="relative h-10 overflow-hidden sm:mt-1 sm:h-12" aria-hidden>
        <motion.div
          className="flex h-full"
          initial={false}
          animate={{ x: `${-shown * 100}%` }}
          transition={SPRING}
        >
          {LABELS.map((label, i) => (
            <div key={label} className="flex h-full w-full shrink-0 items-center justify-center">
              <span
                className={
                  i === 0
                    ? 'text-[15px] font-medium tracking-wide text-hush'
                    : 'font-display text-[26px] leading-none font-semibold tracking-[-0.02em] whitespace-nowrap min-[390px]:text-[29px] sm:text-[38px]'
                }
                style={i ? { color: EMOJI_LEVELS[i - 1].tone } : undefined}
              >
                {i === 0 ? (touched ? label : 'Drag the slider or tap a face') : label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Track ── */}
      <div className="relative mt-2 px-[22px] sm:mt-5 sm:pb-1">
        <div
          ref={trackRef}
          className="relative h-[64px] cursor-pointer touch-pan-y select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => end(e)}
          onPointerCancel={(e) => end(e, true)}
        >
          {/* Rail + fill */}
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgb(11_21_38/0.08)]" />
          <motion.div
            className="absolute inset-x-0 top-1/2 h-2 origin-left -translate-y-1/2 rounded-full"
            style={{ scaleX: fill }}
            initial={false}
            animate={{ backgroundColor: level?.tone ?? '#C9D3E3', opacity: shown ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Stops (tappable faces) */}
          {EMOJI_LEVELS.map((l, i) => {
            const active = shown === l.value
            return (
              <button
                key={l.value}
                type="button"
                tabIndex={-1}
                aria-label={l.label}
                // Pointer taps are handled by the track; this covers screen-reader activation.
                onClick={(e) => e.detail === 0 && commit(l.value)}
                className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={{ left: `${i * 25}%` }}
              >
                <span
                  className={`emoji-glyph grid h-9 w-9 place-items-center rounded-full bg-white text-[20px] shadow-[0_1px_3px_rgb(11_21_38/0.12)] transition-[opacity,filter,transform] duration-200 ${
                    active ? 'scale-75 opacity-0' : shown ? 'opacity-80 grayscale-[0.5]' : 'opacity-100'
                  }`}
                >
                  {l.emoji}
                </span>
              </button>
            )
          })}

          {/* Thumb */}
          <motion.div
            role="slider"
            tabIndex={0}
            aria-labelledby={labelledBy}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={value ?? undefined}
            aria-valuetext={value ? EMOJI_LEVELS[value - 1].label : 'Not rated yet'}
            onKeyDown={onKeyDown}
            // Pointer input goes to the track underneath (it owns the gesture); keyboard focus lands here.
            className="pointer-events-none absolute top-1/2 left-0 z-10 rounded-full outline-offset-4"
            style={{ x, marginLeft: -THUMB / 2, marginTop: -THUMB / 2 }}
          >
            <motion.span
              className="emoji-glyph relative grid place-items-center rounded-full bg-white text-[32px]"
              style={{ width: THUMB, height: THUMB, rotate: reduce ? 0 : tilt }}
              initial={false}
              animate={{
                scale: dragging ? 1.12 : value ? 1 : 0.86,
                opacity: shown ? 1 : 0.0,
                boxShadow: level
                  ? `0 0 0 3px ${level.tone}, 0 12px 28px -8px ${level.tone}aa`
                  : '0 0 0 2px #C9D3E3, 0 8px 20px -10px rgb(11 21 38 / 0.3)',
              }}
              transition={SPRING}
            >
              {level?.emoji}
              {value && burst > 0 && !reduce && !dragging && (
                <Sparkles key={burst} tone={EMOJI_LEVELS[value - 1].tone} variant={variant} />
              )}
            </motion.span>
          </motion.div>

          {/* Untouched: a ghost thumb + hand nudging the user to actually choose */}
          {!touched && !dragging && <Nudge reduce={!!reduce} />}
        </div>
      </div>
    </motion.div>
  )
}

function Nudge({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      <motion.span
        className="absolute top-1/2 left-1/2 block h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand/40 bg-white/40"
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.9, 0.5, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="emoji-glyph absolute top-3 left-0 block text-[28px] drop-shadow-sm"
        initial={{ x: 0, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { x: [0, 46, -46, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, delay: 1, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
      >
        👆
      </motion.span>
    </div>
  )
}
