import { useState, useEffect } from 'react'
import { 
  Wallet, 
  Plus, 
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const Financials = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ income: 0, expense: 0 })
  const [pendingPrograms, setPendingPrograms] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const { user, profile } = useAuth()
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const isFinance = ['finance', 'admin'].includes(profile?.role)

  useEffect(() => {
    fetchTransactions()
    if (isFinance) fetchPendingPrograms()
  }, [isFinance])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      const income = data?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const expense = data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      setTransactions(data || [])
      setStats({ income, expense })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingPrograms = async () => {
    const { data } = await supabase
      .from('programs')
      .select('*, requester:requested_by (full_name, role)')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
    setPendingPrograms(data || [])
  }

  const handleApprove = async (approve) => {
    if (!selectedProgram) return
    setApproving(true)
    try {
      const newStatus = approve ? 'active' : 'rejected'
      const { error } = await supabase
        .from('programs')
        .update({ status: newStatus })
        .eq('id', selectedProgram.id)
      if (error) throw error

      // Notify the supervisor who requested it
      if (selectedProgram.requested_by) {
        await supabase.from('notifications').insert({
          user_id: selectedProgram.requested_by,
          title: approve ? '✅ Program Budget Approved' : '❌ Program Budget Rejected',
          content: approve
            ? `Your program "${selectedProgram.name}" (${Number(selectedProgram.budget).toLocaleString()} RWF) has been approved by Finance and is now active.`
            : `Your program "${selectedProgram.name}" budget request was rejected. ${approvalNote ? 'Reason: ' + approvalNote : ''}`,
          type: approve ? 'success' : 'warning'
        })
      }

      setShowApprovalModal(false)
      setSelectedProgram(null)
      setApprovalNote('')
      fetchPendingPrograms()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setApproving(false)
    }
  }

  const openApprovalModal = (prog) => {
    setSelectedProgram(prog)
    setShowApprovalModal(true)
  }

  const balance = stats.income - stats.expense
  const canAfford = selectedProgram ? balance >= (selectedProgram.budget || 0) : false

  const handleExport = () => {
    const data = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description, t.category, t.type, t.amount
      ])
    ]
    const csv = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `Financial_Report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('transactions').insert([{
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        created_by: user?.id
      }])
      if (error) throw error
      setShowModal(false)
      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0] })
      fetchTransactions()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredTransactions = transactions.filter(t =>
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Control</h1>
          <p className="text-slate-500 mt-1">Manage organizational funds and expenses.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} /><span>Export CSV</span>
          </button>
          {profile?.role !== 'ceo' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={18} /><span>Record Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-900 rounded-[32px] p-8 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-primary-200 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
            <h2 className="text-4xl font-bold">{balance.toLocaleString()} RWF</h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full">
              <TrendingUp size={13} /><span>Live from database</span>
            </div>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform" size={140} />
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Income</p>
          <h2 className="text-3xl font-bold text-slate-900">{stats.income.toLocaleString()} RWF</h2>
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
            <TrendingDown size={24} />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Expenses</p>
          <h2 className="text-3xl font-bold text-slate-900">{stats.expense.toLocaleString()} RWF</h2>
        </div>
      </div>

      {/* PENDING BUDGET APPROVALS - visible to finance/admin only */}
      {isFinance && pendingPrograms.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Budget Approval Requests</h3>
              <p className="text-amber-700 text-xs">{pendingPrograms.length} program{pendingPrograms.length > 1 ? 's' : ''} awaiting your financial review</p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingPrograms.map(prog => (
              <div key={prog.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-800 shrink-0 mt-0.5">
                    <Target size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{prog.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested by <span className="font-semibold">{prog.requester?.full_name || 'Supervisor'}</span>
                    </p>
                    <p className="text-sm font-bold text-amber-700 mt-1">
                      Budget: {Number(prog.budget).toLocaleString()} RWF
                    </p>
                    <p className={`text-xs font-bold mt-0.5 ${balance >= prog.budget ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {balance >= prog.budget
                        ? `✓ Balance sufficient (${balance.toLocaleString()} RWF available)`
                        : `✗ Insufficient balance (${balance.toLocaleString()} RWF available)`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openApprovalModal(prog)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-xl text-xs font-bold hover:bg-primary-900 transition-all whitespace-nowrap"
                >
                  <CheckCircle2 size={14} /> Review & Decide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:bg-white transition-all"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><p className="font-bold text-slate-900">{t.description}</p></td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">{t.category}</span></td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{new Date(t.date).toLocaleDateString()}</td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()} RWF
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}} className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden">
              <div className="bg-primary-900 p-8 text-white">
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X size={18}/></button>
                <h2 className="text-2xl font-bold">Record Transaction</h2>
                <p className="text-primary-200 text-sm mt-1">Log a new income or expense</p>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Amount (RWF)</label>
                    <input required type="number" min="0" step="0.01" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Type</label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm font-bold appearance-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="income">Income (+)</option>
                      <option value="expense">Expense (-)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                    <input required type="text" placeholder="e.g. Donations, Payroll" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                    <input required type="date" className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
                  <button disabled={saving} className="flex-[2] bg-primary-800 text-white py-4 rounded-2xl font-bold hover:bg-primary-900 flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                    <span>Save Transaction</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Approval Modal */}
      <AnimatePresence>
        {showApprovalModal && selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowApprovalModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-primary-900 p-6 text-white">
                <button onClick={() => setShowApprovalModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><X size={16}/></button>
                <h3 className="text-lg font-bold">Budget Review</h3>
                <p className="text-primary-200 text-sm mt-0.5">{selectedProgram.name}</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Financial summary */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Balance</span>
                    <span className="font-bold text-slate-900">{balance.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Requested Budget</span>
                    <span className="font-bold text-amber-900">{Number(selectedProgram.budget).toLocaleString()} RWF</span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-xl border ${canAfford ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${canAfford ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Balance After Approval
                    </span>
                    <span className={`font-bold ${canAfford ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {(balance - Number(selectedProgram.budget)).toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                {!canAfford && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>Insufficient balance. Approving this will put the organization in a deficit. Proceed with caution.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Note (optional - for rejection)</label>
                  <textarea rows={2} placeholder="Reason for rejection..."
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-800/5 text-sm resize-none transition-all"
                    value={approvalNote} onChange={e => setApprovalNote(e.target.value)} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleApprove(false)} disabled={approving}
                    className="flex-1 py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                    <XCircle size={16}/> Reject
                  </button>
                  <button onClick={() => handleApprove(true)} disabled={approving}
                    className={`flex-[2] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all ${canAfford ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                    {approving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                    {canAfford ? 'Approve & Activate' : 'Approve Anyway'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Financials