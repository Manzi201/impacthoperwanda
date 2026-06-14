import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const isFetchingRef = useRef(false)

  const fetchProfile = async (userId, authUser) => {
    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const isMasterAdmin = authUser.email === 'impactadmin2026@gmail.com'

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          // Profile doesn't exist yet — create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || (isMasterAdmin ? 'Master Admin' : 'Impact Staff'),
              role: isMasterAdmin ? 'admin' : (authUser.user_metadata?.role || 'education'),
              status: 'active'
            }])
            .select()
            .single()

          if (!createError && newProfile) {
            setProfile(newProfile)
          } else {
            // Fallback in case insert also fails (e.g. RLS) 
            setProfile({
              id: userId,
              email: authUser.email,
              role: isMasterAdmin ? 'admin' : (authUser.user_metadata?.role || 'education'),
              full_name: authUser.user_metadata?.full_name || (isMasterAdmin ? 'Master Admin' : 'Staff'),
              status: 'active'
            })
          }
        } else {
          // RLS or other error — use metadata fallback
          setProfile({
            id: userId,
            email: authUser.email,
            role: isMasterAdmin ? 'admin' : (authUser.user_metadata?.role || 'education'),
            full_name: authUser.user_metadata?.full_name || (isMasterAdmin ? 'Master Admin' : 'Staff'),
            status: 'active'
          })
        }
      } else if (data) {
        // Ensure master admin always has admin role
        if (isMasterAdmin && data.role !== 'admin') {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId)
            .select()
            .single()
          setProfile(updated || data)
        } else {
          setProfile(data)
        }
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err.message)
      // Always set a fallback so loading never gets stuck
      setProfile({
        id: userId,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'education',
        full_name: authUser.user_metadata?.full_name || 'Staff',
        status: 'active'
      })
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    let initialised = false

    // 1. Get the current session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialised = true
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser)
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for future auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip the first INITIAL_SESSION event — getSession handles that
      if (!initialised) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        isFetchingRef.current = false // allow re-fetch on new sign-in
        fetchProfile(currentUser.id, currentUser)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    setProfile(null)
    setUser(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('No user') }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (data) setProfile(data)
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
