import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

import { PageFrame } from '../layouts/pageFrame.tsx'
import { Button } from '@/shared/ui/button'

function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <PageFrame>
      <section className="flex flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">مشکلی پیش آمد</h1>

          <p className="text-sm leading-7 text-foreground-muted">
            این صفحه درست نمایش داده نشد. لطفاً دوباره تلاش کنید.
          </p>
        </div>

        <Button
          type="button"
          className="h-11 w-full shadow-none"
          onClick={resetErrorBoundary}
        >
          تلاش دوباره
        </Button>
      </section>
    </PageFrame>
  )
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  )
}