import { useThemeStore } from '@/shared/hooks/darkmode/useThemeStore.ts'

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isDark = theme === 'dark'
  const label = isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex cursor-pointer size-10 items-center justify-center rounded-full text-foreground-muted transition-colors duration-200 hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none motion-safe:active:scale-95"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 1.75v1.5M9 14.75v1.5M1.75 9h1.5M14.75 9h1.5M3.4 3.4l1.06 1.06M13.54 13.54l1.06 1.06M14.6 3.4l-1.06 1.06M4.46 13.54l-1.06 1.06"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M14.5 11.2A5.75 5.75 0 0 1 6.8 3.5 5.75 5.75 0 1 0 14.5 11.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
