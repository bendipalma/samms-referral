import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { referenceNumber, fileName } = await request.json();

    if (!referenceNumber || !fileName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const storagePath = `${referenceNumber}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from("referral-files")
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      storagePath,
      token: data.token,
    });
  } catch (err) {
    console.error("Upload URL error:", err);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
