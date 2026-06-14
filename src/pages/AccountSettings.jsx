import { useState } from 'react'
import { User, Mail, Shield, Save, Loader2, Camera, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

const AccountSettings = () => {
  const { profile, updateProfile, user } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }
    setPwLoading(true)
    try {
      // Re-authenticate then update password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-3xl bg-primary-800 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-primary-800/20">
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={22} />
            </div>
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">{profile?.full_name}</h2>
          <p className="text-primary-700 font-bold uppercase text-[10px] tracking-widest mt-1 bg-primary-50 px-3 py-1 rounded-full">
            {profile?.role}
          </p>
          <div className="w-full h-px bg-slate-100 my-5"></div>
          <p className="text-xs text-slate-400">ID: {profile?.id?.slice(0, 8)}...</p>
          <div className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${profile?.status === 'active' ? 'text-emerald-600' : 'text-rose-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${profile?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></div>
            {profile?.status === 'active' ? 'Active Account' : 'Inactive'}
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={18} className="text-primary-800" />
              Personal Information
            </h3>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={16} />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 opacity-60">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    disabled
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl outline-none text-sm cursor-not-allowed"
                    value={profile?.email || user?.email || ''}
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Contact Admin to change your email.</p>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary min-w-[130px] text-sm">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <><CheckCircle2 size={18} /><span>Saved!</span></> : <><Save size={16} /><span>Save Changes</span></>}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Password Change */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield size={18} className="text-rose-600" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> Password updated successfully!
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 pr-12 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={pwLoading} className="btn-primary min-w-[160px] text-sm bg-rose-600 hover:bg-rose-700 shadow-rose-600/20">
                  {pwLoading ? <Loader2 className="animate-spin" size={18} /> : <><KeyRound size={16} /><span>Update Password</span></>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
