import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const fd = await request.formData();
    const file = fd.get("file");
    const referenceNumber = fd.get("referenceNumber");

    if (!file || !(typeof file === "object" && "arrayBuffer" in file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!referenceNumber || typeof referenceNumber !== "string") {
      return NextResponse.json({ error: "No reference number" }, { status: 400 });
    }

    const f = file as File;
    if (f.size === 0 || f.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const storagePath = `${referenceNumber}/${Date.now()}-${f.name}`;
    const buffer = Buffer.from(await f.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("referral-files")
      .upload(storagePath, buffer, {
        contentType: f.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Update the referral record to include this file
    const { data: existing } = await supabase
      .from("referrals")
      .select("uploaded_files")
      .eq("reference_number", referenceNumber)
      .single();

    const currentFiles = (existing?.uploaded_files as string[]) || [];
    await supabase
      .from("referrals")
      .update({ uploaded_files: [...currentFiles, storagePath] })
      .eq("reference_number", referenceNumber);

    return NextResponse.json({ success: true, storagePath });
  } catch (err) {
    console.error("Upload file error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
