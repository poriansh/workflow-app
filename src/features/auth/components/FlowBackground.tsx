 function FlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="h-full w-full text-connection/25 max-md:opacity-40" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
          <path className="flow-path" d="M-40 180 C 180 120, 260 260, 480 220 S 820 80, 1240 160" />
          <path className="flow-path" style={{ animationDelay: '-11s' }} d="M-20 420 C 220 360, 340 520, 560 470 S 900 340, 1260 430" />
          <path className="flow-path hidden md:block" style={{ animationDelay: '-19s' }} d="M80 720 C 260 640, 420 700, 640 620 S 980 540, 1180 600" />
        </g>
      </svg>
    </div>
    )
}

export default FlowBackground;