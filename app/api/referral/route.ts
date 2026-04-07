import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { referralSchema, sanitiseAll } from "@/lib/validation";

// Simple in-memory rate limiter: 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function generateReferenceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SAM-${year}${month}${day}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let formData: Record<string, unknown>;
    const files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData();
      const jsonData = fd.get("data");
      if (!jsonData || typeof jsonData !== "string") {
        return NextResponse.json({ error: "Missing form data" }, { status: 400 });
      }
      formData = JSON.parse(jsonData);

      // Collect files
      const allFiles = fd.getAll("files");
      for (const value of allFiles) {
        if (typeof value === "object" && value !== null && "arrayBuffer" in value && "name" in value) {
          const f = value as File;
          if (f.size > 0) files.push(f);
        }
      }
    } else {
      formData = await request.json();
    }

    // Sanitise all text inputs
    const sanitised = sanitiseAll(formData);

    // Parse numbers
    if (typeof sanitised.sessionsApproved === "string") {
      sanitised.sessionsApproved = sanitised.sessionsApproved
        ? parseInt(sanitised.sessionsApproved, 10)
        : 0;
    }
    if (typeof sanitised.totalBudgetApproved === "string") {
      sanitised.totalBudgetApproved = sanitised.totalBudgetApproved
        ? parseFloat(sanitised.totalBudgetApproved)
        : 0;
    }

    // Validate
    const result = referralSchema.safeParse(sanitised);
    if (!result.success) {
      const errors = result.error.flatten();
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const data = result.data;
    const supabase = createServiceClient();
    const referenceNumber = generateReferenceNumber();

    // Upload files to Supabase Storage
    const uploadedFiles: string[] = [];
    if (files.length > 0) {
      for (const file of files.slice(0, 5)) {
        if (file.size > 10 * 1024 * 1024) continue; // Skip files over 10MB
        const storagePath = `${referenceNumber}/${Date.now()}-${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("referral-files")
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });
        if (uploadError) {
          console.error("File upload error:", uploadError.message, storagePath);
        } else {
          uploadedFiles.push(storagePath);
        }
      }
    }

    // Insert into database
    const { error: dbError } = await supabase.from("referrals").insert({
      reference_number: referenceNumber,
      status: "submitted",
      organisation_name: data.organisationName,
      organisation_suburb: data.organisationSuburb,
      referrer_name: data.referrerName,
      position: data.position,
      referrer_phone: data.referrerPhone,
      referrer_email: data.referrerEmail,
      triage_urgency: data.triageUrgency,
      crisis_acknowledgement: data.crisisAcknowledgement,
      informed_consent: data.informedConsent,
      participant_awareness: data.participantAwareness,
      participant_awareness_elaboration: data.participantAwarenessElaboration || null,
      participant_name: data.participantName,
      participant_dob: data.participantDob,
      gender_identity: data.genderIdentity || null,
      gender_other: data.genderOther || null,
      participant_phone: data.participantPhone,
      participant_email: data.participantEmail || null,
      participant_address: data.participantAddress || null,
      safe_to_leave_message: data.safeToLeaveMessage,
      interpreter_required: data.interpreterRequired,
      reason_for_referral: data.reasonForReferral,
      known_barriers: data.knownBarriers,
      intervention_areas: data.interventionArea ? [data.interventionArea] : [],
      support_type_required: data.supportTypeRequired ? [data.supportTypeRequired] : [],
      alerts_and_risks: data.alertsAndRisks || [],
      additional_risk_info: data.additionalRiskInfo || null,
      current_supports: data.currentSupports || [],
      current_supports_other: data.currentSupportsOther || null,
      functional_capacity: data.functionalCapacity,
      additional_info: data.additionalInfo || null,
      funding_sources: data.fundingSource ? [data.fundingSource] : [],
      funding_source_other: data.fundingSourceOther || null,
      program_funding_body: data.programFundingBody || null,
      claim_reference_number: data.claimReferenceNumber || null,
      ndis_number: data.ndisNumber || null,
      financial_approval: data.financialApproval,
      approver_name: data.approverName || null,
      approver_position: data.approverPosition || null,
      approver_email: data.approverEmail || null,
      sessions_approved: data.sessionsApproved || null,
      total_budget_approved: data.totalBudgetApproved || null,
      approval_scope_unknown: data.approvalScopeUnknown || false,
      financial_responsibility: data.financialResponsibility,
      invoicing_method: data.invoicingMethod,
      accounts_contact_name: data.accountsContactName || null,
      accounts_contact_email: data.accountsContactEmail || null,
      accounts_contact_phone: data.accountsContactPhone || null,
      billing_org_name: data.billingOrgName || null,
      billing_contact_name: data.billingContactName || null,
      billing_email: data.billingEmail || null,
      billing_accounts_payable: data.billingAccountsPayable || null,
      billing_address: data.billingAddress || null,
      funding_responsibility_ack: data.fundingResponsibilityAck,
      services_not_commence_ack: data.servicesNotCommenceAck,
      referral_review_ack: data.referralReviewAck,
      referrer_declaration: data.referrerDeclaration,
      uploaded_files: uploadedFiles,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to submit referral. Please try again." },
        { status: 500 }
      );
    }

    // Send to Power Automate webhook
    const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
    const webhookKey = process.env.WEBHOOK_API_KEY;
    if (webhookUrl) {
      try {
        const webhookFd = new FormData();
        webhookFd.append("data", JSON.stringify({
          referenceNumber,
          ...data,
          uploadedFiles,
        }));
        // Attach actual files
        for (const file of files) {
          webhookFd.append("files", file, file.name);
        }
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "x-api-key": webhookKey || "",
          },
          body: webhookFd,
        });
      } catch (webhookErr) {
        // Don't fail the submission if webhook fails
        console.error("Power Automate webhook error:", webhookErr);
      }
    }

    return NextResponse.json({
      success: true,
      referenceNumber,
      message: "Referral submitted successfully",
    });
  } catch (err) {
    console.error("Referral submission error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
