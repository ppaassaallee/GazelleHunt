import { apiFetch } from "@/lib/api";

export type RecuperaInstallation = {
  id: string;
  companyId: string;
  playbookKey: string;
  playbookVersion: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RecuperaObligation = {
  id: string;
  payerName: string;
  payerEmail: string | null;
  payerPhone: string | null;
  reference: string | null;
  amountCents: number;
  balanceCents: number;
  currency: string;
  dueDate: string;
  stageKey: string;
  status: string;
  subjectCandidateId?: string | null;
};

export type ObligationInput = {
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  reference?: string;
  description?: string;
  amountCents: number;
  balanceCents?: number;
  dueDate: string;
  currency?: string;
};

export type ImportObligationsOptions = {
  obligations?: ObligationInput[];
  csv?: string;
  autoActivate?: boolean;
};

export type ImportObligationsResult = {
  imported: RecuperaObligation[];
  activationErrors?: Array<{ obligationId: string; code: string }>;
};

export function installRecupera() {
  return apiFetch<{ installation: RecuperaInstallation }>(
    "/api/recupera/install",
    { method: "POST", body: "{}" },
  );
}

export function getInstallation() {
  return apiFetch<{ installation: RecuperaInstallation }>(
    "/api/recupera/installation",
  );
}

export function listObligations() {
  return apiFetch<{ obligations: RecuperaObligation[] }>(
    "/api/recupera/obligations",
  );
}

export function importObligations(
  obligationsOrOptions: ObligationInput[] | ImportObligationsOptions,
  options?: { autoActivate?: boolean },
) {
  const body =
    Array.isArray(obligationsOrOptions)
      ? { obligations: obligationsOrOptions, autoActivate: options?.autoActivate }
      : obligationsOrOptions;
  return apiFetch<ImportObligationsResult>("/api/recupera/obligations/import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ActivateObligationResult = {
  obligation: RecuperaObligation;
  candidateId: string;
  journeyId: string;
  enrollmentId: string;
  alreadyActive?: boolean;
};

export function activateObligation(obligationId: string) {
  return apiFetch<ActivateObligationResult>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/activate`,
    { method: "POST", body: "{}" },
  );
}

export function markObligationPaid(obligationId: string) {
  return apiFetch<{ obligation: RecuperaObligation; paymentId: string }>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/mark-paid`,
    { method: "POST", body: "{}" },
  );
}

export function createObligationPortalLink(obligationId: string) {
  return apiFetch<{ url: string; expiresAt: string }>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/portal-link`,
    { method: "POST", body: "{}" },
  );
}

export type RocioClassification = {
  intent: string;
  promiseDate: string | null;
  confidence: number;
  needsHuman: boolean;
  suggestedAction: string | null;
};

export function classifyRocioIntent(text: string, obligationId?: string) {
  return apiFetch<{ classification: RocioClassification; obligationId: string | null }>(
    "/api/recupera/rocio/classify",
    {
      method: "POST",
      body: JSON.stringify({ text, obligationId }),
    },
  );
}

export type InboundMessageResult = {
  jobId: string;
  status: string;
  classification: RocioClassification;
  applied: boolean;
  obligation: RecuperaObligation;
};

export function simulateInboundMessage(obligationId: string, text: string) {
  return apiFetch<InboundMessageResult>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/inbound-message`,
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}

export type RecuperaExceptionType =
  | "broken_promise"
  | "dispute"
  | "pending_payment"
  | "needs_human"
  | "aging";

export type RecuperaExceptionItem = {
  id: string;
  type: RecuperaExceptionType;
  obligationId: string;
  title: string;
  subtitle: string;
  amountCents: number;
  currency: string;
  createdAt: string;
};

export type RecuperaExceptionsResult = {
  summary: {
    brokenPromises: number;
    disputes: number;
    pendingPayments: number;
    needsHuman: number;
    total: number;
  };
  items: RecuperaExceptionItem[];
};

export type RecuperaInsights = {
  pendingCents: number;
  recoveredCentsThisMonth: number;
  openObligations: number;
  activePromises: number;
  brokenPromises: number;
  disputesOpen: number;
  aging: Array<{ stageKey: string; cents: number; count: number }>;
  rocio: { jobsToday: number; needsHuman: number };
};

export function getInsights() {
  return apiFetch<RecuperaInsights>("/api/recupera/insights");
}

export function listExceptions() {
  return apiFetch<RecuperaExceptionsResult>("/api/recupera/exceptions");
}

export function resolveException(
  type: RecuperaExceptionType,
  id: string,
  resolution: "dismiss" | "confirm_paid" | "break_promise",
) {
  return apiFetch<{ ok: true; obligationId: string }>(
    `/api/recupera/exceptions/${encodeURIComponent(type)}/${encodeURIComponent(id)}/resolve`,
    { method: "POST", body: JSON.stringify({ resolution }) },
  );
}
