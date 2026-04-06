"use client";

import { useState, useRef, FormEvent } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIAGE_OPTIONS = [
  { value: "low", label: "Low", desc: "Stable, routine support" },
  { value: "medium", label: "Medium", desc: "Increasing complexity" },
  { value: "high", label: "High", desc: "Active risk / instability" },
  { value: "critical", label: "Critical", desc: "Immediate risk" },
] as const;

const BARRIERS = [
  "Chronic health conditions / physical disability",
  "Visual or hearing impairment",
  "Intellectual disability",
  "Cognitive difficulties and/or Acquired Brain Injury",
  "Learning disorder",
  "Psychological / psychiatric conditions",
  "Neurodiversity (e.g. ADHD, ASD)",
  "Social skill difficulties",
  "Behavioural challenges",
  "Substance use disorders",
  "Gambling / gaming addiction",
  "Financial issues",
  "Long-term unemployment",
  "Housing / accommodation instability",
  "Family violence or safety concerns",
  "Criminal justice involvement",
  "Motivation / engagement concerns",
];

const INTERVENTION_AREAS = [
  "Mental health and/or neurodiversity support (e.g. ADHD, OCD)",
  "Support for suspected or undiagnosed mental health concerns (assessment required)",
  "Functional Capacity Assessment",
  "Alcohol and Other Drugs (AOD) support",
  "Family and parenting support",
  "Prevention and management of pro-criminal behaviours",
  "Complex barrier support (e.g. homelessness, learning disorders)",
  "Disengagement / non-attendance with services",
  "Behavioural management",
  "Trauma-related interventions",
];

const SUPPORT_TYPES = [
  "Immediate stabilisation / risk support",
  "Ongoing structured intervention",
  "Assessment / report",
  "Group-based support",
  "Unsure",
];

const ALERTS_RISKS = [
  "Self-harm or suicidal ideation",
  "Alcohol or substance misuse",
  "Participant at risk of harm",
  "Risk of harm toward others",
  "Psychosis",
  "Current or pending legal issues",
  "Child protection involvement",
  "Registered sex offender",
];

const CURRENT_SUPPORTS = [
  "GP",
  "Psychologist / Psychiatrist",
  "Alcohol and Other Drugs (AOD) services",
  "Case Manager",
  "Legal / Corrections",
  "NDIS Support Coordinator / Plan Manager",
  "Other",
];

const FUNDING_SOURCES = [
  "Employment Services – WFA",
  "Employment Services – IEA",
  "Employment Services – TTW",
  "NDIS",
  "Primary Health Network (PHN)",
  "Corrections / Justice-Linked Funding",
  "Government Program / Department Funding",
  "State-Based Funding (Victoria)",
  "Insurance / Compensation (e.g. TAC, WorkCover)",
  "Victims of Crime",
  "Organisation / Provider Funded",
  "Private / Fee for Service",
  "Other",
];

const FUNCTIONAL_CAPACITY_OPTIONS = [
  { value: "highly-dysregulated", label: "Highly dysregulated", desc: "Unable to engage" },
  { value: "intermittently-engaged", label: "Intermittently engaged", desc: "" },
  { value: "engaged-with-support", label: "Engaged with support", desc: "" },
  { value: "ready-for-activation", label: "Ready for activation", desc: "" },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SectionHeader({ number, title, subtitle }: { number: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-orange/10 text-brand-orange font-bold text-sm flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function TextInput({
  label,
  name,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
  error,
  helper,
  prefix,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  helper?: string;
  prefix?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-brand-orange">*</span>}
      </label>
      <div className={prefix ? "relative" : ""}>
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted font-medium">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`input-base ${prefix ? "pl-8" : ""} ${error ? "border-error ring-1 ring-error/20" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </div>
      {helper && !error && <p className="field-helper">{helper}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function TextArea({
  label,
  name,
  required,
  placeholder,
  value,
  onChange,
  error,
  helper,
  rows = 4,
  disabled,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  helper?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-brand-orange">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className={`input-base resize-y ${error ? "border-error ring-1 ring-error/20" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      {helper && !error && <p className="field-helper">{helper}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required,
  error,
  disabled,
}: {
  label: string;
  name: string;
  options: { value: string; label: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      {label && (
        <p className="field-label">
          {label} {required && <span className="text-brand-orange">*</span>}
        </p>
      )}
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`radio-card ${value === opt.value ? "radio-card-selected" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-brand-orange accent-brand-orange flex-shrink-0"
            />
            <div>
              <span className="text-sm font-semibold text-text-primary">{opt.label}</span>
              {opt.desc && <span className="text-sm text-text-muted"> — {opt.desc}</span>}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  required,
  error,
  helper,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
}) {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item]
    );
  };
  return (
    <div>
      <p className="field-label">
        {label} {required && <span className="text-brand-orange">*</span>}
      </p>
      {helper && <p className="field-helper mb-3">{helper}</p>}
      <div className="space-y-1">
        {options.map((opt) => (
          <label key={opt} className={`checkbox-item cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded text-brand-orange accent-brand-orange flex-shrink-0"
            />
            <span className="text-sm text-text-secondary">{opt}</span>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function SelectDropdown({
  label,
  name,
  options,
  value,
  onChange,
  required,
  error,
  helper,
  disabled,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-brand-orange">*</span>}
      </label>
      {helper && <p className="field-helper mb-2">{helper}</p>}
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10 ${error ? "border-error ring-1 ring-error/20" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <option value="">Select an option...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  error,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={`checkbox-item cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded text-brand-orange accent-brand-orange flex-shrink-0"
        />
        <span className="text-sm text-text-secondary leading-relaxed">{label}</span>
      </label>
      {error && <p className="field-error ml-7">{error}</p>}
    </div>
  );
}

function CrisisAlert({ prominent }: { prominent: boolean }) {
  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-300 ${
        prominent
          ? "border-error bg-error/5 shadow-md"
          : "border-amber-300/60 bg-amber-50/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-lg flex-shrink-0 ${prominent ? "animate-pulse" : ""}`}>
          {prominent ? "\u{1F6A8}" : "\u26A0\uFE0F"}
        </span>
        <div>
          <p className={`text-sm font-bold ${prominent ? "text-error" : "text-amber-800"}`}>
            {prominent ? "IMPORTANT \u2014 Crisis Services" : "Please Note"}
          </p>
          <p className={`text-sm mt-1 leading-relaxed ${prominent ? "text-error/80" : "text-amber-700"}`}>
            SAMMs is not an emergency or crisis response service. This referral form is not monitored in real
            time. If the participant is at immediate risk, please contact{" "}
            <strong>Emergency Services: 000</strong> or <strong>Lifeline: 13 11 14</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Form
// ---------------------------------------------------------------------------

type FormState = {
  // Section 1
  organisationName: string;
  organisationSuburb: string;
  referrerName: string;
  position: string;
  referrerPhone: string;
  referrerEmail: string;
  // Section 2
  triageUrgency: string;
  crisisAcknowledgement: boolean;
  // Section 3
  informedConsent: string;
  participantAwareness: string;
  participantAwarenessElaboration: string;
  // Section 4
  participantName: string;
  participantDob: string;
  genderIdentity: string;
  genderOther: string;
  participantPhone: string;
  participantEmail: string;
  participantAddress: string;
  safeToLeaveMessage: string;
  interpreterRequired: string;
  // Section 5
  reasonForReferral: string;
  knownBarriers: string[];
  interventionArea: string;
  supportTypeRequired: string;
  alertsAndRisks: string[];
  additionalRiskInfo: string;
  currentSupports: string[];
  currentSupportsOther: string;
  functionalCapacity: string;
  additionalInfo: string;
  // Section 6
  fundingSource: string;
  fundingSourceOther: string;
  programFundingBody: string;
  claimReferenceNumber: string;
  ndisNumber: string;
  financialApproval: string;
  approverName: string;
  approverPosition: string;
  approverEmail: string;
  sessionsApproved: string;
  totalBudgetApproved: string;
  approvalScopeUnknown: boolean;
  financialResponsibility: string;
  fundingResponsibilityAck: boolean;
  servicesNotCommenceAck: boolean;
  invoicingMethod: string;
  accountsContactName: string;
  accountsContactEmail: string;
  accountsContactPhone: string;
  billingOrgName: string;
  billingContactName: string;
  billingEmail: string;
  billingAccountsPayable: string;
  billingAddress: string;
  // Section 7
  referralReviewAck: boolean;
  referrerDeclaration: boolean;
};

const initialState: FormState = {
  organisationName: "",
  organisationSuburb: "",
  referrerName: "",
  position: "",
  referrerPhone: "",
  referrerEmail: "",
  triageUrgency: "",
  crisisAcknowledgement: false,
  informedConsent: "",
  participantAwareness: "",
  participantAwarenessElaboration: "",
  participantName: "",
  participantDob: "",
  genderIdentity: "",
  genderOther: "",
  participantPhone: "",
  participantEmail: "",
  participantAddress: "",
  safeToLeaveMessage: "",
  interpreterRequired: "",
  reasonForReferral: "",
  knownBarriers: [],
  interventionArea: "",
  supportTypeRequired: "",
  alertsAndRisks: [],
  additionalRiskInfo: "",
  currentSupports: [],
  currentSupportsOther: "",
  functionalCapacity: "",
  additionalInfo: "",
  fundingSource: "",
  fundingSourceOther: "",
  programFundingBody: "",
  claimReferenceNumber: "",
  ndisNumber: "",
  financialApproval: "",
  approverName: "",
  approverPosition: "",
  approverEmail: "",
  sessionsApproved: "",
  totalBudgetApproved: "",
  approvalScopeUnknown: false,
  financialResponsibility: "",
  fundingResponsibilityAck: false,
  servicesNotCommenceAck: false,
  invoicingMethod: "",
  accountsContactName: "",
  accountsContactEmail: "",
  accountsContactPhone: "",
  billingOrgName: "",
  billingContactName: "",
  billingEmail: "",
  billingAccountsPayable: "",
  billingAddress: "",
  referralReviewAck: false,
  referrerDeclaration: false,
};

export default function ReferralForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const consentBlocked = form.informedConsent === "no";
  const formDisabled = consentBlocked;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const valid = newFiles.filter((f) => f.size <= 10 * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (consentBlocked) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(form));
      files.forEach((file) => fd.append("files", file));

      const res = await fetch("/api/referral", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        if (json.details?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(json.details.fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              fieldErrors[key] = msgs[0] as string;
            }
          }
          setErrors(fieldErrors);
          const firstErrorKey = Object.keys(fieldErrors)[0];
          if (firstErrorKey) {
            document.getElementById(firstErrorKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        setSubmitError(json.error || "Submission failed. Please check the form and try again.");
        return;
      }

      setReferenceNumber(json.referenceNumber);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success state ----
  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="section-card max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4 text-3xl">
            &#10003;
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Referral Submitted</h1>
          <p className="text-text-muted mb-4">
            Thank you. Your referral has been received and will be reviewed by our clinical intake team.
          </p>
          <div className="bg-surface-muted rounded-xl px-6 py-4 mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Reference Number</p>
            <p className="text-xl font-bold text-text-primary tracking-wide">{referenceNumber}</p>
          </div>
          <p className="text-sm text-text-muted">
            SAMMs will review this referral and aim to respond within <strong>48 hours</strong>.
            Please retain your reference number for any follow-up enquiries.
          </p>
        </div>
      </div>
    );
  }

  // ---- Form ----
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-[#dddddd80]">
        <div className="max-w-3xl mx-auto px-6 py-6 sm:py-8 text-center">
          <img src="/samms-logo.svg" alt="SAMMs – Creating New Pathways" className="h-6 sm:h-7 mx-auto" />
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Clinical Referral Form
            </h2>
            <p className="text-sm text-text-muted mt-1">Stability Before Capacity</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ================================================================ */}
        {/* Section 1: Referrer Details */}
        {/* ================================================================ */}
        <section className="section-card">
          <SectionHeader number={1} title="Referrer Details" />
          <div className="bg-teal-pale/30 border border-teal/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-teal-dark leading-relaxed">
              If you are self-referring, please complete the{" "}
              <a href="https://samms.com.au" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                Contact Us form at samms.com.au
              </a>
              . A member of our intake team will contact you to complete the referral process.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TextInput label="Organisation Name" name="organisationName" required value={form.organisationName} onChange={(v) => set("organisationName", v)} error={errors.organisationName} />
            <TextInput label="Organisation Suburb" name="organisationSuburb" required value={form.organisationSuburb} onChange={(v) => set("organisationSuburb", v)} error={errors.organisationSuburb} />
            <TextInput label="Referrer Name" name="referrerName" required value={form.referrerName} onChange={(v) => set("referrerName", v)} error={errors.referrerName} />
            <TextInput label="Position" name="position" required value={form.position} onChange={(v) => set("position", v)} error={errors.position} />
            <TextInput label="Phone" name="referrerPhone" type="tel" required value={form.referrerPhone} onChange={(v) => set("referrerPhone", v)} error={errors.referrerPhone} />
            <TextInput label="Email" name="referrerEmail" type="email" required value={form.referrerEmail} onChange={(v) => set("referrerEmail", v)} error={errors.referrerEmail} />
          </div>
        </section>

        {/* ================================================================ */}
        {/* Section 2: Triage & Risk */}
        {/* ================================================================ */}
        <section className="section-card">
          <SectionHeader number={2} title="Triage & Risk" />
          <div className="space-y-5">
            <RadioGroup
              label="Triage Urgency"
              name="triageUrgency"
              options={TRIAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label, desc: o.desc }))}
              value={form.triageUrgency}
              onChange={(v) => set("triageUrgency", v)}
              required
              error={errors.triageUrgency}
            />

            <CrisisAlert prominent={form.triageUrgency === "critical"} />

            <div className="bg-surface-muted rounded-xl px-4 py-3">
              <p className="text-sm text-text-muted">
                SAMMs will review this referral and aim to respond within <strong className="text-text-primary">48 hours</strong>.
              </p>
            </div>

            <Checkbox
              label="I understand that SAMMs is not a crisis service and that immediate risk must be managed through appropriate emergency or crisis supports"
              checked={form.crisisAcknowledgement}
              onChange={(v) => set("crisisAcknowledgement", v)}
              error={errors.crisisAcknowledgement}
            />
          </div>
        </section>

        {/* ================================================================ */}
        {/* Section 3: Participant Consent */}
        {/* ================================================================ */}
        <section className="section-card">
          <SectionHeader number={3} title="Participant Consent" />
          <div className="space-y-6">
            <div>
              <p className="field-label">
                Informed Consent <span className="text-brand-orange">*</span>
              </p>
              <p className="text-sm text-text-muted mb-3 leading-relaxed">
                I confirm that the participant has provided informed consent for their personal information to be
                shared with Creating New Pathways for the purpose of this referral.
              </p>
              <div className="flex gap-3">
                {["yes", "no"].map((v) => (
                  <label
                    key={v}
                    className={`radio-card flex-1 justify-center ${form.informedConsent === v ? "radio-card-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="informedConsent"
                      value={v}
                      checked={form.informedConsent === v}
                      onChange={() => set("informedConsent", v)}
                      className="h-4 w-4 text-brand-orange accent-brand-orange"
                    />
                    <span className="text-sm font-semibold capitalize">{v === "yes" ? "Yes" : "No"}</span>
                  </label>
                ))}
              </div>
              {errors.informedConsent && <p className="field-error">{errors.informedConsent}</p>}
            </div>

            {consentBlocked && (
              <div className="rounded-xl border-2 border-error bg-error/5 p-5">
                <p className="text-sm font-bold text-error">Referral Cannot Proceed</p>
                <p className="text-sm text-error/80 mt-1">
                  The referral cannot proceed without participant consent. Please obtain informed consent before
                  submitting this referral.
                </p>
              </div>
            )}

            <div>
              <p className="field-label">
                Participant Awareness <span className="text-brand-orange">*</span>
              </p>
              <p className="text-sm text-text-muted mb-3 leading-relaxed">
                Is the participant aware of and understands the following: Why they are being referred to SAMMs; What SAMMs
                is and the type of support provided; The role of a Complex Needs Clinician; That SAMMs is an independent
                service (not part of your organisation or standard employment/community services); That SAMMs works
                collaboratively alongside existing supports and does not replace them.
              </p>
              <RadioGroup
                label=""
                name="participantAwareness"
                options={[
                  { value: "yes", label: "Yes", desc: "Participant has a clear understanding" },
                  { value: "partial", label: "Partial", desc: "Some understanding; may require further explanation" },
                  { value: "no", label: "No", desc: "Participant is not yet aware or does not understand" },
                ]}
                value={form.participantAwareness}
                onChange={(v) => set("participantAwareness", v)}
                disabled={formDisabled}
                error={errors.participantAwareness}
              />
              {form.participantAwareness === "no" && (
                <div className="mt-4">
                  <TextArea
                    label="Please elaborate"
                    name="participantAwarenessElaboration"
                    required
                    value={form.participantAwarenessElaboration}
                    onChange={(v) => set("participantAwarenessElaboration", v)}
                    disabled={formDisabled}
                    error={errors.participantAwarenessElaboration}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Section 4: Participant Information */}
        {/* ================================================================ */}
        <section className={`section-card ${formDisabled ? "opacity-50 pointer-events-none" : ""}`}>
          <SectionHeader number={4} title="Participant Information" />
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextInput label="Full Name" name="participantName" required value={form.participantName} onChange={(v) => set("participantName", v)} error={errors.participantName} disabled={formDisabled} />
              <TextInput label="Date of Birth" name="participantDob" type="date" required value={form.participantDob} onChange={(v) => set("participantDob", v)} error={errors.participantDob} disabled={formDisabled} />
            </div>

            <RadioGroup
              label="Gender Identity (optional)"
              name="genderIdentity"
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "non-binary", label: "Non-binary" },
                { value: "other", label: "Other" },
              ]}
              value={form.genderIdentity}
              onChange={(v) => set("genderIdentity", v)}
              disabled={formDisabled}
            />
            {form.genderIdentity === "other" && (
              <TextInput label="Please specify" name="genderOther" value={form.genderOther} onChange={(v) => set("genderOther", v)} disabled={formDisabled} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextInput label="Phone" name="participantPhone" type="tel" required value={form.participantPhone} onChange={(v) => set("participantPhone", v)} error={errors.participantPhone} disabled={formDisabled} />
              <TextInput label="Email" name="participantEmail" type="email" value={form.participantEmail} onChange={(v) => set("participantEmail", v)} error={errors.participantEmail} disabled={formDisabled} />
            </div>

            <TextInput label="Address" name="participantAddress" value={form.participantAddress} onChange={(v) => set("participantAddress", v)} disabled={formDisabled} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <RadioGroup
                label="Safe to leave a message?"
                name="safeToLeaveMessage"
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                value={form.safeToLeaveMessage}
                onChange={(v) => set("safeToLeaveMessage", v)}
                required
                error={errors.safeToLeaveMessage}
                disabled={formDisabled}
              />
              <RadioGroup
                label="Interpreter required?"
                name="interpreterRequired"
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                value={form.interpreterRequired}
                onChange={(v) => set("interpreterRequired", v)}
                required
                error={errors.interpreterRequired}
                disabled={formDisabled}
              />
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Section 5: Case Management & Clinical Triage */}
        {/* ================================================================ */}
        <section className={`section-card ${formDisabled ? "opacity-50 pointer-events-none" : ""}`}>
          <SectionHeader number={5} title="Case Management & Clinical Triage" />
          <div className="space-y-6">
            <TextArea
              label="Reason for Referral"
              name="reasonForReferral"
              required
              value={form.reasonForReferral}
              onChange={(v) => set("reasonForReferral", v)}
              error={errors.reasonForReferral}
              helper="Briefly outline what has prompted this referral."
              disabled={formDisabled}
            />

            <CheckboxGroup
              label="Known Participant Barriers"
              options={BARRIERS}
              selected={form.knownBarriers}
              onChange={(v) => set("knownBarriers", v)}
              required
              error={errors.knownBarriers}
              disabled={formDisabled}
            />

            <SelectDropdown
              label="Intervention Areas"
              name="interventionArea"
              options={INTERVENTION_AREAS}
              value={form.interventionArea}
              onChange={(v) => set("interventionArea", v)}
              helper="For triage purposes only. Final intervention pathway will be determined by SAMMs clinicians following assessment."
              disabled={formDisabled}
            />

            <SelectDropdown
              label="Type of Support Required"
              name="supportTypeRequired"
              options={SUPPORT_TYPES}
              value={form.supportTypeRequired}
              onChange={(v) => set("supportTypeRequired", v)}
              helper="For triage purposes only. Final intervention pathway will be determined by SAMMs clinicians following assessment."
              disabled={formDisabled}
            />

            <CheckboxGroup
              label="Alerts & Known Risks"
              options={ALERTS_RISKS}
              selected={form.alertsAndRisks}
              onChange={(v) => set("alertsAndRisks", v)}
              disabled={formDisabled}
            />

            <TextArea
              label="Additional Risk Information"
              name="additionalRiskInfo"
              value={form.additionalRiskInfo}
              onChange={(v) => set("additionalRiskInfo", v)}
              helper="Provide any further relevant risk details."
              disabled={formDisabled}
            />

            <CheckboxGroup
              label="Current Supports & Services"
              options={CURRENT_SUPPORTS}
              selected={form.currentSupports}
              onChange={(v) => set("currentSupports", v)}
              disabled={formDisabled}
            />
            {form.currentSupports.includes("Other") && (
              <TextInput
                label="Other support (please specify)"
                name="currentSupportsOther"
                value={form.currentSupportsOther}
                onChange={(v) => set("currentSupportsOther", v)}
                disabled={formDisabled}
              />
            )}

            <RadioGroup
              label="Current Functional Capacity"
              name="functionalCapacity"
              options={FUNCTIONAL_CAPACITY_OPTIONS}
              value={form.functionalCapacity}
              onChange={(v) => set("functionalCapacity", v)}
              required
              error={errors.functionalCapacity}
              disabled={formDisabled}
            />
            <p className="field-helper -mt-4">As observed by the referrer</p>

            <TextArea
              label="Additional Information"
              name="additionalInfo"
              value={form.additionalInfo}
              onChange={(v) => set("additionalInfo", v)}
              helper="Please include any further information relevant to this referral that has not been captured above."
              disabled={formDisabled}
            />
          </div>
        </section>

        {/* ================================================================ */}
        {/* Section 6: Funding, Approval & Accounts Coordination */}
        {/* ================================================================ */}
        <section className={`section-card ${formDisabled ? "opacity-50 pointer-events-none" : ""}`}>
          <SectionHeader number={6} title="Funding, Approval & Accounts Coordination" />
          <div className="space-y-6">
            <SelectDropdown
              label="Funding Source"
              name="fundingSource"
              options={FUNDING_SOURCES}
              value={form.fundingSource}
              onChange={(v) => set("fundingSource", v)}
              required
              error={errors.fundingSource}
              disabled={formDisabled}
            />
            {form.fundingSource === "Other" && (
              <TextInput
                label="Other funding source (please specify)"
                name="fundingSourceOther"
                value={form.fundingSourceOther}
                onChange={(v) => set("fundingSourceOther", v)}
                disabled={formDisabled}
              />
            )}
            <div className="bg-surface-muted rounded-xl px-4 py-3">
              <p className="text-sm text-text-muted">
                If referring via Medicare, please contact SAMMs directly to process submission.
              </p>
            </div>

            {/* Funding details */}
            <div>
              <p className="field-label mb-3">Funding Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextInput label="Program / Funding Body" name="programFundingBody" value={form.programFundingBody} onChange={(v) => set("programFundingBody", v)} disabled={formDisabled} />
                <TextInput label="Claim / Reference Number" name="claimReferenceNumber" value={form.claimReferenceNumber} onChange={(v) => set("claimReferenceNumber", v)} disabled={formDisabled} />
                <TextInput label="NDIS Number" name="ndisNumber" value={form.ndisNumber} onChange={(v) => set("ndisNumber", v)} disabled={formDisabled} />
              </div>
            </div>

            {/* Financial Approval */}
            <RadioGroup
              label="Financial Approval"
              name="financialApproval"
              options={[
                { value: "approved", label: "Approved" },
                { value: "pending", label: "Pending" },
                { value: "not-requested", label: "Not Requested" },
              ]}
              value={form.financialApproval}
              onChange={(v) => set("financialApproval", v)}
              required
              error={errors.financialApproval}
              disabled={formDisabled}
            />
            {form.financialApproval === "approved" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-4 border-l-2 border-brand-orange/20">
                <TextInput label="Approver Name" name="approverName" value={form.approverName} onChange={(v) => set("approverName", v)} disabled={formDisabled} />
                <TextInput label="Approver Position" name="approverPosition" value={form.approverPosition} onChange={(v) => set("approverPosition", v)} disabled={formDisabled} />
                <TextInput label="Approver Email" name="approverEmail" type="email" value={form.approverEmail} onChange={(v) => set("approverEmail", v)} disabled={formDisabled} />
              </div>
            )}

            {/* Approval Scope */}
            <div>
              <p className="field-label">Approval Scope</p>
              <p className="field-helper mb-3">If unknown, leave blank &mdash; SAMMs will determine the appropriate service scope following clinical triage.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput label="Number of sessions approved" name="sessionsApproved" type="number" value={form.sessionsApproved} onChange={(v) => set("sessionsApproved", v)} disabled={formDisabled || form.approvalScopeUnknown} />
                <TextInput label="Total budget approved" name="totalBudgetApproved" type="number" prefix="$" value={form.totalBudgetApproved} onChange={(v) => set("totalBudgetApproved", v)} disabled={formDisabled || form.approvalScopeUnknown} />
              </div>
              <div className="mt-3">
                <Checkbox
                  label="Unknown / to be determined"
                  checked={form.approvalScopeUnknown}
                  onChange={(v) => set("approvalScopeUnknown", v)}
                  disabled={formDisabled}
                />
              </div>
            </div>

            {/* Financial Responsibility */}
            <RadioGroup
              label="Financial Responsibility"
              name="financialResponsibility"
              options={[
                { value: "referring-organisation", label: "Referring organisation" },
                { value: "funding-body", label: "Funding body" },
                { value: "third-party", label: "Third party" },
                { value: "private", label: "Private" },
              ]}
              value={form.financialResponsibility}
              onChange={(v) => set("financialResponsibility", v)}
              required
              error={errors.financialResponsibility}
              disabled={formDisabled}
            />

            <div className="space-y-2 pl-4 border-l-2 border-surface-divider">
              <Checkbox
                label="I understand that if funding is not approved or is withdrawn, the referring organisation may be responsible"
                checked={form.fundingResponsibilityAck}
                onChange={(v) => set("fundingResponsibilityAck", v)}
                error={errors.fundingResponsibilityAck}
                disabled={formDisabled}
              />
              <Checkbox
                label="I acknowledge that services may not commence until funding is confirmed, unless otherwise agreed with SAMMs"
                checked={form.servicesNotCommenceAck}
                onChange={(v) => set("servicesNotCommenceAck", v)}
                error={errors.servicesNotCommenceAck}
                disabled={formDisabled}
              />
            </div>

            {/* Invoicing */}
            <RadioGroup
              label="Invoicing Method"
              name="invoicingMethod"
              options={[
                { value: "purchase-order", label: "Purchase Order (PO) will be issued" },
                { value: "accounts-liaise", label: "Accounts will liaise directly" },
                { value: "no-po", label: "No PO \u2013 invoice directly" },
              ]}
              value={form.invoicingMethod}
              onChange={(v) => set("invoicingMethod", v)}
              required
              error={errors.invoicingMethod}
              disabled={formDisabled}
            />

            {/* Accounts Contact */}
            <div>
              <p className="field-label mb-3">Accounts Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextInput label="Name" name="accountsContactName" value={form.accountsContactName} onChange={(v) => set("accountsContactName", v)} disabled={formDisabled} />
                <TextInput label="Email" name="accountsContactEmail" type="email" value={form.accountsContactEmail} onChange={(v) => set("accountsContactEmail", v)} disabled={formDisabled} />
                <TextInput label="Phone" name="accountsContactPhone" type="tel" value={form.accountsContactPhone} onChange={(v) => set("accountsContactPhone", v)} disabled={formDisabled} />
              </div>
            </div>

            {/* Billing Contact */}
            <div>
              <p className="field-label mb-3">Billing Contact Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput label="Organisation / Payer Name" name="billingOrgName" value={form.billingOrgName} onChange={(v) => set("billingOrgName", v)} disabled={formDisabled} />
                <TextInput label="Billing Contact Name" name="billingContactName" value={form.billingContactName} onChange={(v) => set("billingContactName", v)} disabled={formDisabled} />
                <TextInput label="Email for Invoices" name="billingEmail" type="email" value={form.billingEmail} onChange={(v) => set("billingEmail", v)} disabled={formDisabled} />
                <TextInput label="Accounts Payable Contact (if different)" name="billingAccountsPayable" value={form.billingAccountsPayable} onChange={(v) => set("billingAccountsPayable", v)} disabled={formDisabled} />
              </div>
              <div className="mt-4">
                <TextInput label="Billing Address" name="billingAddress" value={form.billingAddress} onChange={(v) => set("billingAddress", v)} disabled={formDisabled} />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Section 7: Submission & Service Agreement */}
        {/* ================================================================ */}
        <section className={`section-card ${formDisabled ? "opacity-50 pointer-events-none" : ""}`}>
          <SectionHeader number={7} title="Submission & Service Agreement" />
          <div className="space-y-6">
            {/* Terms */}
            <div className="bg-surface-muted rounded-xl p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-text-primary mb-1">Cancellation &amp; Non-Attendance</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Less than 48 hours notice may incur full session fee. Repeated non-attendance may result in
                  review or closure of referral.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary mb-1">Scope &amp; Service Boundaries</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Services are delivered within approved funding, scope, and clinical suitability. Additional
                  sessions or extensions require further approval.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary mb-1">Service &amp; Financial Conditions</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  SAMMs reserves the right to pause services where payment is outstanding, reallocate sessions
                  where funding is not confirmed, adjust servicing where approved scope or budget is exceeded.
                  Payment terms: 7&ndash;14 days unless otherwise agreed.
                </p>
              </div>
              <p className="text-sm text-text-muted">
                Full terms and conditions:{" "}
                <a href="https://samms.com.au" target="_blank" rel="noopener noreferrer" className="text-brand-orange font-semibold underline underline-offset-2">
                  samms.com.au
                </a>
              </p>
            </div>

            <Checkbox
              label="I understand that this referral will be reviewed and may require further clarification prior to service activation"
              checked={form.referralReviewAck}
              onChange={(v) => set("referralReviewAck", v)}
              error={errors.referralReviewAck}
              disabled={formDisabled}
            />

            <div className="border border-surface-divider rounded-xl p-4">
              <p className="text-sm font-bold text-text-primary mb-2">Referrer Declaration</p>
              <Checkbox
                label="I confirm that: All information provided is accurate to the best of my knowledge; I am authorised to submit this referral; The participant has been informed of the referral (as outlined above); Funding has been approved or is in process (as indicated)"
                checked={form.referrerDeclaration}
                onChange={(v) => set("referrerDeclaration", v)}
                error={errors.referrerDeclaration}
                disabled={formDisabled}
              />
            </div>

            {/* File Upload */}
            <div>
              <p className="field-label">Supporting Documentation</p>
              <p className="field-helper mb-3">
                Service Agreements, Funding approvals, Reports/assessments, Risk plans.
                PDF, Word docs, images accepted. Max 10MB per file, up to 5 files.
              </p>
              <p className="field-helper mb-3 italic">
                If your organisation requires SAMMs to be registered as a new supplier, please attach required onboarding documentation.
              </p>
              <div
                className="border-2 border-dashed border-surface-divider rounded-xl p-6 text-center cursor-pointer hover:border-brand-orange/40 hover:bg-brand-orange/[0.02] transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-3xl mb-2 text-text-light">+</div>
                <p className="text-sm text-text-muted">Click to upload files</p>
                <p className="text-xs text-text-light mt-1">PDF, DOC, DOCX, JPG, PNG</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={formDisabled}
                />
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-muted rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-text-primary truncate">{file.name}</span>
                        <span className="text-xs text-text-light flex-shrink-0">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-text-light hover:text-error text-sm ml-2 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            {submitError && (
              <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3">
                <p className="text-sm text-error font-medium">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || formDisabled}
              className="btn-primary w-full text-base py-4"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting Referral...
                </span>
              ) : (
                "Submit Referral"
              )}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-8">
          <p className="text-xs text-text-light">
            SAMMs Professional Services &mdash; Creating New Pathways
          </p>
          <p className="text-xs text-text-light mt-1">
            This form is secure. All data is encrypted in transit and stored in compliance with Australian privacy legislation.
          </p>
        </footer>
      </form>
    </div>
  );
}
