// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid or missing JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const phone = body.phone ?? body.phoneNumber;

  if (!phone) {
    return new Response(JSON.stringify({ error: 'Phone is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('mock_otps')
    .upsert({ phone, code: otpCode, expires_at: expiresAt }, { onConflict: 'phone' });

  if (error) {
    console.error('❌ Failed to upsert OTP:', error);
    return new Response(JSON.stringify({ error: 'Failed to save OTP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log(`✅ OTP ${otpCode} generated for ${phone}`);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
