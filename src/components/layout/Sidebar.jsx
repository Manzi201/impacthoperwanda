import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Wallet, 
  BarChart3, 
  LogOut,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Settings,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../assets/logo.png'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  const rawRole = profile?.role || user?.user_metadata?.role || ''
  const role = rawRole.toLowerCase().trim()
  const isAdmin = role === 'admin' || profile?.email === 'impactadmin2026@gmail.com' || user?.email === 'impactadmin2026@gmail.com'

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'ceo', 'finance', 'supervisor', 'education', 'hr'] },
    { icon: Users, label: 'Beneficiaries', path: '/beneficiaries', roles: ['ceo', 'supervisor', 'education', 'hr'] },
    { icon: Target, label: 'Programs', path: '/programs', roles: ['ceo', 'supervisor', 'education'] },
    { icon: Wallet, label: 'Financials', path: '/financials', roles: ['ceo', 'finance'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'ceo', 'finance', 'supervisor', 'education', 'hr'] },
    // Admin Only Items
    { icon: ShieldCheck, label: 'User Directory', path: '/admin/users', roles: ['admin'] },
    { icon: UserPlus, label: 'Create User', path: '/admin/create-user', roles: ['admin'] },
  ]

  const effectiveRole = isAdmin ? 'admin' : role

  const filteredItems = menuItems.filter(item => 
    item.roles && item.roles.includes(effectiveRole)
  )

  const handleSignOut = async () => {
    try {
      localStorage.clear()
      const { error } = await signOut()
      if (error) console.error('Sign out error:', error)
      // No navigate here — onAuthStateChange sets user to null,
      // which triggers AppContent to redirect to /login automatically
    } catch (e) {
      console.error(e)
      navigate('/login')
    }
  }

  // Define display name with fallback for Master Admin
  const displayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email === 'impactadmin2026@gmail.com' ? 'Master Admin' : user?.email?.split('@')[0])
  const displayRole = profile?.role || user?.user_metadata?.role || (user?.email === 'impactadmin2026@gmail.com' ? 'Admin' : 'Staff')

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Impact Hope Rwanda" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Impact Hope</h1>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Rwanda MIS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary-900 text-white shadow-lg shadow-primary-900/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-white" : "text-slate-400 group-hover:text-primary-800"
              )} />
              <span className="font-bold text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto space-y-4">
        {/* User Profile Section */}
        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-primary-800/20 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-900 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
              <UserIcon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[10px] font-bold text-primary-800 uppercase tracking-widest">{displayRole}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center p-2 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-primary-800 hover:border-primary-800/20 transition-all shadow-sm"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center justify-center p-2 rounded-xl bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-primary-900/5 rounded-2xl">
          <p className="text-[9px] text-primary-900/40 text-center font-bold uppercase tracking-widest">
            MIS v2.3 Production
          </p>
        </div>
      </div>
    </aside>
    </>
  )
}

export default Sidebar
