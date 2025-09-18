jest.mock('expo-linking', () => ({
  parse: jest.fn(),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}))

const Linking = require('expo-linking') as typeof import('expo-linking')
const { router } = require('expo-router') as typeof import('expo-router')
const { handleDeepLink } = require('../deeplinks') as typeof import('../deeplinks')

const parseMock = Linking.parse as ReturnType<typeof jest.fn>
const pushMock = router.push as ReturnType<typeof jest.fn>

describe('handleDeepLink', () => {
  beforeEach(() => {
    parseMock.mockReset()
    pushMock.mockReset()
  })

  it('envía al curso correcto cuando el anfitrión es course', () => {
    parseMock.mockReturnValue({ hostname: 'course', path: '/42' })

    handleDeepLink('bodhi://course/42')

    expect(pushMock).toHaveBeenCalledWith('/courses/42')
  })

  it('envía a la lección cuando el anfitrión es lesson', () => {
    parseMock.mockReturnValue({ hostname: 'lesson', path: '/abc' })

    handleDeepLink('bodhi://lesson/abc')

    expect(pushMock).toHaveBeenCalledWith('/courses/1/lesson/abc')
  })

  it('dirige al éxito del checkout', () => {
    parseMock.mockReturnValue({ hostname: 'checkout', path: '/success' })

    handleDeepLink('bodhi://checkout/success')

    expect(pushMock).toHaveBeenCalledWith('/paywall/success')
  })

  it('dirige a la cancelación del checkout', () => {
    parseMock.mockReturnValue({ hostname: 'checkout', path: '/cancel' })

    handleDeepLink('bodhi://checkout/cancel')

    expect(pushMock).toHaveBeenCalledWith('/(tabs)/membership')
  })

  it('redirige a la raíz en el caso por defecto', () => {
    parseMock.mockReturnValue({ hostname: 'unknown', path: undefined })

    handleDeepLink('bodhi://unknown')

    expect(pushMock).toHaveBeenCalledWith('/')
  })
})
