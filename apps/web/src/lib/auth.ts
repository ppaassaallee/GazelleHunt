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

export type PlaybookIntent = "recupera" | "gazellehunt";

export function getMe() {
  return apiFetch<{ user: MeikapenUser }>("/api/auth/me");
}

/** Canonical public host for landings, auth, Recupero shell, and Gazelle workspace. */
export function meikapenOrigin(): string {
  if (typeof window === "undefined") return "https://meikapen.com";
  const { protocol, hostname, port } = window.location;
  if (port === "5173" || port === "8787") {
    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  }
  return "https://meikapen.com";
}

function withAuthParams(
  auth: "login" | "signup",
  opts?: { playbook?: PlaybookIntent; returnTo?: string },
): string {
  const params = new URLSearchParams();
  params.set("auth", auth);
  if (opts?.playbook) params.set("playbook", opts.playbook);
  if (opts?.returnTo) params.set("returnTo", opts.returnTo);
  return `${meikapenOrigin()}/?${params.toString()}`;
}

/** Auth UI lives on meikapen.com so landings and apps share the same __Host- session cookie. */
export function gazelleLoginHref(opts?: {
  playbook?: PlaybookIntent;
  returnTo?: string;
}): string {
  return withAuthParams("login", opts);
}

export function gazelleSignupHref(opts?: {
  playbook?: PlaybookIntent;
  returnTo?: string;
}): string {
  return withAuthParams("signup", opts);
}

export function meikapenAppHref(opts?: {
  open?: "recupera" | "gazellehunt";
  action?: string;
}): string {
  const params = new URLSearchParams();
  if (opts?.open) params.set("open", opts.open);
  if (opts?.action) params.set("action", opts.action);
  const qs = params.toString();
  const path = qs ? `/ryvo/?${qs}` : "/ryvo/";
  return `${meikapenOrigin()}${path}`;
}

export function isMeikapenAdmin(user: MeikapenUser): boolean {
  return Boolean(user.ryvoStaff) || user.role === "super_admin";
}
