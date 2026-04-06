import { z } from "zod";

const phoneRegex = /^[\d\s\-+()]{6,20}$/;

export const referralSchema = z
  .object({
    // Section 1: Referrer Details
    organisationName: z.string().min(1, "Organisation name is required"),
    organisationSuburb: z.string().min(1, "Organisation suburb is required"),
    referrerName: z.string().min(1, "Referrer name is required"),
    position: z.string().min(1, "Position is required"),
    referrerPhone: z.string().regex(phoneRegex, "Invalid phone number"),
    referrerEmail: z.string().email("Invalid email address"),

    // Section 2: Triage & Risk
    triageUrgency: z.enum(["low", "medium", "high", "critical"], {
      message: "Triage urgency is required",
    }),
    crisisAcknowledgement: z.literal(true, {
      message: "You must acknowledge this statement",
    }),

    // Section 3: Participant Consent
    informedConsent: z.enum(["yes", "no"], {
      message: "Informed consent is required",
    }),
    participantAwareness: z.enum(["yes", "partial", "no"], {
      message: "Participant awareness is required",
    }),
    participantAwarenessElaboration: z.string().optional(),

    // Section 4: Participant Information
    participantName: z.string().min(1, "Participant name is required"),
    participantDob: z.string().min(1, "Date of birth is required"),
    genderIdentity: z.enum(["female", "male", "non-binary", "other", ""]).optional(),
    genderOther: z.string().optional(),
    participantPhone: z.string().regex(phoneRegex, "Invalid phone number"),
    participantEmail: z.string().email("Invalid email").or(z.literal("")),
    participantAddress: z.string().optional(),
    safeToLeaveMessage: z.enum(["yes", "no"], {
      message: "This field is required",
    }),
    interpreterRequired: z.enum(["yes", "no"], {
      message: "This field is required",
    }),

    // Section 5: Case Management & Clinical Triage
    reasonForReferral: z.string().min(1, "Reason for referral is required"),
    knownBarriers: z
      .array(z.string())
      .min(1, "Select at least one barrier"),
    interventionArea: z.string().optional(),
    supportTypeRequired: z.string().optional(),
    alertsAndRisks: z.array(z.string()).optional(),
    additionalRiskInfo: z.string().optional(),
    currentSupports: z.array(z.string()).optional(),
    currentSupportsOther: z.string().optional(),
    functionalCapacity: z.enum(
      ["highly-dysregulated", "intermittently-engaged", "engaged-with-support", "ready-for-activation"],
      { message: "Functional capacity is required" }
    ),
    additionalInfo: z.string().optional(),

    // Section 6: Funding, Approval & Accounts
    fundingSource: z.string().min(1, "Funding source is required"),
    fundingSourceOther: z.string().optional(),
    programFundingBody: z.string().optional(),
    claimReferenceNumber: z.string().optional(),
    ndisNumber: z.string().optional(),
    financialApproval: z.enum(["approved", "pending", "not-requested"], {
      message: "Financial approval status is required",
    }),
    approverName: z.string().optional(),
    approverPosition: z.string().optional(),
    approverEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
    sessionsApproved: z.number().int().positive().optional().or(z.literal(0)),
    totalBudgetApproved: z.number().positive().optional().or(z.literal(0)),
    approvalScopeUnknown: z.boolean().optional(),
    financialResponsibility: z.enum(
      ["referring-organisation", "funding-body", "third-party", "private"],
      { message: "Financial responsibility is required" }
    ),
    fundingResponsibilityAck: z.literal(true, {
      message: "You must acknowledge this statement",
    }),
    servicesNotCommenceAck: z.literal(true, {
      message: "You must acknowledge this statement",
    }),
    invoicingMethod: z.enum(["purchase-order", "accounts-liaise", "no-po"], {
      message: "Invoicing method is required",
    }),
    accountsContactName: z.string().optional(),
    accountsContactEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
    accountsContactPhone: z.string().optional(),
    billingOrgName: z.string().optional(),
    billingContactName: z.string().optional(),
    billingEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
    billingAccountsPayable: z.string().optional(),
    billingAddress: z.string().optional(),

    // Section 7: Submission & Service Agreement
    referralReviewAck: z.literal(true, {
      message: "You must acknowledge this statement",
    }),
    referrerDeclaration: z.literal(true, {
      message: "You must confirm this declaration",
    }),
  })
  .refine(
    (data) => {
      if (data.informedConsent === "no") return false;
      return true;
    },
    {
      message: "Referral cannot proceed without participant consent",
      path: ["informedConsent"],
    }
  )
  .refine(
    (data) => {
      if (data.participantAwareness === "no" && !data.participantAwarenessElaboration?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Please elaborate on participant awareness",
      path: ["participantAwarenessElaboration"],
    }
  );

export type ReferralFormData = z.infer<typeof referralSchema>;

// Sanitise text input — strip HTML tags
export function sanitise(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

// Recursively sanitise all string values in an object
export function sanitiseAll<T>(obj: T): T {
  if (typeof obj === "string") return sanitise(obj) as T;
  if (Array.isArray(obj)) return obj.map(sanitiseAll) as T;
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitiseAll(value);
    }
    return result as T;
  }
  return obj;
}
