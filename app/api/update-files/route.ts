import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { referenceNumber, uploadedFiles } = await request.json();

    if (!referenceNumber || !uploadedFiles) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("referrals")
      .update({ uploaded_files: uploadedFiles })
      .eq("reference_number", referenceNumber);

    if (error) {
      console.error("Update files error:", error);
      return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update files error:", err);
    return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
  }
}
