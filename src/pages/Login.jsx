import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'

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
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
        setError('Verify your email address first — check your inbox for a confirmation link, or ask your administrator to confirm your account.')
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── LEFT: White branding side ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden flex-col justify-between p-12 border-r border-slate-100">
        {/* Subtle orange glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-100 blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-50 blur-3xl opacity-80"></div>
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-16">
            <img src={logo} alt="Impact Hope Rwanda" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Impact Hope Rwanda</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary-600 font-bold mt-0.5">Empowering Communities</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900">
              Impact Hope <br />
              <span className="text-primary-500">Management System.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-md leading-relaxed mb-12">
              Secure access to the centralized management information system for NGOs.
            </p>

            <div className="space-y-4">
              {[
                'Authorized access only',
                'Secure data encryption',
                'Role-based monitoring'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <ShieldCheck size={16} />
          </div>
          <p className="text-xs text-slate-500 font-medium">Protected by Enterprise Grade Security</p>
        </div>
      </div>

      {/* ── RIGHT: Orange form side ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 bg-primary-500 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400 blur-3xl opacity-40"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600 blur-3xl opacity-30"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logo} alt="Impact Hope" className="w-10 h-10 object-contain bg-white rounded-xl p-1" />
            <h1 className="text-xl font-bold text-white">Impact Hope Rwanda</h1>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 p-8 md:p-10">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Sign In</h3>
              <p className="text-slate-500 mt-2">Enter your credentials to access the hub.</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl mb-6 text-sm flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></div>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm"
                    placeholder="admin@impacthope.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-right">
                <a href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  Forgot your password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
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

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Public registration is disabled. Contact your System Administrator for access.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
