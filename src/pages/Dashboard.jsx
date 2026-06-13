import { useState, useEffect } from 'react'
import { 
  Users, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  ShieldCheck, 
  UserPlus, 
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  BookOpen,
  FileText,
  Eye,
  PieChart
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts'

// ─── Shared Components ──────────────────────────────────────────────────────

const StatCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      {change && (
        <span className={`flex items-center text-xs font-bold ${change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      )}
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
  </div>
)

const QuickActionCard = ({ icon: Icon, label, sublabel, onClick, variant = 'light', color = 'bg-primary-50', textColor = 'text-primary-800' }) => {
  if (variant === 'dark') {
    return (
      <button
        onClick={onClick}
        className="p-6 bg-primary-900 text-white rounded-3xl flex items-center gap-5 hover:shadow-2xl hover:shadow-primary-900/20 transition-all text-left group relative overflow-hidden"
      >
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
          <Icon size={24} />
        </div>
        <div className="relative z-10">
          <p className="font-bold text-base">{label}</p>
          <p className="text-primary-200 text-xs uppercase tracking-widest mt-0.5 font-medium">{sublabel}</p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
          <Icon size={100} />
        </div>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="p-6 bg-white rounded-3xl border border-slate-100 flex items-center gap-5 hover:shadow-xl transition-all text-left group shadow-sm"
    >
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center ${textColor} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="font-bold text-base text-slate-900">{label}</p>
        <p className="text-slate-500 text-xs uppercase tracking-widest mt-0.5 font-medium">{sublabel}</p>
      </div>
    </button>
  )
}

const ActivityFeed = ({ activities }) => (
  <div className="space-y-3">
    {activities.length > 0 ? (
      activities.map((activity, idx) => (
        <div key={activity.id || idx} className="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors border-b border-slate-50 last:border-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activity.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
            activity.type === 'warning' ? 'bg-amber-50 text-amber-600' :
            'bg-primary-50 text-primary-800'
          }`}>
            {activity.type === 'success' ? <CheckCircle2 size={16} /> :
             activity.type === 'warning' ? <AlertCircle size={16} /> :
             <Info size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">{activity.title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{activity.content}</p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-full">
              {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
          <Activity size={28} />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No activities yet</p>
      </div>
    )}
  </div>
)

const SectionCard = ({ title, badge, children }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      {badge && <span className="text-[10px] bg-primary-50 text-primary-800 px-2 py-1 rounded-full font-bold uppercase tracking-wider">{badge}</span>}
    </div>
    {children}
  </div>
)

// ─── Role Dashboards ─────────────────────────────────────────────────────────

// ADMIN Dashboard
const AdminDashboard = ({ stats, activities, navigate, handleExport }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <QuickActionCard icon={UserPlus} label="Create New User" sublabel="Provision Staff Access" onClick={() => navigate('/admin/create-user')} variant="dark" />
      <QuickActionCard icon={Users} label="User Directory" sublabel="Manage Permissions" onClick={() => navigate('/admin/users')} color="bg-primary-50" textColor="text-primary-800" />
      <QuickActionCard icon={ShieldCheck} label="System Reports" sublabel="View Analytics & Logs" onClick={() => navigate('/reports')} color="bg-emerald-50" textColor="text-emerald-700" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="bg-primary-800" />
      <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={Target} color="bg-amber-600" />
      <StatCard title="Beneficiaries" value={stats.totalBeneficiaries || 0} icon={Activity} color="bg-emerald-600" />
    </div>

    <SectionCard title="System Activities" badge="Live">
      <div className="overflow-y-auto max-h-80 pr-1">
        <ActivityFeed activities={activities} />
      </div>
      <div className="mt-4 p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <p className="text-xs font-medium text-slate-600">Database Connection Active</p>
      </div>
    </SectionCard>
  </>
)

// CEO Dashboard
const CEODashboard = ({ stats, activities, navigate, handleExport }) => {
  const pieData = [
    { name: 'Income', value: stats.totalFunds || 0, color: '#10b981' },
    { name: 'Expenses', value: stats.expenses || 0, color: '#f43f5e' }
  ]

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Beneficiaries" value={stats.totalBeneficiaries || 0} icon={Users} color="bg-primary-800" />
        <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={Target} color="bg-amber-600" />
        <StatCard title="Total Income" value={`${(stats.totalFunds || 0).toLocaleString()} RWF`} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Total Expenses" value={`${(stats.expenses || 0).toLocaleString()} RWF`} icon={TrendingDown} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <QuickActionCard icon={BarChart3} label="View Reports" sublabel="Full Analytics" onClick={() => navigate('/reports')} variant="dark" />
        <QuickActionCard icon={Download} label="Export Report" sublabel="Download CSV" onClick={handleExport} color="bg-emerald-50" textColor="text-emerald-700" />
        <QuickActionCard icon={Eye} label="All Programs" sublabel="View Initiatives" onClick={() => navigate('/programs')} color="bg-amber-50" textColor="text-amber-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Financial Overview" badge="Live">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[8,8,0,0]} barSize={48}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Recent Activities" badge="Live">
          <div className="overflow-y-auto max-h-60">
            <ActivityFeed activities={activities} />
          </div>
        </SectionCard>
      </div>
    </>
  )
}

// FINANCE Dashboard
const FinanceDashboard = ({ stats, activities, navigate, handleExport }) => {
  const chartData = [
    { name: 'Income', value: stats.totalFunds || 0 },
    { name: 'Expenses', value: stats.expenses || 0 },
    { name: 'Balance', value: Math.max(0, (stats.totalFunds || 0) - (stats.expenses || 0)) }
  ]

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-primary-900 rounded-3xl p-7 text-white relative overflow-hidden group col-span-1">
          <p className="text-primary-200 text-xs font-bold uppercase tracking-widest mb-1">Net Balance</p>
          <h2 className="text-3xl font-bold">{((stats.totalFunds || 0) - (stats.expenses || 0)).toLocaleString()} RWF</h2>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full">
            <TrendingUp size={13} />
            <span>Live from database</span>
          </div>
          <Wallet className="absolute -right-3 -bottom-3 text-white/5 group-hover:scale-110 transition-transform" size={110} />
        </div>
        <StatCard title="Total Income" value={`${(stats.totalFunds || 0).toLocaleString()} RWF`} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Total Expenses" value={`${(stats.expenses || 0).toLocaleString()} RWF`} icon={TrendingDown} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <QuickActionCard icon={Wallet} label="Log Transaction" sublabel="Record Income / Expense" onClick={() => navigate('/financials')} variant="dark" />
        <QuickActionCard icon={Download} label="Export Financial Report" sublabel="Download CSV" onClick={handleExport} color="bg-emerald-50" textColor="text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Budget Breakdown" badge="Live">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[8,8,0,0]} barSize={48} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Recent Activities" badge="Live">
          <div className="overflow-y-auto max-h-60">
            <ActivityFeed activities={activities} />
          </div>
        </SectionCard>
      </div>
    </>
  )
}

// EDUCATION OFFICER Dashboard
const EducationDashboard = ({ stats, activities, navigate }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <StatCard title="Total Beneficiaries" value={stats.totalBeneficiaries || 0} icon={Users} color="bg-primary-800" />
      <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={BookOpen} color="bg-amber-600" />
      <StatCard title="Program Completion" value={`${stats.programCompletion || 0}%`} icon={Activity} color="bg-emerald-600" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <QuickActionCard icon={Users} label="Register Beneficiary" sublabel="Add New Student / Client" onClick={() => navigate('/beneficiaries')} variant="dark" />
      <QuickActionCard icon={FileText} label="View Program Reports" sublabel="Assigned Initiatives" onClick={() => navigate('/reports')} color="bg-amber-50" textColor="text-amber-700" />
    </div>

    <SectionCard title="Recent Activities" badge="Live">
      <div className="overflow-y-auto max-h-72">
        <ActivityFeed activities={activities} />
      </div>
    </SectionCard>
  </>
)

// PROGRAM SUPERVISOR Dashboard
const SupervisorDashboard = ({ stats, activities, navigate, handleExport }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={Target} color="bg-primary-800" />
      <StatCard title="Total Beneficiaries" value={stats.totalBeneficiaries || 0} icon={Users} color="bg-amber-600" />
      <StatCard title="Program Completion" value={`${stats.programCompletion || 0}%`} icon={Activity} color="bg-emerald-600" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <QuickActionCard icon={Target} label="Manage Programs" sublabel="Create & Update" onClick={() => navigate('/programs')} variant="dark" />
      <QuickActionCard icon={Users} label="Beneficiaries" sublabel="View & Manage" onClick={() => navigate('/beneficiaries')} color="bg-amber-50" textColor="text-amber-700" />
      <QuickActionCard icon={Download} label="Export Program Report" sublabel="Download CSV" onClick={handleExport} color="bg-emerald-50" textColor="text-emerald-700" />
    </div>

    <SectionCard title="Recent Activities" badge="Live">
      <div className="overflow-y-auto max-h-72">
        <ActivityFeed activities={activities} />
      </div>
    </SectionCard>
  </>
)

// HR Dashboard
const HRDashboard = ({ stats, activities, navigate, handleExport }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <StatCard title="Total Staff" value={stats.totalUsers || 0} icon={Users} color="bg-primary-800" />
      <StatCard title="Active Programs" value={stats.activePrograms || 0} icon={Target} color="bg-amber-600" />
      <StatCard title="Total Beneficiaries" value={stats.totalBeneficiaries || 0} icon={Activity} color="bg-emerald-600" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <QuickActionCard icon={Users} label="Staff Directory" sublabel="View Team Members" onClick={() => navigate('/beneficiaries')} variant="dark" />
      <QuickActionCard icon={BarChart3} label="View Reports" sublabel="HR Analytics" onClick={() => navigate('/reports')} color="bg-emerald-50" textColor="text-emerald-700" />
    </div>

    <SectionCard title="Recent Activities" badge="Live">
      <div className="overflow-y-auto max-h-72">
        <ActivityFeed activities={activities} />
      </div>
    </SectionCard>
  </>
)

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user, profile } = useAuth()
  const { getStats, getRecentActivities } = useDatabase()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalBeneficiaries: 0,
    activePrograms: 0,
    totalFunds: 0,
    expenses: 0,
    totalUsers: 0,
    programCompletion: 0
  })
  const [activities, setActivities] = useState([])

  const rawRole = profile?.role || user?.user_metadata?.role || ''
  const role = rawRole.toLowerCase().trim()
  const isAdmin = role === 'admin' || profile?.email === 'impactadmin2026@gmail.com' || user?.email === 'impactadmin2026@gmail.com'
  const effectiveRole = isAdmin ? 'admin' : role

  useEffect(() => {
    const loadData = async () => {
      const statsData = await getStats()
      if (statsData) setStats(statsData)
      const activitiesData = await getRecentActivities()
      setActivities(activitiesData || [])
    }
    loadData()
  }, [getStats, getRecentActivities])

  const getDashboardTitle = () => {
    switch (effectiveRole) {
      case 'admin':       return 'System Administrator Command Center'
      case 'hr':          return 'Human Resources Dashboard'
      case 'ceo':         return 'Executive Strategic Dashboard'
      case 'finance':     return 'Financial Control & Accounting'
      case 'supervisor':  return 'Program Supervision & Monitoring'
      case 'education':   return 'Educational Impact & Beneficiary Metrics'
      default:            return 'Impact Hope Rwanda Hub'
    }
  }

  const handleExport = () => {
    const rows = [
      ['Impact Hope Rwanda MIS - Dashboard Report'],
      ['Generated On', new Date().toLocaleString()],
      ['Role', effectiveRole],
      [''],
      ['Metric', 'Value'],
      ['Total Beneficiaries', stats.totalBeneficiaries],
      ['Active Programs', stats.activePrograms],
      ['Total Funds (RWF)', stats.totalFunds],
      ['Total Expenses (RWF)', stats.expenses],
      [''],
      ['Recent Activities'],
      ['Title', 'Content', 'Time'],
      ...activities.map(a => [a.title, a.content, new Date(a.created_at).toLocaleString()])
    ]

    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `Dashboard_Report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]

  const sharedProps = { stats, activities, navigate, handleExport }

  return (
    <div className="space-y-7 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getDashboardTitle()}</h1>
          <p className="text-slate-500 mt-1">
            Welcome, <span className="font-semibold text-slate-700">{displayName}</span>. Monitoring live operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Clock size={15} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {(effectiveRole === 'ceo' || effectiveRole === 'finance' || effectiveRole === 'supervisor') && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              <Download size={17} />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-based Dashboard Content */}
      {effectiveRole === 'admin'      && <AdminDashboard      {...sharedProps} />}
      {effectiveRole === 'ceo'        && <CEODashboard        {...sharedProps} />}
      {effectiveRole === 'finance'    && <FinanceDashboard    {...sharedProps} />}
      {effectiveRole === 'education'  && <EducationDashboard  {...sharedProps} />}
      {effectiveRole === 'supervisor' && <SupervisorDashboard {...sharedProps} />}
      {effectiveRole === 'hr'         && <HRDashboard         {...sharedProps} />}

      {/* Fallback for unknown roles */}
      {!['admin','ceo','finance','education','supervisor','hr'].includes(effectiveRole) && (
        <div className="text-center py-20">
          <Activity className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-bold">Your dashboard is being set up.</p>
          <p className="text-slate-400 text-sm mt-1">Contact your administrator if this persists.</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
