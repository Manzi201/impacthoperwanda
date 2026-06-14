import { useState, useEffect } from 'react'
import { 
  Users, Search, Plus, Filter, Loader2, X,
  Camera, Target, Edit2, CheckCircle2, XCircle, AlertCircle
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
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const role = profile?.role
  // Only education can register, supervisor can only view and assign programs
  const canRegister = role === 'education' || role === 'admin'
  const canAssign = ['education', 'supervisor', 'admin', 'ceo'].includes(role)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', programId: '', status: 'active'
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Action modal form
  const [actionForm, setActionForm] = useState({ programId: '', status: 'active' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: bData } = await supabase
        .from('beneficiaries')
        .select('*, programs (name)')
        .order('created_at', { ascending: false })
      const { data: pData } = await supabase
        .from('programs')
        .select('*')
        .in('status', ['active', 'pending_approval'])
      setBeneficiaries(bData || [])
      setPrograms(pData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      let photoUrl = null
      if (photo) {
        const ext = photo.name.split('.').pop()
        const path = `beneficiaries/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, photo)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = publicUrl
      }
      const { error } = await supabase.from('beneficiaries').insert([{
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        program_id: formData.programId || null,
        status: formData.status,
        photo_url: photoUrl
      }])
      if (error) throw error
      setSuccessMsg('Beneficiary registered successfully!')
      setTimeout(() => {
        setSuccessMsg('')
        setShowModal(false)
        setFormData({ firstName: '', lastName: '', email: '', phone: '', programId: '', status: 'active' })
        setPhoto(null); setPhotoPreview(null)
        fetchData()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openActionModal = (b) => {
    setSelectedBeneficiary(b)
    setActionForm({ programId: b.program_id || '', status: b.status })
    setShowActionModal(true)
  }

  const handleAction = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .update({
          program_id: actionForm.programId || null,
          status: actionForm.status
        })
        .eq('id', selectedBeneficiary.id)
      if (error) throw error
      setSuccessMsg('Updated successfully!')
      setTimeout(() => {
        setSuccessMsg('')
        setShowActionModal(false)
        fetchData()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = beneficiaries.filter(b => {
    const matchSearch = `${b.first_name} ${b.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      b.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusColor = (s) => ({
    active: 'bg-emerald-50 text-emerald-600',
    inactive: 'bg-slate-100 text-slate-500',
    graduated: 'bg-blue-50 text-blue-600'
  }[s] || 'bg-slate-100 text-slate-500')

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Beneficiaries</h1>
          <p className="text-slate-500 mt-1">Manage and track all program participants.</p>
        </div>
        {canRegister && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /><span>Register Beneficiary</span>
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-800 transition-colors" size={17} />
          <input type="text" placeholder="Search by name or email..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['all','active','inactive','graduated'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-primary-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Beneficiary</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                {canAssign && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-xl w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    {canAssign && <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-16 ml-auto"></div></td>}
                  </tr>
                ))
              ) : filtered.length > 0 ? filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-900/5 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                        {b.photo_url ? <img src={b.photo_url} alt="" className="w-full h-full object-cover" /> : <Users size={16} className="text-primary-800" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{b.first_name} {b.last_name}</p>
                        <p className="text-xs text-slate-500">{b.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Target size={13} className="text-slate-400" />
                      <span className={`text-sm font-medium ${b.programs?.name ? 'text-slate-700' : 'text-amber-600 font-bold'}`}>
                        {b.programs?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                  {canAssign && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openActionModal(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-800 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all ml-auto">
                        <Edit2 size={13} /><span>Manage</span>
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={canAssign ? 5 : 4} className="px-6 py-12 text-center">
                  <Users size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">No beneficiaries found.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden">
              <div className="bg-primary-900 p-7 text-white">
                <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"><X size={16}/></button>
                <h2 className="text-2xl font-bold">Register New Beneficiary</h2>
                <p className="text-primary-200 text-sm mt-1">Enroll a participant into a program</p>
              </div>
              <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">
                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-center gap-2"><AlertCircle size={16}/>{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm flex items-center gap-2"><CheckCircle2 size={16}/>{successMsg}</div>}

                <div className="flex flex-col items-center gap-3">
                  <label htmlFor="bphoto" className="relative w-24 h-24 bg-primary-900 rounded-[28px] flex items-center justify-center cursor-pointer hover:scale-105 transition-all overflow-hidden group shadow-xl shadow-primary-900/30">
                    {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-white/80 group-hover:text-white" />}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Plus size={20} className="text-white"/></div>
                  </label>
                  <input id="bphoto" type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){setPhoto(f);setPhotoPreview(URL.createObjectURL(f))}}} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">First Name *</label>
                    <input required type="text" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name *</label>
                    <input required type="text" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                    <input type="email" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                    <input type="tel" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assign Program</label>
                  <select className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm appearance-none transition-all"
                    value={formData.programId} onChange={e => setFormData({...formData, programId: e.target.value})}>
                    <option value="">— Select a program —</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm">Cancel</button>
                  <button disabled={saving} className="flex-[2] bg-primary-800 text-white py-3.5 rounded-2xl font-bold hover:bg-primary-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                    {saving ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>}
                    <span>{saving ? 'Saving...' : 'Register'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modal - Assign Program / Change Status */}
      <AnimatePresence>
        {showActionModal && selectedBeneficiary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setShowActionModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-primary-900 p-6 text-white">
                <button onClick={() => setShowActionModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"><X size={16}/></button>
                <h3 className="text-lg font-bold">Manage Beneficiary</h3>
                <p className="text-primary-200 text-sm mt-0.5">{selectedBeneficiary.first_name} {selectedBeneficiary.last_name}</p>
              </div>
              <form onSubmit={handleAction} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm">{successMsg}</div>}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assign to Program</label>
                  <select className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm appearance-none transition-all"
                    value={actionForm.programId} onChange={e => setActionForm({...actionForm, programId: e.target.value})}>
                    <option value="">— Unassigned —</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['active','inactive','graduated'].map(s => (
                      <button key={s} type="button" onClick={() => setActionForm({...actionForm, status: s})}
                        className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${actionForm.status === s ? 'bg-primary-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowActionModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
                  <button disabled={saving} className="flex-[2] bg-primary-800 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                    {saving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                    <span>Save Changes</span>
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
