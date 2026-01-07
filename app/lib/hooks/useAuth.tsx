import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { showNotification } from '../notificationUtils'
import useAiStore from '../store/aiStore'

export function useAuth() {
  const { setUser, setAuthToken, setAppLoading, setIsAdmin, setApi, getApi, getAuthToken, healthCheck } = useAiStore()
  const location = useLocation()
  const hasRedirected = useRef(false)
  const isHealthChecking = useRef(false)

  const doHealthCheck = async () => {
    // Don't redirect if we're already on the api-offline page or have already redirected
    if (location.pathname === '/api-offline' || hasRedirected.current) {
      //  console.log('Health check skipped - already on api-offline page or has redirected')
      return
    }

    // Prevent multiple health checks from running simultaneously
    if (isHealthChecking.current) {
      //console.log('Health check already in progress, skipping')
      return
    }

    isHealthChecking.current = true
    //console.log('Running health check...')

    try {
      const response = await healthCheck()
      if (response?.success !== true) {
        console.log('API error detected, redirecting to api-offline')
        setAppLoading(false)
        showNotification({
          title: 'Error',
          message: 'API is not responding',
          type: 'error',
        })
        // Store the current location before redirecting
        sessionStorage.setItem('redirectedFrom', location.pathname)
        // Mark as redirected and use window.location as fallback
        hasRedirected.current = true
        window.location.href = '/api-offline'
      }
    } catch (error) {
      console.log('Health check exception:', error)
      // If health check throws an error (network failure, etc.), redirect to api-offline
      setAppLoading(false)
      showNotification({
        title: 'Error',
        message: 'API is not responding',
        type: 'error',
      })
      // Store the current location before redirecting
      sessionStorage.setItem('redirectedFrom', location.pathname)
      // Mark as redirected and use window.location as fallback
      hasRedirected.current = true
      window.location.href = '/api-offline'
    } finally {
      isHealthChecking.current = false
    }
  }

  useEffect(() => {
    // Set up Supabase auth state change listener
    setApi()
    const {
      data: { subscription },
    } = getApi().auth.onAuthStateChange((event, session) => {
      //console.log('Auth state change:', event, session)
      //do health check
      console.log('Auth state change:', event, session)
      doHealthCheck()
      if (session?.user) {
        const sessionUser = { ...session.user, access_token: session.access_token }
        console.log('Session user:', sessionUser)
        setUser(sessionUser)
        if (!getAuthToken()) {
          getUser(session.user.id, sessionUser)
        }
        // Check admin status when user is authenticated
        const isUserAdmin = session.user.app_metadata?.role === 'admin' || session.user.user_metadata?.is_admin === true
        setIsAdmin(isUserAdmin)
      } else {
        setUser(null)
        setAuthToken(null)
        setIsAdmin(false)
      }
      setAppLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getUser = async (userId: string, sessionUser: any) => {
    const { data: userInfo, error } = await getApi().from('user_profiles').select('*').eq('user_id', userId).single()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    setAuthToken(userInfo.api_key)
    setUser({ ...sessionUser, profile: userInfo })
    return userInfo
  }

  // Utility functions
  const signOut = async () => {
    try {
      const { error } = await getApi().auth.signOut({ scope: 'global' })
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const getCurrentSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await getApi().auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  return {
    signOut,
    getCurrentSession,
  }
}

export default useAuth
