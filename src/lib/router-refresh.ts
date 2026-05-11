/**
 * Next.js App Router: `router.push()` returns void. Calling `router.refresh()` in the same
 * tick often runs before navigation finishes, so the wrong segment gets invalidated.
 * Defer refresh until after the next paint so lists/charts refetch on the destination route.
 */
export type AppRouterLike = {
  push: (href: string) => void
  refresh: () => void
}

export function refreshServerComponents(router: Pick<AppRouterLike, 'refresh'>) {
  router.refresh()
}

export function pushHrefThenRefreshServer(router: AppRouterLike, href: string) {
  router.push(href)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      router.refresh()
    })
  })
}
