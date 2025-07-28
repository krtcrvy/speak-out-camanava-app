// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

function generateOtp(): string {
  const digits = '0123456789';
  let otp = '';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    otp += digits[array[i] % 10];
  }
  return otp;
}

serve(async (req) => {
  const { phoneNumber } = await req.json();

  if (!phoneNumber) {
    return new Response(JSON.stringify({ error: 'Missing phoneNumber' }), { status: 400 });
  }

  console.log('Incoming phone number:', phoneNumber);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const otp = generateOtp();

  const { error } = await supabase
    .from('users')
    .update({ otp_code: otp })
    .eq('contact_no', phoneNumber);

  if (error) {
    console.error('Failed to update OTP in users table:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to send OTP' }), { status: 500 });
  }

  console.log(`✅ Sent OTP to +63${phoneNumber}: ${otp}`);

  return new Response(JSON.stringify({ success: true }));
});
