import type { ReactNode } from 'react'
import FlowBackground from '@/features/auth/components/FlowBackground'
import { ThemeToggle } from '@/shared/components/ToggleThem/ThemeToggle.tsx'

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FlowBackground />
      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <p className="text-sm font-medium text-foreground-muted">جینیوس</p>
        <ThemeToggle />
      </header>
      <main className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-md flex-col justify-center px-6 pb-16">
        {children}
      </main>
    </div>
  )
}
