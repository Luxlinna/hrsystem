import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, DeleteObjectCommand } from "npm:@aws-sdk/client-s3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

    const { key } = await req.json();
    if (!key || typeof key !== "string") return json({ error: "Missing or invalid key" }, 400);

    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const bucket = Deno.env.get("AWS_S3_BUCKET");
    const region = Deno.env.get("AWS_S3_REGION") || "us-east-1";

    if (!accessKeyId || !secretAccessKey || !bucket) {
      return json({ error: "AWS S3 is not configured yet." }, 501);
    }

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return json({ success: true });
  } catch (err) {
    console.error("s3-delete error:", err);
    return json({ error: String(err) }, 500);
  }
});
