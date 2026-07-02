import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

const MATERIALS_BUCKET = "study-materials";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", materials: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("study_materials")
    .select("id, title, material_type, subject, status, concept_count, storage_path, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", materials: data ?? [] });
}

export async function POST(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const subject = String(form.get("subject") ?? "").trim() || null;
  const materialType = String(form.get("materialType") ?? "notes").trim() || "notes";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a PDF, notes, or study file." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase!.storage
    .from(MATERIALS_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase!
    .from("study_materials")
    .insert({
      user_id: userId,
      title: file.name,
      material_type: materialType,
      subject,
      status: "uploaded",
      concept_count: 0,
      storage_path: storagePath
    })
    .select("id, title, material_type, subject, status, concept_count, storage_path, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", material: data });
}
