import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", profile: null });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("profiles")
    .select("id, email, full_name, onboarding_complete, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json({ ok: true, mode: "supabase", profile: data });
  }

  const { data: created, error: insertError } = await supabase!
    .from("profiles")
    .insert({ id: user.id, email: user.email, onboarding_complete: false })
    .select("id, email, full_name, onboarding_complete, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", profile: created });
}

export async function POST(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = body?.fullName === undefined ? undefined : String(body.fullName ?? "").trim();
  const onboardingComplete = body?.onboardingComplete === undefined ? undefined : Boolean(body.onboardingComplete);

  const update: Record<string, unknown> = { id: user.id, email: user.email, updated_at: new Date().toISOString() };
  if (fullName !== undefined) update.full_name = fullName;
  if (onboardingComplete !== undefined) update.onboarding_complete = onboardingComplete;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("profiles")
    .upsert(update, { onConflict: "id" })
    .select("id, email, full_name, onboarding_complete, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", profile: data });
}
