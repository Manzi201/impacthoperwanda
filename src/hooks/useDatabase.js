import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useDatabase = () => {
  const [loading, setLoading] = useState(false)
  const getStats = useCallback(async () => {
    try {
      const { count: beneficiaries } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact', head: true })

      const { count: enrolled } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact', head: true })
        .not('program_id', 'is', null)

      const { data: programsData } = await supabase
        .from('programs')
        .select('status')
      
      const totalPrograms = programsData?.length || 0
      const activePrograms = programsData?.filter(p => p.status === 'active').length || 0
      const completedPrograms = programsData?.filter(p => p.status === 'completed').length || 0
      
      const programCompletion = totalPrograms > 0 
        ? Math.round((completedPrograms / totalPrograms) * 100) 
        : 0

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')

      const totalIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const totalExpense = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      return {
        totalBeneficiaries: beneficiaries || 0,
        activePrograms: activePrograms,
        studentsEnrolled: enrolled || 0,
        programCompletion: programCompletion,
        totalFunds: totalIncome,
        expenses: totalExpense,
        totalUsers: totalUsers || 0
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return null
    }
  }, [])

  const getPrograms = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('programs')
      .select('*, profiles:manager_id (full_name)')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Error fetching programs:', error)
      return { data: [], error }
    }
    return { data, error: null }
  }, [])

  const createProgram = useCallback(async (program) => {
    const { data, error } = await supabase
      .from('programs')
      .insert([program])
      .select()
      .single()

    if (error) {
      console.error('Error creating program:', error)
      return { data: null, error }
    }

    return { data, error: null }
  }, [])

  const getRecentActivities = useCallback(async () => {
    // We use notifications as a proxy for general system activities
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    return data || []
  }, [])

  const getUsers = useCallback(async () => {
    return await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
  }, [])

  return { getStats, getPrograms, createProgram, getRecentActivities, getUsers }
}
