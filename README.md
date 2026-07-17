# Gazelle Assessment Platform

Gazelle Assessment is a public multi-company, multi-test hiring platform. Its first executable test is the bilingual **Tenure Potential** assessment for high-volume BPO and contact-center hiring.

It does not claim to predict that a candidate will stay. The current `TP-0.2.0` assessment produces a transparent pilot index that must be calibrated against local 90-day and 180-day voluntary-retention outcomes before anyone may describe it as predictive.

## What is implemented

- Public email/password registration with approval required before access
- Alejandro Pascual (`david.alejandro.pa@gmail.com`) as the only permitted super administrator
- Server-enforced recruiter, company administrator, and super administrator scopes
- Secure PBKDF2 password derivation, revocable server-side sessions, secure cookies, and authentication rate limits
- Multi-company candidate records with company-scoped email uniqueness
- Versioned multi-test catalog with explicit active, draft, and archived states
- Reusable candidate lists; candidates may belong to multiple lists
- Multiple tests per list, batch sends, and durable batch progress
- English/Spanish language choice before the assessment
- Separate experienced and first-job context branches of equal length
- 27 items per candidate path
- Three adaptive, bilingual job scenarios with a deterministic fallback
- Five-paragraph English and Spanish GPT-5.5 recruiter narratives
- Preview assessments call the same GPT-5.5 analysis contract without persisting a candidate record
- Recruiter-controlled report language and client-generated PDF download
- Three equally weighted scored constructs:
  - role reality alignment
  - stay intention
  - work reliability
- Separate, zero-weight support-leverage profile
- Separate, zero-weight experience context until branch equivalence is validated
- Reverse-keyed items and paired-item consistency checks
- Completion-speed and low-variation response-quality checks
- Server-authoritative scoring and SHA-256 result fingerprint
- Item-level scoring trace with raw response, transformation, timing, and inclusion rule
- Persistent candidate, invitation, assessment, response, audit, and email-event records
- Real Mailgun REST API integration with signed delivery webhooks
- OpenAI Responses API integration with strict structured outputs and `store: false`
- CSV import and authenticated user attribution

## Accounts and roles

Public registrations are created with `pending` status. Only the super administrator can approve them, assign a company, and choose one of these roles:

- `recruiter`: sees only candidates and lists they own
- `admin`: sees all candidates and lists in their company
- `super_admin`: sees all companies; restricted in code and database triggers to `david.alejandro.pa@gmail.com`

The first owner activation also claims legacy pilot candidates for the Gazelle Platform company. The activation key becomes unusable after the sole super administrator exists.

Required authentication variables:

- `SUPER_ADMIN_EMAIL=david.alejandro.pa@gmail.com`
- `SUPER_ADMIN_BOOTSTRAP_TOKEN` as a secret random value of at least 24 characters
- `AUTH_PEPPER` as a secret random value of at least 32 characters

Passwords are derived with PBKDF2-HMAC-SHA-256 and a per-user random salt. Browser sessions use a `__Host-` cookie with `Secure`, `HttpOnly`, and `SameSite=Strict`; only a hash of each random session token is stored.

## Lists and tests

The operating workflow is:

1. Import or create candidates.
2. Create a named list.
3. Add visible candidates and one or more active tests.
4. Send the list as a batch in English or Spanish.
5. Monitor provider acceptance, failures, and completed assessments.

`Tenure Potential` is the first active executable engine. Super administrators can add future catalog entries, but they remain drafts and cannot be sent until a real scoring engine is implemented. This prevents the interface from presenting an unimplemented test as operational.

## Transparent scoring

Each response uses a 1–5 agreement scale. Reverse-keyed items are transformed as `6 - response`. Each transformed response is mapped to 0–100 with `(response - 1) × 25`.

The pilot index is:

```text
Tenure Potential Index = mean(
  Role Reality Alignment,
  Stay Intention,
  Work Reliability
)
```

Support leverage and context have a weight of zero. No automatic rejection or retention probability is produced.

Scenario responses and the GPT-5.5 narrative also have a weight of zero. They are separate, auditable evidence for structured human review and never change the index.

See [docs/scoring-and-validation.md](docs/scoring-and-validation.md) for the complete interpretation and validation contract.

## Mailgun configuration

The server requires these runtime variables:

- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM`
- `MAILGUN_REGION` (`US` or `EU`)
- `MAILGUN_WEBHOOK_SIGNING_KEY`
- `APP_BASE_URL`

The sending domain must be verified with SPF and DKIM. DMARC should be configured for the organization’s domain policy. Register Mailgun delivery/failure/complaint/unsubscribe events at `/api/mailgun/webhook`.

A successful API response means Mailgun accepted the message. Delivery is confirmed only by a signed provider webhook.

Recommended setup order:

1. Add a dedicated sending subdomain in Mailgun, such as `assessment.company.com`, in the correct US or EU region.
2. Publish every SPF and DKIM record shown by Mailgun and verify the domain. Add DMARC according to the organization's domain policy.
3. Create a domain sending key and store the variables above in the hosted runtime. Mark `MAILGUN_API_KEY` and `MAILGUN_WEBHOOK_SIGNING_KEY` as secrets; never put them in frontend code or commit them.
4. Register `https://YOUR_APP_DOMAIN/api/mailgun/webhook` for accepted, delivered, temporary fail, permanent fail, complained, and unsubscribed events.
5. Refresh Settings, send a connection test, and confirm both Mailgun acceptance and the delivered webhook event.

## OpenAI configuration

Set `OPENAI_API_KEY` as a hosted secret. `OPENAI_MODEL` is optional and defaults to the pinned `gpt-5.5-2026-04-23` snapshot so report regeneration is reproducible.

The server sends deidentified, job-related assessment evidence to the Responses API. Candidate name, email, and phone are excluded. Both scenario generation and report analysis use strict JSON schemas; API storage is disabled with `store: false`. Scenario and analysis prompts are separately versioned, and the stored report includes the provider response ID plus SHA-256 hashes of its evidence and output.

The AI narrative is advisory only. It is prohibited from diagnosing the candidate, inferring protected or sensitive characteristics, estimating retention probability, ranking candidates, or recommending hire/reject decisions. A trained person must review it with other job-related evidence.

## Public access

Invitation links use `/assessment?invite=...` and open a candidate-only interface. The first interactive screen always asks `Choose your language · Elige tu idioma`; the suggested email language never bypasses this choice. Consent explicitly describes the three scenario questions and AI-assisted recruiter report before any response is recorded.

The Sites access policy must be public so account registration and candidate invitation routes are reachable. Hiring-team data remains protected by the application's own server-side sessions and role/company checks. Invitation tokens grant access only to a single candidate assessment and are stored only as SHA-256 hashes.

## Production boundary

Before operational selection use, an I/O psychologist and employment counsel should review the item bank, role analysis, interpretation, accommodations, local legal requirements, bilingual adaptation evidence, and adverse-impact monitoring plan. The pilot must pre-register outcomes and preserve assessment/model versions so later validity analyses use the exact instrument each candidate completed.
