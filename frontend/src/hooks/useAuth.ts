import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import { setCredentials, logout as logoutAction, setLoading } from '../store/slices/authSlice'
import api from '../services/api'

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user, isLoading, isAuthenticated, accessToken } = useSelector(
    (state: RootState) => state.auth
  )

  const login = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true))
      console.log('Tentative de connexion:', { email })
      const response = await api.post('/auth/login', { email, password })
      console.log('Réponse:', response.data)
      const { user, accessToken, refreshToken } = response.data.data
      dispatch(setCredentials({ user, accessToken, refreshToken }))
      navigate('/')
      return { success: true }
    } catch (error: any) {
      console.error('Erreur login:', error)
      console.error('Response data:', error.response?.data)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion' 
      }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: string
  }) => {
    try {
      dispatch(setLoading(true))
      await api.post('/auth/register', data)
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur d\'inscription' 
      }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const logout = () => {
    dispatch(logoutAction())
    navigate('/login')
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    accessToken,
    login,
    register,
    logout,
  }
}
