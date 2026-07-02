import { NextResponse } from "next/server";
import { hasSupabaseServerConfig } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    ok: true,
    vercel: true,
    supabase: hasSupabaseServerConfig() ? "connected" : "missing_env",
    auth: hasSupabaseServerConfig() ? "ready" : "pending_supabase",
    checkedAt: new Date().toISOString()
  });
}
