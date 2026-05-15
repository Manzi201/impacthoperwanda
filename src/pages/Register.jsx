import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUp(email, password, { full_name: fullName, role })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-400 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-400 blur-3xl"></div>
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
              Join the mission of <br />
              <span className="text-secondary-400">Positive Change.</span>
            </h2>
            <p className="text-lg text-primary-100 max-w-md leading-relaxed mb-12">
              Create an account to start managing programs, tracking beneficiaries, and reporting community impact.
            </p>

            <div className="grid grid-cols-1 gap-6">
              {[
                { title: 'Secure Access', desc: 'Role-based permissions for all levels.' },
                { title: 'Unified Platform', desc: 'All NGO data in one centralized hub.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center text-primary-300 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-primary-200 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/10">
          <p className="text-sm text-primary-300">Join over 50+ NGO staff members across Rwanda.</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md my-8"
        >
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Create New User</h3>
            <p className="text-slate-500 mt-2">Register a new staff member into the Impact Hope MIS.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-800 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="input-field pl-11"
                  placeholder="Manzi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

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
                  placeholder="name@impacthope.org"
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Assigned Role</label>
              <select
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Administrator</option>
                <option value="ceo">CEO</option>
                <option value="finance">Finance Officer</option>
                <option value="supervisor">Supervisor</option>
                <option value="education">Education Officer</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 ml-1 uppercase font-bold tracking-wider">Administrator approval may be required</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg font-bold mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">
              Administrator Only Access
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
