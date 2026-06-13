import { useState } from 'react'
import { User, Mail, Shield, Save, Loader2, Camera } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'

const AccountSettings = () => {
  const { profile, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await updateProfile({ full_name: fullName })
    setLoading(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="premium-card p-8 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-3xl bg-primary-800 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-primary-800/20">
              {profile?.full_name?.charAt(0)}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-900">{profile?.full_name}</h2>
          <p className="text-primary-700 font-bold uppercase text-[10px] tracking-widest mt-1 bg-primary-50 px-3 py-1 rounded-full">
            {profile?.role}
          </p>
          <div className="w-full h-px bg-slate-100 my-6"></div>
          <p className="text-xs text-slate-400">Account ID: {profile?.id?.slice(0, 8)}...</p>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-8"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-primary-800" />
              Personal Information
            </h3>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-800 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    className="input-field pl-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address (Primary)</label>
                <div className="relative group opacity-60">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    disabled
                    className="input-field pl-11 bg-slate-50 cursor-not-allowed"
                    value={profile?.email}
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1 italic">Contact Admin to change your primary email.</p>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary min-w-[140px]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : success ? (
                    <span>Changes Saved!</span>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <div className="premium-card p-8 border-rose-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-rose-600" />
              Security & Privacy
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Manage your password and active sessions. For enhanced security, we recommend using a password with at least 12 characters.
            </p>
            <button className="btn-secondary text-rose-600 hover:bg-rose-50 border-rose-100">
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
