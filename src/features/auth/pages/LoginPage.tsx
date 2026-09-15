import { Button } from '@/shared/ui/button'
import { FlowBackground } from '../components/FlowBackground.tsx'
import { LoginForm } from '../components/LoginForm.tsx'
import { useLogout } from '../hooks/useLogout.ts'
import { useSession } from '../hooks/useSession.ts'
import { ThemeToggle } from '@/shared/components/ToggleThem/ThemeToggle.tsx'


export default function LoginPage() {
  const session = useSession()
  const logout = useLogout()

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <FlowBackground />
      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <p className="text-sm font-medium text-foreground-muted">جینیوس</p>
        <ThemeToggle />
      </header>

      <main className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-md flex-col justify-center px-6 pb-16 text-center">
        {session.isFetching && !session.data ? (
          <p className="text-sm text-foreground-muted" role="status">
            در حال بررسی نشست…
          </p>
        ) : session.data ? (
          <section className="login-enter flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">وارد شده‌اید</h1>
              <p className="text-sm leading-7 text-foreground-muted">نشست شما ذخیره شده است.</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{session.data.displayName}</p>
              {session.data.email ? (
                <p className="text-sm text-foreground-muted" dir="ltr">
                  {session.data.email}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full border-0 bg-surface shadow-none hover:bg-surface-hover"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? 'در حال خروج…' : 'خروج'}
            </Button>
          </section>
        ) : (
          <section className="login-enter flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">ورود</h1>
              <p className="text-sm leading-7 text-foreground-muted">
                برای ادامه، ایمیل و رمز عبور سازمان را وارد کنید.
              </p>
            </div>
            <LoginForm />
          </section>
        )}
      </main>
    </div>
  )
}
