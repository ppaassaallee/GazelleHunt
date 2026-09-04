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

export function importObligations(obligations: ObligationInput[]) {
  return apiFetch<{ imported: number; obligations: RecuperaObligation[] }>(
    "/api/recupera/obligations/import",
    {
      method: "POST",
      body: JSON.stringify({ obligations }),
    },
  );
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
