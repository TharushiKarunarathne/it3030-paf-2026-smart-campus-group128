import { createContext, useState, useEffect, useCallback } from 'react'
import { getNotifications, markAsRead, markAllAsRead, clearNotifications } from '../api/notificationApi'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext(null)

const POLL_INTERVAL_MS = 30_000

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

 const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data } = await getNotifications()
      // Make sure we always set an array
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      // backend not running yet — keep empty array
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch {
      toast.error('Failed to mark as read.')
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      toast.error('Failed to mark all as read.')
    }
  }, [])

  const handleClear = useCallback(async () => {
    try {
      await clearNotifications()
      setNotifications((prev) => prev.filter((n) => !n.read))
      toast.success('Cleared read notifications.')
    } catch {
      toast.error('Failed to clear notifications.')
    }
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead:         handleMarkAsRead,
      markAllAsRead:      handleMarkAllAsRead,
      clearNotifications: handleClear,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}