import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, sessionQueryKey } from '../services/authService.ts'
import type { LoginValues } from '../schemas/LoginSchema.ts'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: LoginValues) => login(values.email, values.password),
    onSuccess: (account) => {
      queryClient.setQueryData(sessionQueryKey, account)
    },
  })
}
