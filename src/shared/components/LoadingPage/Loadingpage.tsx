import { PageFrame } from '@/app/layouts/pageFrame'

export function LoadingPage() {
  return (
    <PageFrame>
      <div
        className="flex w-full items-center justify-center"
        role="status"
        aria-label="در حال بارگذاری"
      >
        <span
          className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground-muted motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    </PageFrame>
  )
}
