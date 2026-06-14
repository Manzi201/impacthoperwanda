import { useState, useEffect } from 'react'
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Download,
  Activity,
  Users,
  Target,
  Wallet,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    beneficiaries: 0,
    activePrograms: 0,
    completedPrograms: 0,
    totalPrograms: 0,
    income: 0,
    expenses: 0,
    activeBeneficiaries: 0,
    graduatedBeneficiaries: 0,
    staffCount: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Beneficiaries breakdown
        const { data: bData } = await supabase
          .from('beneficiaries')
          .select('status')

        const activeBenef = bData?.filter(b => b.status === 'active').length || 0
        const graduatedBenef = bData?.filter(b => b.status === 'graduated').length || 0
        const totalBenef = bData?.length || 0

        // Programs breakdown
        const { data: pData } = await supabase
          .from('programs')
          .select('status')

        const activeP = pData?.filter(p => p.status === 'active').length || 0
        const completedP = pData?.filter(p => p.status === 'completed').length || 0
        const totalP = pData?.length || 0

        // Transactions
        const { data: tData } = await supabase
          .from('transactions')
          .select('amount, type')

        const income = tData?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const expenses = tData?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        // Staff count
        const { count: staffCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        setStats({
          beneficiaries: totalBenef,
          activePrograms: activeP,
          completedPrograms: completedP,
          totalPrograms: totalP,
          income,
          expenses,
          activeBeneficiaries: activeBenef,
          graduatedBeneficiaries: graduatedBenef,
          staffCount: staffCount || 0
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const netBalance = stats.income - stats.expenses
  const budgetUtilisation = stats.income > 0
    ? Math.min(100, Math.round((stats.expenses / stats.income) * 100))
    : 0
  const programCompletionRate = stats.totalPrograms > 0
    ? Math.round((stats.completedPrograms / stats.totalPrograms) * 100)
    : 0
  const beneficiaryRetention = stats.beneficiaries > 0
    ? Math.round(((stats.activeBeneficiaries + stats.graduatedBeneficiaries) / stats.beneficiaries) * 100)
    : 0

  const financialChartData = [
    { name: 'Income', value: stats.income, color: '#10b981' },
    { name: 'Expenses', value: stats.expenses, color: '#f43f5e' },
    { name: 'Balance', value: Math.max(0, netBalance), color: '#0f172a' }
  ]

  const beneficiaryChartData = [
    { name: 'Active', value: stats.activeBeneficiaries, color: '#10b981' },
    { name: 'Graduated', value: stats.graduatedBeneficiaries, color: '#6366f1' },
    { name: 'Inactive', value: Math.max(0, stats.beneficiaries - stats.activeBeneficiaries - stats.graduatedBeneficiaries), color: '#94a3b8' }
  ].filter(d => d.value > 0)

  const handleExportCSV = () => {
    const rows = [
      ['Impact Hope Rwanda MIS - Full System Report'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['BENEFICIARIES'],
      ['Total Beneficiaries', stats.beneficiaries],
      ['Active Beneficiaries', stats.activeBeneficiaries],
      ['Graduated Beneficiaries', stats.graduatedBeneficiaries],
      [''],
      ['PROGRAMS'],
      ['Total Programs', stats.totalPrograms],
      ['Active Programs', stats.activePrograms],
      ['Completed Programs', stats.completedPrograms],
      ['Completion Rate (%)', programCompletionRate],
      [''],
      ['FINANCIALS'],
      ['Total Income (RWF)', stats.income],
      ['Total Expenses (RWF)', stats.expenses],
      ['Net Balance (RWF)', netBalance],
      ['Budget Utilisation (%)', budgetUtilisation],
      [''],
      ['STAFF'],
      ['Total Staff', stats.staffCount]
    ]
    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `MIS_Report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-sm">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Reports</h1>
          <p className="text-slate-500 mt-1">Live analytics from database — no demo data.</p>
        </div>
        <button className="btn-primary" onClick={handleExportCSV}>
          <Download size={18} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Summary Cards - all real data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Beneficiaries',
            value: stats.beneficiaries,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            sub: `${stats.activeBeneficiaries} active`
          },
          {
            label: 'Program Completion',
            value: `${programCompletionRate}%`,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            sub: `${stats.completedPrograms} of ${stats.totalPrograms} programs`
          },
          {
            label: 'Budget Utilisation',
            value: `${budgetUtilisation}%`,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            sub: `of total income`
          },
          {
            label: 'Beneficiary Retention',
            value: `${beneficiaryRetention}%`,
            icon: Target,
            color: 'text-primary-800',
            bg: 'bg-primary-50',
            sub: `active + graduated`
          }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color} mb-3`}>
              <item.icon size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{item.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Financial Overview</h3>
              <p className="text-slate-500 text-xs mt-1">Income vs Expenses vs Balance (RWF)</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip
                  formatter={(val) => [`${Number(val).toLocaleString()} RWF`]}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={44}>
                  {financialChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Income</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{stats.income.toLocaleString()} RWF</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Expenses</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{stats.expenses.toLocaleString()} RWF</p>
            </div>
            <div className={`p-3 rounded-2xl ${netBalance >= 0 ? 'bg-primary-50' : 'bg-rose-50'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${netBalance >= 0 ? 'text-primary-800' : 'text-rose-600'}`}>Balance</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{netBalance.toLocaleString()} RWF</p>
            </div>
          </div>
        </div>

        {/* Beneficiary Status Pie */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Beneficiary Status</h3>
              <p className="text-slate-500 text-xs mt-1">Active vs Graduated vs Inactive</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <PieIcon size={18} />
            </div>
          </div>
          <div className="h-[260px]">
            {beneficiaryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={beneficiaryChartData}
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {beneficiaryChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [val, 'Beneficiaries']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Users size={48} />
                <p className="text-sm mt-3 text-slate-400">No beneficiaries yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Programs & Staff Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
            <Target size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Programs</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activePrograms}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.completedPrograms} completed · {stats.totalPrograms} total</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-800 mb-4">
            <Users size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Staff</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.staffCount}</p>
          <p className="text-xs text-slate-400 mt-1">Registered system users</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
            <Wallet size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Balance</p>
          <p className={`text-3xl font-bold mt-1 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString()} RWF
          </p>
          <p className="text-xs text-slate-400 mt-1">{budgetUtilisation}% budget utilised</p>
        </div>
      </div>
    </div>
  )
}

export default Reports
