import { useState } from 'react'
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Shield, 
  User, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react'
import { supabase, adminAuthClient } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const CreateUser = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'education'
  })

  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let avatarUrl = null

      // 1. Upload photo if exists
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        
        avatarUrl = publicUrl
      }

      // 2. Create the Auth User using the Admin Client (prevents logging out current user)
      const { error: signUpError } = await adminAuthClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            avatar_url: avatarUrl
          }
        }
      })

      if (signUpError) throw signUpError

      setSuccess(true)
      setTimeout(() => navigate('/admin/users'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
      >
        <ArrowLeft size={18} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="bg-primary-900 p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold">Provision Staff Access</h1>
            <p className="text-primary-200 mt-2">Create secure credentials for new team members.</p>
          </div>
          <UserPlus size={120} className="absolute -right-8 -bottom-8 text-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Photo Upload - Luxury Style */}
          <div className="flex flex-col items-center gap-4 pb-4">
            <label 
              htmlFor="staff-avatar"
              className="relative w-28 h-28 bg-primary-900 rounded-[32px] flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-xl shadow-primary-900/30 overflow-hidden group"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-white/80 group-hover:text-white transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus size={24} className="text-white" />
              </div>
            </label>
            <input 
              id="staff-avatar"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Staff Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder="staff@impacthope.org"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Initial Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assign Role</label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="education">Education Officer</option>
                  <option value="supervisor">Program Supervisor</option>
                  <option value="finance">Finance Manager</option>
                  <option value="hr">Human Resources</option>
                  <option value="ceo">Executive CEO</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-shake">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-bounce">
              <CheckCircle2 size={20} />
              <p className="text-sm font-bold">User created successfully! Redirecting...</p>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              disabled={loading || success}
              className="flex-[2] py-4 bg-primary-800 text-white rounded-2xl font-bold hover:bg-primary-900 shadow-xl shadow-primary-800/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              <span>{loading ? 'Processing...' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default CreateUser
