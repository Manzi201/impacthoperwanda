import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  UserPlus,
  Loader2,
  X,
  Camera,
  Target
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const Beneficiaries = () => {
  const { profile } = useAuth()
  const [beneficiaries, setBeneficiaries] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    programId: '',
    status: 'active'
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: bData } = await supabase
        .from('beneficiaries')
        .select(`
          *,
          programs (name)
        `)
        .order('created_at', { ascending: false })
      
      const { data: pData } = await supabase
        .from('programs')
        .select('*')
      
      setBeneficiaries(bData || [])
      setPrograms(pData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let photoUrl = null

      // 1. Upload photo if exists
      if (photo) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `beneficiaries/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photo)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        
        photoUrl = publicUrl
      }

      // 2. Insert into Database
      const { error } = await supabase
        .from('beneficiaries')
        .insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,  // null instead of "" to avoid UNIQUE constraint
          phone: formData.phone || null,
          program_id: formData.programId || null,
          status: formData.status,
          photo_url: photoUrl
        }])

      if (error) throw error

      setShowModal(false)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', programId: '', status: 'active' })
      setPhoto(null)
      setPhotoPreview(null)
      fetchData()
    } catch (error) {
      alert('Error registering beneficiary: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredBeneficiaries = beneficiaries.filter(b => 
    `${b.first_name} ${b.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Beneficiaries</h1>
          <p className="text-slate-500 mt-1">Manage and track all program participants.</p>
        </div>
        {profile?.role !== 'ceo' && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>Register Beneficiary</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all text-sm font-bold border border-transparent hover:border-slate-200">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Beneficiary</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-xl w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-100 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredBeneficiaries.length > 0 ? (
                filteredBeneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-900/5 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                          {b.photo_url ? (
                            <img src={b.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={18} className="text-primary-800" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-none">{b.first_name} {b.last_name}</p>
                          <p className="text-xs text-slate-500 mt-1">{b.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{b.programs?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-slate-200" />
                      <p className="text-slate-500 font-medium text-sm">No beneficiaries found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="bg-primary-900 p-8 text-white relative">
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X size={18} />
                </button>
                <h2 className="text-2xl font-bold">Register New Beneficiary</h2>
                <p className="text-primary-200 text-sm mt-1">Enroll a new participant into a program</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Photo Upload - Luxury Style */}
                <div className="flex flex-col items-center gap-4 pb-4">
                  <label 
                    htmlFor="beneficiary-photo"
                    className="relative w-28 h-28 bg-primary-900 rounded-[32px] flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-xl shadow-primary-900/30 overflow-hidden group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-white/80 group-hover:text-white transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus size={24} className="text-white" />
                    </div>
                  </label>
                  <input 
                    id="beneficiary-photo" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoChange} 
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to upload photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assign Program</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm appearance-none"
                    value={formData.programId}
                    onChange={(e) => setFormData({...formData, programId: e.target.value})}
                  >
                    <option value="">Select a program...</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={saving}
                    className="flex-[2] bg-primary-800 text-white px-6 py-4 rounded-2xl font-bold hover:bg-primary-900 transition-all shadow-lg shadow-primary-800/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    <span>Confirm Registration</span>
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

export default Beneficiaries
