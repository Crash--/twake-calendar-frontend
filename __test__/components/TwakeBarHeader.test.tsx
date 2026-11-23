import type { JSX } from 'react'
import { TwakeBarHeader } from '@common/components/TwakeBarHeader/TwakeBarHeader'
import { setAppLoading } from '@common/app/loadingSlice'
import '@testing-library/jest-dom'
import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/Renderwithproviders'

let mockTwakeSpace: object | null = null

vi.mock('@common/features/Embed/twakeSpace', () => ({
  get twakeSpace(): object | null {
    return mockTwakeSpace
  }
}))

const mockGetPlatformSdk = vi.fn()

vi.mock('@common/utils/sdkSession', () => ({
  getPlatformSdk: (platformURL: string): unknown =>
    mockGetPlatformSdk(platformURL)
}))

const mockTwakeBar = vi.fn()
const mockTwakeRail = vi.fn()

// The bar itself is tested in its own package: only what calendar gives it
// matters here
vi.mock('@linagora/twake-bar', () => ({
  TWAKE_BAR_HEIGHT: '3rem',
  TWAKE_RAIL_WIDTH: '4rem',
  SdkProvider: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid="sdk-provider">{children}</div>
  ),
  TwakeBar: (props: unknown): JSX.Element => {
    mockTwakeBar(props)
    return <div data-testid="twake-bar" />
  },
  TwakeRail: (props: unknown): JSX.Element => {
    mockTwakeRail(props)
    return <div data-testid="twake-rail" />
  }
}))

const userData = {
  sub: 'alice',
  email: 'alice@example.com',
  family_name: 'Doe',
  given_name: 'Alice',
  name: 'Alice',
  sid: 'sid',
  workplaceFqdn: 'alice.twake.app'
}

const renderBar = ({
  isLoading = false,
  user = userData
}: { isLoading?: boolean; user?: Partial<typeof userData> } = {}): ReturnType<
  typeof renderWithProviders
> =>
  renderWithProviders(<TwakeBarHeader />, {
    user: { userData: user, tokens: { id_token: 'the-id-token' } },
    loading: { isLoading }
  })

const getBarHeight = (): string =>
  document.documentElement.style.getPropertyValue('--twake-bar-height')

const getRailWidth = (): string =>
  document.documentElement.style.getPropertyValue('--twake-rail-width')

// jsdom has no matchMedia: the small screen is the default, a desktop matches
// every min-width query
const setDesktop = (): void => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('min-width'),
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
}

describe('TwakeBarHeader', () => {
  beforeEach(() => {
    mockTwakeSpace = null
    mockGetPlatformSdk.mockReturnValue({})
    window.appList = [{ name: 'Mail', link: '/mail', icon: 'mail.svg' }]
    window.SUPPORT_URL = 'https://support.example.com'
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--twake-bar-height')
    document.documentElement.style.removeProperty('--twake-rail-width')
    delete window.TWAKE_RAIL
    // @ts-expect-error restores jsdom, which has no matchMedia
    delete window.matchMedia
    vi.clearAllMocks()
  })

  it('does nothing when TwakeSpace frames calendar', () => {
    mockTwakeSpace = {}
    renderBar()

    expect(mockGetPlatformSdk).not.toHaveBeenCalled()
    expect(screen.queryByTestId('twake-bar')).toBe(null)
    expect(getBarHeight()).toBe('')
  })

  it("shows the bar on the user's platform once calendar has loaded", () => {
    const { store } = renderBar({ isLoading: true })

    expect(screen.queryByTestId('twake-bar')).toBe(null)
    expect(getBarHeight()).toBe('')

    act(() => {
      store.dispatch(setAppLoading(false))
    })

    expect(mockGetPlatformSdk).toHaveBeenCalledWith('https://alice.twake.app')
    expect(screen.getByTestId('sdk-provider')).toContainElement(
      screen.getByTestId('twake-bar')
    )
    expect(getBarHeight()).toBe('3rem')
  })

  it("gives the bar calendar's apps, user and help link to show off the platform", () => {
    renderBar()

    expect(mockTwakeBar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        app: expect.objectContaining({ slug: 'calendar' }),
        fallback: {
          helpLink: 'https://support.example.com',
          apps: [{ name: 'Mail', href: '/mail', icon: 'mail.svg' }],
          user: { name: 'Alice Doe', email: 'alice@example.com' }
        }
      })
    )
  })

  it('shows the bar off the platform without one', () => {
    renderBar({ user: { ...userData, workplaceFqdn: undefined } })

    expect(mockGetPlatformSdk).not.toHaveBeenCalled()
    expect(screen.getByTestId('twake-bar')).toBeInTheDocument()
    expect(screen.queryByTestId('sdk-provider')).toBe(null)
    expect(getBarHeight()).toBe('3rem')
  })

  it('gives the bar no user before the user is signed in', () => {
    renderBar({ user: {} })

    expect(mockTwakeBar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fallback: expect.objectContaining({ user: undefined })
      })
    )
  })

  describe('navigation rail', () => {
    it('shows the rail beside the bar, which leaves the menus to it, on desktop with TWAKE_RAIL', () => {
      window.TWAKE_RAIL = true
      setDesktop()
      renderBar()

      expect(screen.getByTestId('sdk-provider')).toContainElement(
        screen.getByTestId('twake-rail')
      )
      expect(mockTwakeRail).toHaveBeenLastCalledWith(
        expect.objectContaining({ current: 'calendar' })
      )
      expect(mockTwakeBar).toHaveBeenLastCalledWith(
        expect.objectContaining({ withMenus: false })
      )
      expect(getRailWidth()).toBe('4rem')
    })

    it('shows no rail without TWAKE_RAIL', () => {
      setDesktop()
      renderBar()

      expect(screen.queryByTestId('twake-rail')).toBe(null)
      expect(mockTwakeBar).toHaveBeenLastCalledWith(
        expect.objectContaining({ withMenus: true })
      )
      expect(getRailWidth()).toBe('')
    })

    it('shows no rail on a small screen', () => {
      window.TWAKE_RAIL = true
      renderBar()

      expect(screen.queryByTestId('twake-rail')).toBe(null)
      expect(mockTwakeBar).toHaveBeenLastCalledWith(
        expect.objectContaining({ withMenus: true })
      )
      expect(getRailWidth()).toBe('')
    })

    it('shows no rail off the platform, where the bar keeps its menus', () => {
      window.TWAKE_RAIL = true
      setDesktop()
      renderBar({ user: { ...userData, workplaceFqdn: undefined } })

      expect(screen.queryByTestId('twake-rail')).toBe(null)
      expect(mockTwakeBar).toHaveBeenLastCalledWith(
        expect.objectContaining({ withMenus: true })
      )
    })
  })
})
