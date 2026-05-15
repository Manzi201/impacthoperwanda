import { useState, useEffect } from 'react'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Filter, 
  Search,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const Financials = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ income: 0, expense: 0 })
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

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

  const handleExport = () => {
    const data = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type,
        t.amount
      ])
    ]

    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Financial_Report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          date: formData.date,
          created_by: user?.id
        }])
      
      if (error) throw error

      alert('Transaction recorded successfully!')
      setShowModal(false)
      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0] })
      fetchTransactions()
    } catch (error) {
      alert('Error recording transaction: ' + error.message)
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
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-900 rounded-[32px] p-8 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-primary-200 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
            <h2 className="text-4xl font-bold">{(stats.income - stats.expense).toLocaleString()} RWF</h2>
            <div className="mt-6 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
              <TrendingUp size={14} />
              <span>+4.2% from last month</span>
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

      {/* Transactions Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by description or category..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl text-xs outline-none focus:bg-white focus:border-primary-800/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{t.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">{t.category}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()} RWF
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
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
                <h2 className="text-2xl font-bold">Record Transaction</h2>
                <p className="text-primary-200 text-sm mt-1">Log a new income or expense record</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Amount (RWF)</label>
                    <input 
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-bold appearance-none"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="income">Income (+)</option>
                      <option value="expense">Expense (-)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Donations, Payroll, Logistics"
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm font-medium"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-primary-800/30 focus:ring-4 focus:ring-primary-800/5 rounded-2xl transition-all outline-none text-sm custom-scrollbar"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
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
                    <span>Save Transaction</span>
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

export default Financials
