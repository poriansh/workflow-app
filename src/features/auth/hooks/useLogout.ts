import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout, sessionQueryKey } from '../services/authService.ts'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: sessionQueryKey })
    },
  })
}
