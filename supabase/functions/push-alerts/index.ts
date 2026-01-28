// @ts-nocheck
console.log("⏰ Cron triggered at", new Date().toISOString());

import { createClient } from "npm:@supabase/supabase-js";
import { getDistance } from "npm:geolib";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sendPush(token: string, title: string, body: string, data: any) {
  console.log(`📤 Sending push to token: ${token}`);
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }),
  });

  const json = await res.json();
  console.log("📩 Expo response:", JSON.stringify(json));
}

Deno.serve(async () => {
  let pushesSent = 0;

  // 1. Load users
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("uid, expo_push_token, last_lat, last_lng");

  if (userErr) {
    console.error("❌ User fetch failed:", userErr.message);
    return new Response("User fetch error", { status: 500 });
  }
  console.log(`👥 Loaded ${users?.length ?? 0} users`);

  // 2. Load incidents
  const { data: incidents, error: incidentErr } = await supabase
    .from("incidents")
    .select("*");

  if (incidentErr) {
    console.error("❌ Incident fetch failed:", incidentErr.message);
    return new Response("Incident fetch error", { status: 500 });
  }
  console.log(`⚠️ Loaded ${incidents?.length ?? 0} incidents`);

  // 3. For each user, check distance
  for (const user of users ?? []) {
    if (!user.expo_push_token || !user.last_lat || !user.last_lng) {
      console.log(`⏭️ Skipping user ${user.uid} (missing token or location)`);
      continue;
    }

    // Load user settings
    const { data: settings, error: settingsErr } = await supabase
      .from("user_settings")
      .select("*")
      .eq("uid", user.uid)
      .maybeSingle();

    if (settingsErr) {
      console.error(`❌ Settings fetch failed for ${user.uid}:`, settingsErr.message);
      continue;
    }

    if (!settings) {
      console.log(`⏭️ Skipping user ${user.uid} (no settings found)`);
      continue;
    }

    const radius = settings.detection_radius ?? 200;
    console.log(`📏 User ${user.uid} radius: ${radius}m`);

    for (const incident of incidents ?? []) {
      const distance = getDistance(
        { latitude: user.last_lat, longitude: user.last_lng },
        { latitude: incident.latitude, longitude: incident.longitude }
      );

      console.log(`➡️ User ${user.uid} → Incident ${incident.id}: ${distance}m away`);

      if (distance <= radius && settings.notify_incidents) {
        console.log(`🚨 Sending push: user ${user.uid}, incident ${incident.id}`);
        await sendPush(
          user.expo_push_token,
          "🚨 Incident Nearby",
          `${incident.description} (${distance}m away)`,
          { incidentId: incident.id }
        );

        pushesSent++;

        // Log push event
        const { error: logErr } = await supabase.from("push_logs").insert({
          user_id: user.uid,
          incident_id: incident.id,
          distance,
          message: `Push sent to ${user.uid} for incident ${incident.id}`,
        });

        if (logErr) {
          console.error("❌ Failed to insert push_log:", logErr.message);
        } else {
          console.log(`📝 Logged push for user ${user.uid}, incident ${incident.id}`);
        }
      }
    }
  }

  // 4. Insert summary log (always runs, even if no pushes)
  const { error: summaryErr } = await supabase.from("push_logs").insert({
    user_id: null,
    incident_id: null,
    distance: null,
    message: `Cron completed at ${new Date().toISOString()} — pushes sent: ${pushesSent}`,
  });

  if (summaryErr) {
    console.error("❌ Failed to insert summary log:", summaryErr.message);
  } else {
    console.log(`📊 Summary log inserted (pushes sent: ${pushesSent})`);
  }

  console.log("✅ Push check completed");
  return new Response("✅ Push check done", { status: 200 });
});
