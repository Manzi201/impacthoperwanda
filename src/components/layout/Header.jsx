import { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, Settings, LogOut, Clock, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

const Header = ({ onMenuClick }) => {
  const { user, profile, signOut } = useAuth()
  const displayName = profile?.full_name || (user?.email === 'impactadmin2026@gmail.com' ? 'Master Admin' : user?.email?.split('@')[0])
  const { notifications } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      localStorage.clear()
      await signOut()
    } catch (e) {
      console.error(e)
    } finally {
      navigate('/login')
    }
  }

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition-all"
        >
          <Menu size={20} />
        </button>
        <div className="max-w-xl hidden md:block w-full">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search records, beneficiaries, programs..." 
              className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-xl transition-all outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary-50 hover:text-primary-800 transition-all relative group"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full group-hover:scale-125 transition-transform"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-full">
                    {notifications.length} New
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group">
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          n.type === 'success' ? "bg-emerald-50 text-emerald-600" : 
                          n.type === 'warning' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          <n.icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary-800 transition-colors">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.desc}</p>
                          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                            <Clock size={10} />
                            {n.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 text-xs font-bold text-primary-800 bg-slate-50 hover:bg-primary-50 transition-colors">
                  View All Notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{profile?.full_name}</p>
              <p className="text-[10px] text-primary-700 font-bold uppercase mt-1 tracking-wider">{profile?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center text-white shadow-lg shadow-primary-800/20">
              <User size={20} />
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50 p-2"
              >
                <div className="px-3 py-2 mb-2 border-b border-slate-100 pb-3">
                  <p className="text-xs text-slate-500">Connected as</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                </div>
                <button 
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <Settings size={18} />
                  <span>Account Settings</span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-all mt-1"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default Header
