import { Link } from 'react-router'
import { PageFrame } from '../../../app/layouts/pageFrame.tsx'
import { Button } from '@/shared/ui/button'

export default function NotFoundPage() {
  return (
    <PageFrame>
      <section className="login-enter flex flex-col gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">صفحه پیدا نشد</h1>
          <p className="text-sm leading-7 text-foreground-muted">
            این نشانی در جینیوس وجود ندارد.
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="h-11 w-full border-0 bg-surface shadow-none hover:bg-surface-hover"
        >
          <Link to="/">بازگشت به صفحه اصلی </Link>
        </Button>
      </section>
    </PageFrame>
  )
}
