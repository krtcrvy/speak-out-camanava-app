// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  const { contact_no, otp } = await req.json();

  if (!contact_no || !otp) {
    return new Response(JSON.stringify({ error: 'Missing contact number or OTP' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .from('users')
    .select('uid, otp_code')
    .eq('contact_no', contact_no)
    .single();

  if (error || !data || data.otp_code !== otp) {
    return new Response(JSON.stringify({ error: 'Invalid OTP or number' }), { status: 401 });
  }

  // Optional: Clear OTP after verification (recommended even in dev)
  await supabase
    .from('users')
    .update({ otp_code: null })
    .eq('contact_no', contact_no);

  // Create an auth session (REAL Supabase session)
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession(data.uid);

  if (sessionError || !sessionData) {
    return new Response(JSON.stringify({ error: 'Session creation failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({
    access_token: sessionData.access_token,
    refresh_token: sessionData.refresh_token,
    user: sessionData.user,
  }), { status: 200 });
});
