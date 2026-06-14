import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'warning': return AlertCircle
    case 'error': return AlertCircle
    default: return Info
  }
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000 / 60)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return date.toLocaleDateString()
}

export const useNotifications = () => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_read', false)          // Only show unread
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data.map(n => ({
        ...n,
        icon: getIcon(n.type),
        time: formatTime(n.created_at)
      })))
    }
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id) return

    fetchNotifications()

    // Listen for mark-as-read event from Header
    const handleRead = () => setNotifications([])
    window.addEventListener('notifications-read', handleRead)

    // Real-time new notifications
    const sub = supabase
      .channel(`user-notifs-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, payload => {
        setNotifications(prev => [{
          ...payload.new,
          icon: getIcon(payload.new.type),
          time: 'Just now'
        }, ...prev])
      })
      .subscribe()

    return () => {
      sub.unsubscribe()
      window.removeEventListener('notifications-read', handleRead)
    }
  }, [profile?.id, fetchNotifications])

  return { notifications, refetch: fetchNotifications }
}
