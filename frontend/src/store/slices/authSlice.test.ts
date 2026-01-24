import authReducer, { setCredentials, logout, setLoading } from './authSlice'

// Helper pour créer un state propre sans toucher au vrai localStorage du navigateur
const createInitialState = () => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
})

describe('authSlice reducer', () => {
  beforeEach(() => {
    // Nettoyer localStorage entre les tests
    localStorage.clear()
  })

  it('should handle initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' })
    expect(state.isLoading).toBe(false)
  })

  it('should set credentials and mark as authenticated', () => {
    const state = createInitialState()
    const user = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'STUDENT' }

    const nextState = authReducer(
      state as any,
      setCredentials({ user, accessToken: 'access-token', refreshToken: 'refresh-token' })
    )

    expect(nextState.user).toEqual(user)
    expect(nextState.accessToken).toBe('access-token')
    expect(nextState.refreshToken).toBe('refresh-token')
    expect(nextState.isAuthenticated).toBe(true)
  })

  it('should handle logout', () => {
    const user = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'STUDENT' }
    const loggedInState = {
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isLoading: false,
      isAuthenticated: true,
    }

    const nextState = authReducer(loggedInState as any, logout())

    expect(nextState.user).toBeNull()
    expect(nextState.accessToken).toBeNull()
    expect(nextState.refreshToken).toBeNull()
    expect(nextState.isAuthenticated).toBe(false)
  })

  it('should set loading flag', () => {
    const state = createInitialState()
    const nextState = authReducer(state as any, setLoading(true))
    expect(nextState.isLoading).toBe(true)
  })
})
