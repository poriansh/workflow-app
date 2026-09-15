import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useLogin } from '../hooks/useLogin.ts'
import { loginSchema, type LoginValues } from '../schemas/LoginSchema.ts'
import { loginErrorMessage } from '../services/authService.ts'

const fieldClassName =
  'h-11 border-0 bg-surface shadow-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-focus/40'

export function LoginForm() {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form
      className="flex flex-col gap-6 text-center"
      noValidate
      onSubmit={handleSubmit((values) => {
        login.mutate(values)
      })}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">ایمیل</Label>
        <Input
          id="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          spellCheck={false}
          className={`${fieldClassName} text-center`}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email?.message ? (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input
          id="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          className={`${fieldClassName} text-center`}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password?.message ? (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {login.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {loginErrorMessage(login.error)}
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full shadow-none transition-transform motion-safe:active:scale-[0.99]"
        disabled={login.isPending}
        aria-busy={login.isPending}
      >
        {login.isPending ? 'در حال ورود…' : 'ورود'}
      </Button>
    </form>
  )
}
