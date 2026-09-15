import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('ایمیل معتبر وارد کنید.'),
  password: z.string().min(1, 'رمز عبور را وارد کنید.'),
})

export type LoginValues = z.infer<typeof loginSchema>
