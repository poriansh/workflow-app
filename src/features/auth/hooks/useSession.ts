import { useQuery } from '@tanstack/react-query'

import { getSession, sessionQueryKey } from '../services/authService.ts'
import { hasAccessToken } from '@/shared/lib/tokenStorage.ts'

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    enabled: hasAccessToken(),
    retry: false,
  })
}
