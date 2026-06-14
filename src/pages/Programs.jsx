import { useState, useEffect, useCallback } from 'react'
import { 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Calendar,
  Wallet,
  User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const cn = (...inputs) => inputs.filter(Boolean).join(' ')

const formatCurrency = (val) => {
  if (!val && val !== 0) return 'N/A'
  return `${Number(val).toLocaleString()} RWF`
}

const Programs = () => {
  const { profile } = useAuth()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [programError, setProgramError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    budget: '',
    start_date: ''
  })

  const canManage = ['admin', 'supervisor', 'ceo'].includes(profile?.role)
  const canCreate = ['admin', 'supervisor'].includes(profile?.role)

  const loadPrograms = useCallback(async () => {
    setLoading(true)
    setProgramError(null)
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`*, profiles:manager_id (full_name)`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrograms(data || [])
    } catch (err) {
      setProgramError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPrograms() }, [loadPrograms])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('programs')
        .insert([{
          name: formData.name,
          description: formData.description,
          status: formData.status,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          start_date: formData.start_date || null
        }])

      if (error) throw error

      setSuccessMsg('Program launched successfully!')
      setTimeout(() => {
        setSuccessMsg('')
        setShowModal(false)
        setFormData({ name: '', description: '', status: 'active', budget: '', start_date: '' })
        loadPrograms()
      }, 1500)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Program Portfolio</h1>
          <p className="text-slate-500 mt-1">Track the impact and progress of NGO initiatives across Rwanda.</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            <span>Launch New Program</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="text-sm">Loading programs...</p>
        </div>
      ) : programError ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-rose-100">
          <AlertCircle className="mx-auto text-rose-400 mb-4" size={40} />
          <h3 className="text-lg font-bold text-rose-700">Unable to load programs</h3>
          <p className="text-sm text-rose-500 mt-1">{programError}</p>
          <button onClick={loadPrograms} className="mt-6 btn-primary text-sm">Retry</button>
        </div>
      ) : programs.length > 0 ? (
        <div className="space-y-5">
          {programs.map((prog, i) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 hover:shadow-xl hover:shadow-primary-800/5 transition-all group"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-800">
                      <Target size={20} />
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      prog.status === 'active' ? "bg-emerald-50 text-emerald-700" :
                      prog.status === 'completed' ? "bg-blue-50 text-blue-700" :
                      "bg-slate-50 text-slate-500"
                    )}>
                      {prog.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-800 transition-colors">{prog.name}</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">{prog.description || 'No description available.'}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-6">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Manager</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <User size={12} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{prog.profiles?.full_name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Budget</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Wallet size={12} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{formatCurrency(prog.budget)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Start Date</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">
                          {prog.start_date ? new Date(prog.start_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">M&E Status</span>
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                        <CheckCircle2 size={12} />
                        <span className="text-sm font-semibold">Live</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-64 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">Completion</span>
                    <span className="text-sm font-bold text-primary-800">
                      {prog.status === 'completed' ? '100' : prog.status === 'active' ? '—' : '0'}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                    <div className={`h-full bg-primary-800 rounded-full transition-all ${
                      prog.status === 'completed' ? 'w-full' : 'w-0'
                    }`}></div>
                  </div>
                  {canManage && (
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-2xl hover:bg-primary-50 hover:text-primary-800 transition-all text-sm font-bold border border-slate-100">
                      <span>View Details</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <Target className="mx-auto text-slate-200 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-900">No programs yet</h3>
          <p className="text-slate-500 mt-1 text-sm">
            {canCreate ? 'Start by launching your first NGO program.' : 'No programs have been created yet.'}
          </p>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-6 text-sm">
              <Plus size={16} />
              <span>Launch First Program</span>
            </button>
          )}
        </div>
      )}

      {/* Launch Program Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="bg-primary-900 p-7 text-white relative">
                <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
                  <X size={16} />
                </button>
                <h2 className="text-2xl font-bold">Launch New Program</h2>
                <p className="text-primary-200 text-sm mt-1">Create a new NGO initiative</p>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />{errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />{successMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Program Name *</label>
                  <input
                    required type="text" placeholder="e.g. Youth Education Initiative"
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Budget (RWF)</label>
                    <input
                      type="number" min="0" step="1000" placeholder="e.g. 5000000"
                      className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Initial Status</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm font-bold appearance-none transition-all"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm">
                    Cancel
                  </button>
                  <button disabled={saving} className="flex-[2] bg-primary-800 text-white py-3.5 rounded-2xl font-bold hover:bg-primary-900 transition-all shadow-lg shadow-primary-800/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    <span>{saving ? 'Launching...' : 'Launch Initiative'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Programs
