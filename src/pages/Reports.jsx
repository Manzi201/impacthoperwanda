import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Download, 
  Calendar,
  ChevronDown,
  Activity,
  Users,
  Target
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
  Pie
} from 'recharts'

const Reports = () => {
  const [stats, setStats] = useState({
    beneficiaries: 0,
    programs: 0,
    income: 0,
    expenses: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: bCount } = await supabase.from('beneficiaries').select('*', { count: 'exact', head: true })
        const { count: pCount } = await supabase.from('programs').select('*', { count: 'exact', head: true })
        const { data: tData } = await supabase.from('transactions').select('amount, type')

        const income = tData?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const expenses = tData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0

        setStats({
          beneficiaries: bCount || 0,
          programs: pCount || 0,
          income,
          expenses
        })
      } catch (error) {
        console.error(error)
      }
    }

    fetchStats()
  }, [])

  const handleExportCSV = () => {
    const rows = [
      ['Impact Hope Rwanda MIS - Full System Report'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['Metric', 'Value'],
      ['Total Beneficiaries', stats.beneficiaries],
      ['Total Programs', stats.programs],
      ['Total Income (RWF)', stats.income],
      ['Total Expenses (RWF)', stats.expenses],
      ['Net Balance (RWF)', stats.income - stats.expenses],
      ['ROI (%)', stats.income > 0 ? ((stats.income - stats.expenses) / stats.income * 100).toFixed(1) : 0]
    ]
    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `MIS_Report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const chartData = [
    { name: 'Beneficiaries', value: stats.beneficiaries, color: '#0f172a' },
    { name: 'Programs', value: stats.programs, color: '#0891b2' },
    { name: 'Revenue (RWF)', value: stats.income, color: '#10b981' },
    { name: 'Costs (RWF)', value: stats.expenses, color: '#f43f5e' }
  ]


  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Reports</h1>
          <p className="text-slate-500 mt-1">Advanced analytics and organizational metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
            <Calendar size={18} />
            <span>Last 30 Days</span>
            <ChevronDown size={14} />
          </button>
          <button className="btn-primary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metric Summary Bar Chart */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900">Resource Distribution</h3>
              <p className="text-slate-500 text-xs mt-1">Comparison of key system metrics</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <BarChart3 size={20} />
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900">Budget Composition</h3>
              <p className="text-slate-500 text-xs mt-1">Income vs Expenditure ratio</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <PieIcon size={20} />
            </div>
          </div>

          <div className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Income', value: stats.income },
                    { name: 'Expenses', value: stats.expenses }
                  ]}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROI</span>
              <span className="text-xl font-bold text-slate-900">
                {stats.income > 0 ? ((stats.income - stats.expenses) / stats.income * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Retention', value: '94%', icon: Activity, color: 'text-primary-800' },
          { label: 'Impact', value: 'High', icon: Target, color: 'text-amber-600' },
          { label: 'Reach', value: stats.beneficiaries, icon: Users, color: 'text-indigo-600' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-xl font-bold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reports
