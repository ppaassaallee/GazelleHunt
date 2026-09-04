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
