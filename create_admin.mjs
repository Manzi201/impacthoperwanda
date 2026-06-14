import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qqzbtnaqjdtknvhnawuv.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxemJ0bmFxamR0a252aG5hd3V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NDIxMCwiZXhwIjoyMDk0MzcwMjEwfQ.qtNP5gwn4KKoRj15pgqqRaqqv1MJWYx0mtN7dJqp8Lc'

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createAdmin() {
  console.log('Creating admin user...')

  // 1. Create auth user with email already confirmed
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: 'impactadmin2026@gmail.com',
    password: 'smartadmin@impact2026',
    email_confirm: true,
    user_metadata: {
      full_name: 'Master Admin',
      role: 'admin'
    }
  })

  if (authError) {
    if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
      console.log('User already exists — updating profile...')
      // Get existing user
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      const existing = users.find(u => u.email === 'impactadmin2026@gmail.com')
      if (existing) {
        await upsertProfile(existing.id)
      }
      return
    }
    console.error('Auth error:', authError.message)
    process.exit(1)
  }

  console.log('Auth user created:', authData.user.id)
  await upsertProfile(authData.user.id)
}

async function upsertProfile(userId) {
  // 2. Create/update profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      email: 'impactadmin2026@gmail.com',
      full_name: 'Master Admin',
      role: 'admin',
      status: 'active'
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Profile error:', profileError.message)
  } else {
    console.log('✓ Profile created/updated successfully')
    console.log('-----------------------------------')
    console.log('Email   : impactadmin2026@gmail.com')
    console.log('Password: smartadmin@impact2026')
    console.log('Role    : admin')
    console.log('-----------------------------------')
  }
}

createAdmin()
