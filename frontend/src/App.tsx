import React, { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import PublicLayout from './components/layout/PublicLayout'
import Home from './pages/Public/Home'
import ArticlesList from './pages/Public/ArticlesList'
import ArticleDetail from './pages/Public/ArticleDetail'

// Lazy loading des pages
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))
const Login = React.lazy(() => import('./pages/Auth/Login'))
const Register = React.lazy(() => import('./pages/Auth/Register'))
const Classroom = React.lazy(() => import('./pages/Classroom/Classroom'))
const ClassroomDetail = React.lazy(() => import('./pages/Classroom/ClassroomDetail'))
const Documents = React.lazy(() => import('./pages/Documents/Documents'))
const Profile = React.lazy(() => import('./pages/Profile/Profile'))
const Admin = React.lazy(() => import('./pages/Admin/Admin'))
const Messages = React.lazy(() => import('./pages/Messages/Messages'))
const UsersAdmin = React.lazy(() => import('./pages/Admin/Users'))
const MyArticles = React.lazy(() => import('./pages/Articles/MyArticles'))
const ArticlesDashboardList = React.lazy(() => import('./pages/Articles/ArticlesDashboardList'))
const ArticlesGallery = React.lazy(() => import('./pages/Articles/ArticlesGallery'))
const ArticleCommentsModeration = React.lazy(() => import('./pages/Admin/ArticleCommentsModeration'))
const CommentsManagement = React.lazy(() => import('./pages/Admin/CommentsManagement'))
const Settings = React.lazy(() => import('./pages/Admin/Settings'))

const ProtectedRoute = ({ children, roles }: { 
  children: React.ReactNode
  roles?: string[]
}) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Empêche l'accès aux pages d'auth pour un utilisateur déjà connecté
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Site public */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="articles" element={<ArticlesList />} />
          <Route path="articles/:slug" element={<ArticleDetail />} />
        </Route>

        {/* Auth */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="classrooms" element={<Classroom />} />
          <Route path="classroom/:id" element={<ClassroomDetail />} />
          <Route path="documents" element={<Documents />} />
          <Route path="messages" element={<Messages />} />
          <Route path="articles" element={<ArticlesDashboardList />} />
          <Route path="articles/new" element={<MyArticles />} />
          <Route path="articles/gallery" element={
            <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
              <ArticlesGallery />
            </ProtectedRoute>
          } />
          <Route path="articles/:slug/edit" element={<MyArticles />} />
          <Route path="users" element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersAdmin />
            </ProtectedRoute>
          } />
          <Route path="comments-moderation" element={
            <ProtectedRoute roles={['ADMIN']}>
              <ArticleCommentsModeration />
            </ProtectedRoute>
          } />
          <Route path="comments-management" element={
            <ProtectedRoute roles={['ADMIN']}>
              <CommentsManagement />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<Profile />} />
          <Route 
            path="admin/*" 
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
