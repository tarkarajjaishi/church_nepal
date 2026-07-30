'use client'

import { useQuery } from '@tanstack/react-query'
import { rolesApi, allows } from './api'

/**
 * What the signed-in user may do.
 *
 * Used to hide navigation and buttons the user cannot use — so they are not
 * offered a page that will refuse them. It is **not** a security control: the
 * server checks the same permission on every request, and it is the only
 * thing standing between a volunteer and the giving records.
 *
 * While loading, `can()` answers false. Hiding something briefly is a flicker;
 * showing it briefly is a promise the next click breaks.
 */
export function useAccess() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-access'],
    queryFn: rolesApi.myAccess,
    // Permissions change rarely and a stale answer only affects what is shown,
    // never what is allowed.
    staleTime: 60_000,
  })

  return {
    access: data,
    isLoading,
    error,
    can: (permission: string) => (data ? allows(data.permissions, permission) : false),
    /** True for a token with no user row behind it — the dev/seed path. */
    unmanaged: data?.unmanaged ?? false,
  }
}
