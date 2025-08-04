// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

serve(async (req) => {
  try {
    console.log('📩 OTP verification request received')

    const { phone, code } = await req.json()
    console.log('📨 Payload:', { phone, code })

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Phone and code are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables')
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Validate OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('mock_otps')
      .select('*')
      .eq('phone', phone)
      .single()

    if (otpError) {
      console.error('❌ OTP lookup error:', otpError)
    }

    if (
      otpError ||
      !otpRecord ||
      otpRecord.code !== code ||
      new Date(otpRecord.expires_at) < new Date()
    ) {
      console.warn('⚠️ Invalid or expired OTP')
      return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Get user by phone
    const { data: users, error: userFetchError } = await supabase
      .from('users')
      .select('uid')
      .eq('contact_no', phone)
      .limit(1)

    if (userFetchError || !users || users.length === 0) {
      console.error('❌ User not found:', userFetchError)
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = users[0].uid

    // 3. Create a session for the user (mocked)
    const access_token = `MOCK_ACCESS_TOKEN_${userId}`
    const refresh_token = `MOCK_REFRESH_TOKEN_${userId}`

    // 4. Delete OTP
    await supabase.from('mock_otps').delete().eq('phone', phone)

    console.log('✅ OTP verified, session created for UID:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        session: { access_token, refresh_token },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('❌ Uncaught error in verify-otp:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
