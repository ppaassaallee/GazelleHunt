import { apiFetch } from "@/lib/api";

export type MeikapenUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  companyId: string | null;
  companyName: string | null;
  ryvoStaff?: boolean;
};

export function getMe() {
  return apiFetch<{ user: MeikapenUser }>("/api/auth/me");
}

/** Gazelle login lives on the Worker origin (cookies are Secure + same-site). */
export function gazelleLoginHref(): string {
  if (typeof window === "undefined") return "/gazellehunt";
  const { protocol, hostname, port } = window.location;
  // Vite (:5173) cannot share __Host- session cookies with :8787 — send user to Worker.
  if (port === "5173") return "http://127.0.0.1:8787/gazellehunt";
  return `${protocol}//${hostname}${port ? `:${port}` : ""}/gazellehunt`;
}

export function meikapenAppHref(): string {
  if (typeof window === "undefined") return "/ryvo/";
  const { protocol, hostname, port } = window.location;
  if (port === "5173") return "http://127.0.0.1:8787/ryvo/";
  return `${protocol}//${hostname}${port ? `:${port}` : ""}/ryvo/`;
}
