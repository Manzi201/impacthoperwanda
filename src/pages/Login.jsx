import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-400 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-400 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Heart size={28} className="text-secondary-400" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Impact Hope Rwanda</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary-300 font-bold">Empowering Communities</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-6">
              Impact Hope <br />
              <span className="text-secondary-400">Management System.</span>
            </h2>
            <p className="text-lg text-primary-100 max-w-md leading-relaxed mb-12">
              Secure access to the centralized management information system for NGOs.
            </p>

            <div className="space-y-4">
              {[
                'Authorized access only',
                'Secure data encryption',
                'Role-based monitoring'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/10 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={16} />
          </div>
          <p className="text-xs text-primary-300 font-medium">Protected by Enterprise Grade Security</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary-800 rounded-xl flex items-center justify-center text-white">
              <Heart size={24} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Impact Hope</h1>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Sign In</h3>
            <p className="text-slate-500 mt-2">Enter your credentials to access the hub.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl mb-6 text-sm flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-800 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="input-field pl-11"
                  placeholder="admin@impacthope.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-800 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="input-field pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg font-bold"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              For security reasons, public registration is disabled. If you need access, please contact your System Administrator.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
