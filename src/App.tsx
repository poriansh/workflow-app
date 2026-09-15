import { useEffect } from 'react'
import { AppRoutes } from './app/routes/index.tsx'
import { ErrorBoundary } from './app/providers/errorBoundary.tsx'
import { useThemeStore } from './shared/hooks/darkmode/useThemeStore.ts'

function App() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default App
