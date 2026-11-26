import type { CSSProperties } from 'react'

type Vars = CSSProperties & Record<`--${string}`, string>

/**
 * Lightweight ambient layer: three soft radial-gradient fields drifting on transform,
 * a faint dot grid, and a handful of outlined shapes floating slowly.
 * No filter/backdrop blur — everything stays compositor-only. Frozen under reduced motion (CSS).
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cloud">
      <div
        className="ambient-blob -top-[18%] -left-[22%] h-[70vmax] w-[70vmax]"
        style={
          {
            background: 'radial-gradient(closest-side, rgb(0 102 255 / 0.16), rgb(0 102 255 / 0) 72%)',
            '--dur': '30s',
            '--dx': '6%',
            '--dy': '4%',
          } as Vars
        }
      />
      <div
        className="ambient-blob -right-[24%] top-[18%] h-[62vmax] w-[62vmax]"
        style={
          {
            background: 'radial-gradient(closest-side, rgb(0 178 255 / 0.14), rgb(0 178 255 / 0) 72%)',
            '--dur': '36s',
            '--dx': '-5%',
            '--dy': '-6%',
          } as Vars
        }
      />
      <div
        className="ambient-blob -bottom-[30%] left-[10%] h-[60vmax] w-[60vmax]"
        style={
          {
            background: 'radial-gradient(closest-side, rgb(0 102 255 / 0.07), rgb(0 102 255 / 0) 70%)',
            '--dur': '42s',
            '--dx': '4%',
            '--dy': '-4%',
          } as Vars
        }
      />

      {/* Dot grid, faded toward the edges */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(rgb(21 53 92 / 0.10) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 75%)',
        }}
      />

      {/* Floating abstract shapes */}
      <Shape className="right-[6%] top-[2.5%] sm:right-auto sm:left-[7%] sm:top-[14%]" vars={{ '--dur': '16s', '--fx': '14px', '--fy': '-22px', '--fr': '24deg' }}>
        <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </Shape>
      <Shape className="right-[9%] top-[10%] hidden sm:block" vars={{ '--dur': '19s', '--fx': '-12px', '--fy': '18px', '--fr': '-30deg', '--delay': '-4s' }}>
        <rect x="8" y="8" width="24" height="24" rx="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </Shape>
      <Shape className="right-[14%] bottom-[18%] hidden sm:block" vars={{ '--dur': '14s', '--fx': '10px', '--fy': '-16px', '--fr': '45deg', '--delay': '-7s' }}>
        <path d="M20 10v20M10 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </Shape>
      <Shape className="left-[12%] bottom-[12%] hidden md:block" vars={{ '--dur': '22s', '--fx': '-16px', '--fy': '-20px', '--fr': '-18deg', '--delay': '-2s' }}>
        <path d="M20 8 L31 30 H9 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </Shape>
      <Shape className="left-[46%] top-[6%] hidden lg:block" vars={{ '--dur': '18s', '--fx': '8px', '--fy': '20px', '--fr': '12deg', '--delay': '-9s' }}>
        <circle cx="20" cy="20" r="5" fill="currentColor" />
      </Shape>
    </div>
  )
}

function Shape({ className, vars, children }: { className: string; vars: Record<string, string>; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`float-shape h-9 w-9 text-brand/[0.12] sm:h-11 sm:w-11 sm:text-brand/25 ${className}`}
      style={vars as Vars}
    >
      {children}
    </svg>
  )
}
