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
  Info
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import { useNavigate } from 'react-router-dom'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

const StatCard = ({ title, value, change, icon: Icon, color }) => (
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
  </div>
)

const ActivityIcon = ({ type }) => {
  switch (type) {
    case 'success': return <CheckCircle2 size={18} />
    case 'warning': return <AlertCircle size={18} />
    default: return <Info size={18} />
  }
}

const Dashboard = () => {
  const { user, profile } = useAuth()
  const { getPrograms, getStats, getRecentActivities } = useDatabase()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalBeneficiaries: 0,
    activePrograms: 0,
    totalFunds: 0,
    expenses: 0
  })
  const [activities, setActivities] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const statsData = await getStats()
      if (statsData) setStats(statsData)

      const activitiesData = await getRecentActivities()
      setActivities(activitiesData)
    }
    
    loadData()
  }, [getPrograms, getStats, getRecentActivities])

  const rawRole = profile?.role || user?.user_metadata?.role || ''
  const role = rawRole.toLowerCase().trim()
  const isAdmin = role === 'admin' || profile?.email === 'impactadmin2026@gmail.com' || user?.email === 'impactadmin2026@gmail.com'

  const getDashboardTitle = () => {
    switch(role) {
      case 'admin': return 'System Administrator Command Center'
      case 'hr': return 'Human Resources Operations'
      case 'ceo': return 'Executive Strategic Dashboard'
      case 'finance': return 'Financial Control & Accounting'
      case 'supervisor': return 'Program Supervision & Monitoring'
      case 'education': return 'Educational Impact & Student Metrics'
      default: return 'Impact Hope Rwanda Hub'
    }
  }

  const chartData = [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 }
  ]

  const handleExport = () => {
    const data = [
      ['Impact Hope Rwanda MIS - System Report'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['Dashboard Statistics'],
      ['Metric', 'Value'],
      ['Total Beneficiaries', stats.totalBeneficiaries],
      ['Active Programs', stats.activePrograms],
      ['Total Funds', `${stats.totalFunds} RWF`],
      [''],
      ['Recent System Activities'],
      ['Title', 'Content', 'Time'],
      ...activities.map(a => [a.title, a.content, new Date(a.created_at).toLocaleString()])
    ]

    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `MIS_Report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getDashboardTitle()}</h1>
          <p className="text-slate-500 mt-1">Welcome, {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}. Monitoring live operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Clock size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Admin View */}
      {isAdmin ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
              onClick={() => navigate('/admin/create-user')}
              className="p-6 bg-primary-900 text-white rounded-3xl flex items-center gap-6 hover:shadow-2xl hover:shadow-primary-900/20 transition-all text-left group relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform relative z-10">
                <UserPlus size={28} />
              </div>
              <div className="relative z-10">
                <p className="font-bold text-lg">Create New User Account</p>
                <p className="text-primary-200 text-xs uppercase tracking-widest mt-1 font-medium">Provision Staff Access</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
                <UserPlus size={120} />
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/users')}
              className="p-6 bg-white rounded-3xl border border-slate-100 flex items-center gap-6 hover:shadow-xl transition-all text-left group shadow-sm"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-800 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900">User Directory</p>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1 font-medium">Manage Permissions</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="p-6 bg-white rounded-3xl border border-slate-100 flex items-center gap-6 hover:shadow-xl transition-all text-left group shadow-sm"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900">System Reports</p>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1 font-medium">View Analytics & Logs</p>
              </div>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Real Activities Section for Admin */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">System Activities Overview</h3>
                <span className="text-[10px] bg-primary-50 text-primary-800 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Live Data</span>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {activities.length > 0 ? (
                  activities.map((activity, idx) => (
                    <div key={activity.id || idx} className="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors group border-b border-slate-50 last:border-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activity.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        activity.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                        'bg-primary-50 text-primary-800'
                      }`}>
                        <ActivityIcon type={activity.type} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 leading-tight truncate">{activity.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{activity.content}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-full">
                          {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                      <Activity size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No activities yet</p>
                    <p className="text-xs text-slate-400 mt-1">System events will appear here</p>
                  </div>
                )}
              </div>
              
              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System Health</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-slate-600">Database Connection Active</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Beneficiaries" 
          value={stats.totalBeneficiaries || 0} 
          icon={Users}
          color="bg-primary-800"
        />
        <StatCard 
          title="Active Programs" 
          value={stats.activePrograms || 0} 
          icon={Target}
          color="bg-amber-600"
        />
        <StatCard 
          title="Students Enrolled" 
          value={stats.studentsEnrolled || 0} 
          icon={Target}
          color="bg-emerald-600"
        />
        <StatCard 
          title="Program Completion" 
          value={`${stats.programCompletion || 0}%`} 
          icon={Activity}
          color="bg-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Organizational Growth</h3>
              <p className="text-slate-500 text-xs mt-1">Live metrics from database</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 px-4 py-2 outline-none">
              <option>Last 6 Months</option>
              <option>Yearly</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0f172a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Activities Section */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Activities</h3>
            <span className="text-[10px] bg-primary-50 text-primary-800 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Live Data</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={activity.id || idx} className="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors group border-b border-slate-50 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activity.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                    activity.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-primary-50 text-primary-800'
                  }`}>
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-tight truncate">{activity.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{activity.content}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-full">
                      {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <Activity size={32} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No activities yet</p>
                <p className="text-xs text-slate-400 mt-1">System events will appear here</p>
              </div>
            )}
          </div>

          <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System Health</p>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <p className="text-xs font-medium text-slate-600">Database Connection Active</p>
             </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
