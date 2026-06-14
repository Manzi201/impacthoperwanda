import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

// Helper functions defined outside to avoid hoisting issues
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
  const diff = Math.floor((now - date) / 1000 / 60) // minutes
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return date.toLocaleDateString()
}

export const useNotifications = () => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!profile) return

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) {
        setNotifications(data.map(n => ({
          ...n,
          icon: getIcon(n.type),
          time: formatTime(n.created_at)
        })))
      }
    }

    fetchNotifications()

    const sub = supabase
      .channel(`user-notifs-${profile.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, payload => {
        const newNotif = {
          ...payload.new,
          icon: getIcon(payload.new.type),
          time: 'Just now'
        }
        setNotifications(prev => [newNotif, ...prev])
      })
      .subscribe()

    return () => sub.unsubscribe()
  }, [profile])

  return { notifications }
}
