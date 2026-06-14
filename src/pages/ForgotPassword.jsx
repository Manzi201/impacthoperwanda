import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, ChevronLeft, KeyRound, CheckCircle2, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

const ForgotPassword = () => {
  const navigate = useNavigate()

  // Mode: 'request' = send email, 'reset' = set new password (came from email link)
  const [mode, setMode] = useState('request')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Detect if user came back from a password reset email link
  // Supabase puts #access_token in the URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Parse the token from hash
      const params = new URLSearchParams(hash.replace('#', '?'))
      const type = params.get('type')
      if (type === 'recovery') {
        setMode('reset')
        // Let Supabase handle the session from hash automatically
        supabase.auth.getSession()
      }
    }
  }, [])

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  const handleSetNewPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      // Sign out and send to login after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut()
        navigate('/login')
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-400 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-400 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <Link to="/login" className="flex items-center gap-3 mb-16">
            <img src={logo} alt="Impact Hope Rwanda" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Impact Hope Rwanda</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary-200 font-bold">Empowering Communities</p>
            </div>
          </Link>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-5xl font-bold leading-tight mb-6">
              {mode === 'reset' ? 'Set your new' : 'Secure your'}<br />
              <span className="text-secondary-400">Hub Access.</span>
            </h2>
            <p className="text-lg text-primary-100 max-w-md leading-relaxed">
              {mode === 'reset'
                ? 'Enter your new password below. Make sure it is strong and unique.'
                : "If you've forgotten your credentials, we'll send you a secure link to reset your password."}
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/10">
          <p className="text-sm text-primary-300">Impact Hope Rwanda Security Protocol v2.0</p>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/login" className="flex items-center gap-2 text-primary-800 hover:text-primary-900 font-bold mb-8 group transition-all">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Login</span>
          </Link>

          {/* ── REQUEST MODE ── */}
          {mode === 'request' && !success && (
            <>
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot Password?</h3>
                <p className="text-slate-500 mt-2">Enter your email and we'll send you a reset link.</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl mb-5 text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSendEmail} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
                    <input
                      type="email" required
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-base font-bold">
                  {loading
                    ? <Loader2 className="animate-spin" size={20} />
                    : <><span>Send Reset Link</span><ArrowRight size={20} /></>
                  }
                </button>
              </form>
            </>
          )}

          {/* ── REQUEST SUCCESS ── */}
          {mode === 'request' && success && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-slate-500 mb-8 text-sm">
                A password reset link has been sent to <strong>{email}</strong>. Check your inbox and click the link to continue.
              </p>
              <Link to="/login" className="btn-primary w-full py-4 justify-center">
                <span>Return to Login</span>
              </Link>
            </div>
          )}

          {/* ── RESET MODE (came from email link) ── */}
          {mode === 'reset' && !success && (
            <>
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Set New Password</h3>
                <p className="text-slate-500 mt-2">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl mb-5 text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSetNewPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showNew ? 'text' : 'password'} required minLength={6}
                      className="w-full pl-11 pr-12 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showConfirm ? 'text' : 'password'} required
                      className="w-full pl-11 pr-12 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-base font-bold">
                  {loading
                    ? <Loader2 className="animate-spin" size={20} />
                    : <><KeyRound size={20} /><span>Update Password</span></>
                  }
                </button>
              </form>
            </>
          )}

          {/* ── RESET SUCCESS ── */}
          {mode === 'reset' && success && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Password Updated!</h3>
              <p className="text-slate-500 text-sm">Your password has been changed. Redirecting to login...</p>
              <div className="mt-4 w-6 h-6 border-2 border-primary-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword
