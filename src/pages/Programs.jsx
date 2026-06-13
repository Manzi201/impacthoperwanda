import { useState, useEffect, useCallback } from 'react'
import { 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../hooks/useDatabase'
import { formatCurrency } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const Programs = () => {
  const { profile } = useAuth()
  const { getPrograms, createProgram, loading } = useDatabase()
  const [programs, setPrograms] = useState([])
  const [programError, setProgramError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  })

  const loadPrograms = useCallback(async () => {
    const { data, error } = await getPrograms()
    if (error) {
      console.error('Programs load error:', error)
      setProgramError(error)
      setPrograms([])
      return
    }

    setProgramError(null)
    setPrograms(data || [])
  }, [getPrograms])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPrograms()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadPrograms])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await createProgram({
        name: formData.name,
        description: formData.description,
        status: formData.status
      })

      if (error) throw error

      alert('Program launched successfully!')
      setShowModal(false)
      setFormData({ name: '', description: '', status: 'active' })
      loadPrograms()
    } catch (error) {
      alert('Error launching program: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Program Portfolio</h1>
          <p className="text-slate-500 mt-1">Track the impact and progress of NGO initiatives across Rwanda.</p>
        </div>
        {profile?.role !== 'ceo' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            <span>Launch New Program</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p>Loading programs...</p>
        </div>
      ) : programError ? (
        <div className="text-center py-20 premium-card border border-rose-100 bg-rose-50">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-rose-700">Unable to load programs</h3>
          <p className="text-sm text-rose-600 mt-2">{programError.message || 'An error occurred while fetching programs.'}</p>
          {programError.details && (
            <p className="text-xs text-rose-500 mt-2">{programError.details}</p>
          )}
        </div>
      ) : programs.length > 0 ? (
        <div className="space-y-6">
          {programs.map((prog, i) => (
            <motion.div 
              key={prog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="premium-card p-6 md:p-8 hover:shadow-xl hover:shadow-primary-800/5 transition-all group"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-800">
                      <Target size={20} />
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      prog.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"
                    )}>
                      {prog.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary-800 transition-colors">{prog.name}</h3>
                  <p className="text-slate-500 mt-2 leading-relaxed">{prog.description || 'No description available.'}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Manager</span>
                      <span className="text-sm font-semibold text-slate-700">{prog.profiles?.full_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Budget</span>
                      <span className="text-sm font-semibold text-slate-700">{formatCurrency(prog.budget)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Start Date</span>
                      <span className="text-sm font-semibold text-slate-700">{prog.start_date || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">M&E Status</span>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={14} />
                        <span className="text-sm font-semibold">Live</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-72 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">Completion</span>
                    <span className="text-sm font-bold text-primary-800">0%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-primary-800 rounded-full w-0"></div>
                  </div>
                  <button className="w-full btn-secondary group/btn">
                    <span>View Details</span>
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 premium-card">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-900">No programs found</h3>
          <p className="text-slate-500 mt-2">Start by creating your first NGO program initiative.</p>
        </div>
      )}

      {/* Launch Program Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="bg-primary-900 p-8 text-white relative">
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X size={18} />
                </button>
                <h2 className="text-2xl font-bold">Launch New Program</h2>
                <p className="text-primary-200 text-sm mt-1">Create a new NGO initiative</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Program Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm custom-scrollbar"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Initial Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-bold appearance-none"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={saving}
                    className="flex-[2] bg-primary-800 text-white py-4 rounded-2xl font-bold hover:bg-primary-900 transition-all shadow-lg shadow-primary-800/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    <span>Launch Initiative</span>
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

const cn = (...inputs) => inputs.filter(Boolean).join(' ')

export default Programs
