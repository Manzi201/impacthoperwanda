import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { 
  UserPlus, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck,
  Search,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../hooks/useDatabase'
import { useNavigate } from 'react-router-dom'

const UserManagement = () => {
  const navigate = useNavigate()
  const { getUsers, loading } = useDatabase()
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const loadUsers = useCallback(async () => {
    const { data } = await getUsers()
    if (data) setUsers(data)
  }, [getUsers])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadUsers])

  const handleManualReset = async (e) => {
    e.preventDefault()
    if (!newPassword) return
    
    setResetLoading(true)
    try {
      // 1. Update the password_temp in profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          password_temp: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // 2. Create a notification for that user
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: 'Security Alert: Password Reset',
        content: `An administrator has reset your password. Your temporary password is: ${newPassword}. Please change it immediately.`,
        type: 'warning'
      })

      setSuccessMsg(`Password for ${selectedUser.full_name} has been updated manually!`)
      setTimeout(() => {
        setSuccessMsg('')
        setShowResetModal(false)
        setNewPassword('')
      }, 3000)
    } catch (err) {
      alert('Failed to reset password: ' + err.message)
    } finally {
      setResetLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage staff access, roles, and security credentials.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="input-field pl-10 py-2 text-sm w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => navigate('/admin/create-user')} className="btn-primary py-2 px-4 text-sm whitespace-nowrap w-full sm:w-auto justify-center">
            <UserPlus size={18} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                    <p>Loading user directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.full_name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-800 bg-primary-50 px-2.5 py-1 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></div>
                      Active
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedUser(user)
                          setShowResetModal(true)
                        }}
                        className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-all"
                        title="Manual Password Override"
                      >
                        <KeyRound size={18} />
                      </button>
                      <button className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-all" title="Disable User">
                        <ShieldAlert size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-400 italic">
                    No staff members matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !resetLoading && setShowResetModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <KeyRound size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manual Override</h3>
                  <p className="text-sm text-slate-500">Update password for {selectedUser?.full_name}</p>
                </div>
              </div>

              {successMsg ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <p className="text-emerald-600 font-bold">{successMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleManualReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">New Secure Password</label>
                    <input 
                      type="text" 
                      required
                      className="input-field" 
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      disabled={resetLoading}
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={resetLoading || !newPassword}
                      className="flex-1 btn-primary"
                    >
                      {resetLoading ? <Loader2 className="animate-spin" size={20} /> : 'Force Update'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserManagement
