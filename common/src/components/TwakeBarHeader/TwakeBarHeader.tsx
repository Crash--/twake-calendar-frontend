import {
  SdkProvider,
  TWAKE_BAR_HEIGHT,
  TWAKE_RAIL_WIDTH,
  TwakeBar,
  TwakeRail,
  type TwakeBarFallback
} from '@linagora/twake-bar'
import { useMediaQuery, useTheme } from '@linagora/twake-mui'
import { logOut } from '@linagora/twake-oidc'
import React, { useLayoutEffect, useMemo } from 'react'
import type { RootState } from '@common/app/store'
import { useAppSelector } from '@common/app/hooks'
import { selectPlatformURL } from '@common/app/selectors/selectPlatformURL'
import { twakeSpace } from '@common/features/Embed/twakeSpace'
import { getPlatformSdk } from '@common/utils/sdkSession'
import { getUserDisplayName } from '@common/utils/userUtils'

const selectIsAppLoading = (state: RootState): boolean =>
  state.loading.isLoading

const selectUser = (state: RootState): RootState['user']['userData'] =>
  state.user.userData

const setBarHeight = (height: string | null): void => {
  if (height) {
    document.documentElement.style.setProperty('--twake-bar-height', height)
  } else {
    document.documentElement.style.removeProperty('--twake-bar-height')
  }
}

const setRailWidth = (width: string | null): void => {
  if (width) {
    document.documentElement.style.setProperty('--twake-rail-width', width)
  } else {
    document.documentElement.style.removeProperty('--twake-rail-width')
  }
}

const BAR_APP = {
  slug: 'calendar',
  name: 'Twake Calendar',
  icon: new URL('/calendar.svg', window.location.origin).href,
  textIcon: new URL('/calendar-text.svg', window.location.origin).href
}

const handleLogOut = (): void => void logOut()

/**
 * The Twake bar, pinned on top of the page in the space the body reserves,
 * once calendar's loader is gone. Rendered under the theme and i18n providers,
 * which the bar follows. Not shown when TwakeSpace frames calendar: the bar of
 * TwakeSpace is above it.
 *
 * The bar shows the platform session, which calendar signs in at load.
 * Without a platform, or when the token exchange fails, it shows calendar's
 * apps and user instead.
 *
 * With TWAKE_RAIL on, desktop and a platform, the navigation rail of the apps
 * is pinned at the left, and the bar leaves the platform menus to it.
 */
export const TwakeBarHeader = (): React.JSX.Element | null => {
  const isAppLoading = useAppSelector(selectIsAppLoading)
  const platformURL = useAppSelector(selectPlatformURL)
  const user = useAppSelector(selectUser)
  const isShown = twakeSpace === null && !isAppLoading
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const fallback = useMemo<TwakeBarFallback>(
    () => ({
      helpLink: window.SUPPORT_URL,
      apps: (window.appList ?? []).map(app => ({
        name: app.name,
        href: app.link,
        icon: app.icon
      })),
      // The user data stays empty until the user is signed in
      user: user?.email
        ? { name: getUserDisplayName(user), email: user.email }
        : undefined
    }),
    [user]
  )

  // A layout effect reserves the bar space before the paint that removes the
  // loader, so the loader leaves room for the bar at once
  useLayoutEffect(() => {
    if (!isShown) return
    setBarHeight(TWAKE_BAR_HEIGHT)
    return (): void => setBarHeight(null)
  }, [isShown])

  const sdk = isShown && platformURL ? getPlatformSdk(platformURL) : null
  const withRail = isDesktop && window.TWAKE_RAIL === true && !!sdk

  useLayoutEffect(() => {
    if (!withRail) return
    setRailWidth(TWAKE_RAIL_WIDTH)
    return (): void => setRailWidth(null)
  }, [withRail])

  if (!isShown) return null

  const bar = (
    <div id="twake-bar">
      <TwakeBar
        app={BAR_APP}
        onLogOut={handleLogOut}
        fallback={fallback}
        withMenus={!withRail}
      />
    </div>
  )

  if (!sdk) return bar

  return (
    <SdkProvider client={sdk}>
      {withRail && (
        <div id="twake-rail">
          <TwakeRail
            current="calendar"
            prerender={window.TWAKE_RAIL_PRERENDER ?? []}
            onLogOut={handleLogOut}
          />
        </div>
      )}
      {bar}
    </SdkProvider>
  )
}
