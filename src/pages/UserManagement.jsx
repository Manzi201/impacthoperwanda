import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { 
  UserPlus, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck,
  Search,
  Loader2,
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../hooks/useDatabase'
import { useNavigate } from 'react-router-dom'

const UserManagement = () => {
  const navigate = useNavigate()
  const { getUsers } = useDatabase()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await getUsers()
    if (data) setUsers(data)
    setLoading(false)
  }, [getUsers])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleToggleStatus = async (user) => {
    setTogglingId(user.id)
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: newStatus === 'inactive' ? 'Account Deactivated' : 'Account Reactivated',
        content: newStatus === 'inactive' 
          ? 'Your account has been deactivated by an administrator. Contact support for help.'
          : 'Your account has been reactivated. You may now log in.',
        type: newStatus === 'inactive' ? 'warning' : 'success'
      })

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
    } catch (err) {
      alert('Failed to update status: ' + err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleManualReset = async (e) => {
    e.preventDefault()
    if (!newPassword) return
    setResetLoading(true)
    setErrorMsg('')
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ password_temp: newPassword, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: 'Password Reset by Administrator',
        content: `Your password has been reset. Temporary password: ${newPassword}. Please login and change it immediately.`,
        type: 'warning'
      })

      setSuccessMsg(`Password for ${selectedUser.full_name} updated successfully!`)
      setTimeout(() => {
        setSuccessMsg('')
        setShowResetModal(false)
        setNewPassword('')
        setSelectedUser(null)
      }, 2500)
    } catch (err) {
      setErrorMsg('Failed: ' + err.message)
    } finally {
      setResetLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roleColors = {
    admin: 'bg-rose-50 text-rose-700',
    ceo: 'bg-purple-50 text-purple-700',
    finance: 'bg-emerald-50 text-emerald-700',
    supervisor: 'bg-blue-50 text-blue-700',
    education: 'bg-amber-50 text-amber-700',
    hr: 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage staff access, roles, and security credentials.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search staff..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-primary-800/30 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => navigate('/admin/create-user')} className="btn-primary py-2.5 px-5 text-sm whitespace-nowrap">
            <UserPlus size={16} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto mb-3 text-primary-800" size={32} />
                    <p className="text-slate-400 text-sm">Loading user directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{user.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleColors[user.role] || 'bg-slate-100 text-slate-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'active' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></div>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setSelectedUser(user); setShowResetModal(true) }}
                        className="p-2 hover:bg-amber-50 text-amber-600 rounded-xl transition-all"
                        title="Reset Password"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={togglingId === user.id}
                        className={`p-2 rounded-xl transition-all ${user.status === 'active' ? 'hover:bg-rose-50 text-rose-500' : 'hover:bg-emerald-50 text-emerald-600'}`}
                        title={user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {togglingId === user.id 
                          ? <Loader2 size={16} className="animate-spin" />
                          : user.status === 'active' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-400 italic text-sm">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !resetLoading && setShowResetModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-amber-500 p-6 text-white flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Reset Password</h3>
                  <p className="text-amber-100 text-sm">{selectedUser?.full_name} · {selectedUser?.email}</p>
                </div>
                <button onClick={() => setShowResetModal(false)} className="ml-auto w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                {successMsg ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={48} />
                    <p className="font-bold text-emerald-600">{successMsg}</p>
                  </div>
                ) : (
                  <form onSubmit={handleManualReset} className="space-y-5">
                    {errorMsg && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm">
                        <AlertCircle size={16} />
                        {errorMsg}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          className="w-full px-4 py-3 pr-12 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                          placeholder="Min 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">
                      The user will receive a notification with this temporary password and must change it on next login.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm">
                        Cancel
                      </button>
                      <button type="submit" disabled={resetLoading || !newPassword} className="flex-[2] py-3 bg-primary-800 text-white rounded-2xl font-bold hover:bg-primary-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                        {resetLoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                        Force Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserManagement
