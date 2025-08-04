import express from 'express'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Phone is required' })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase.from('mock_otps').upsert(
    { phone, code, expires_at: expires },
    { onConflict: 'phone' }
  )

  const response = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.SEMAPHORE_API_KEY,
      number: `+63${phone}`,
      message: `Your SpeakOut OTP is ${code}`,
      sendername: 'SPEAKOUT'
    })
  })

  const smsResult = await response.json()
  res.json({ success: true, sms: smsResult })
})

app.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  const { data: otpRecord, error } = await supabase
    .from('mock_otps')
    .select('*')
    .eq('phone', phone)
    .single();

  if (
    error ||
    !otpRecord ||
    otpRecord.code !== code ||
    new Date(otpRecord.expires_at) < new Date()
  ) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  // ✅ Fetch user list
  const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  let user = usersList?.users?.find((u: any) => u.phone === phone);

  if (!user) {
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
    });

    if (createError || !createdUser?.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    user = createdUser.user;
  }

  // ✅ Generate JWT
  const jwtPayload = {
    sub: user.id,
    phone_number: phone,
    role: 'authenticated',
  };

  const token = jwt.sign(jwtPayload, process.env.SUPABASE_JWT_SECRET!, {
    expiresIn: '1h',
    issuer: 'speakout-app',
  });

  // ✅ Clean up used OTP
  await supabase.from('mock_otps').delete().eq('phone', phone);

  res.json({ success: true, access_token: token });
});
