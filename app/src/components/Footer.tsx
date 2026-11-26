export function Footer({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <footer className="relative px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[11.5px] leading-relaxed text-hush">
      {showTagline && (
        <p className="font-display text-[12.5px] text-slate italic">Let’s build a fitter financial future together</p>
      )}
      <p className="mt-0.5 tracking-wide">© {new Date().getFullYear()} Fintness Finserv Pvt. Ltd.</p>
    </footer>
  )
}
