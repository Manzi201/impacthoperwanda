import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Mail, ArrowRight, ChevronLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await resetPassword(email)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
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
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Heart size={28} className="text-secondary-400" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Impact Hope Rwanda</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary-300 font-bold">Empowering Communities</p>
            </div>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-6">
              Secure your <br />
              <span className="text-secondary-400">Hub Access.</span>
            </h2>
            <p className="text-lg text-primary-100 max-w-md leading-relaxed mb-12">
              If you've forgotten your credentials, don't worry. We'll send you a secure link to reset your password and get you back to the mission.
            </p>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-start gap-4 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-secondary-400/20 flex items-center justify-center text-secondary-400 shrink-0">
                <KeyRound size={24} />
              </div>
              <p className="text-sm text-primary-100 italic">
                "Security is not just about protection, it's about ensuring our impact is consistent and reliable."
              </p>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/10">
          <p className="text-sm text-primary-300">Impact Hope Rwanda Security Protocol v2.0</p>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/login" className="flex items-center gap-2 text-primary-800 hover:text-primary-900 font-bold mb-8 group transition-all">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Login</span>
          </Link>

          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Check your email</h3>
              <p className="text-slate-500 mb-8">We've sent a password reset link to your email address.</p>
              <Link to="/login" className="btn-primary w-full py-4 text-lg">
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Reset User Access</h3>
                <p className="text-slate-500 mt-2">Enter the email of the staff member who needs a password reset.</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Staff Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-800 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="input-field pl-11"
                      placeholder="name@impacthope.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      <span>Send Reset Link</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword
