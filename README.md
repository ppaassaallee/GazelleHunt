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
- Five-paragraph English and Spanish AI-assisted recruiter narratives
- Auditable 1–5 Job Alignment Evidence Rating that uses the questionnaire and all three scenarios
- Preview assessments call the same AI analysis contract without persisting a candidate record
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
- Brevo Transactional Email API integration with idempotency keys and secret-header-authenticated delivery webhooks
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

Scenario responses, the AI narrative, and the 1–5 Job Alignment Evidence Rating do not change the deterministic index. They are separate, auditable evidence outputs that cite questionnaire items and all three scenarios.

See [docs/scoring-and-validation.md](docs/scoring-and-validation.md) for the complete interpretation and validation contract.

## Brevo configuration

The server requires these runtime variables:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_WEBHOOK_TOKEN`
- `APP_BASE_URL`

Candidate invitations use Brevo's Transactional Email API because each message contains a unique assessment link. Brevo marketing Campaigns are a separate product and are not used by the application send workflow.

The sender or sending domain must be authenticated in Brevo. Publish the SPF and DKIM records Brevo requests and configure DMARC for the organization's domain policy. A successful API response means Brevo accepted the message; delivery is confirmed only by the secret-header-authenticated provider webhook at `/api/brevo/webhook`.

Recommended setup order:

1. Authenticate the sender or a dedicated sending domain in [Brevo](https://app.brevo.com), then publish every requested SPF and DKIM record. Add DMARC according to the organization's domain policy.
2. Create an API key with transactional email access and store it as the `BREVO_API_KEY` hosted secret.
3. Set `BREVO_SENDER_EMAIL` to the authenticated sender, set `BREVO_SENDER_NAME`, and create a random `BREVO_WEBHOOK_TOKEN` of at least 24 characters as a hosted secret. Never put either secret in frontend code or commit it.
4. As the super administrator, use **Create or update webhook** in Settings. The server registers `https://YOUR_APP_DOMAIN/api/brevo/webhook` with an `X-Gazelle-Webhook-Token` secret header sourced from `BREVO_WEBHOOK_TOKEN`.
5. Subscribe to sent/request, delivered, deferred, soft bounce, hard bounce, blocked, spam, invalid, and unsubscribed events. Non-batched delivery is recommended; the handler also accepts Brevo's batched payload shape.
6. Refresh Settings, send a connection test, and confirm both Brevo acceptance and the delivered webhook event.

Implementation references: [send transactional email](https://developers.brevo.com/docs/send-a-transactional-email), [transactional webhook events](https://developers.brevo.com/docs/transactional-webhooks), and [secure webhooks](https://developers.brevo.com/docs/secured-webhooks).

## AI provider configuration

The app supports either OpenAI or Google Gemini. Set `AI_PROVIDER` to `openai` or `gemini`.

For OpenAI, store `OPENAI_API_KEY` as a hosted secret. `OPENAI_MODEL` is optional and defaults to `gpt-5.6-sol`.

For a Google AI Studio project, create an API key and store it as the hosted secret `GEMINI_API_KEY`. `GEMINI_MODEL` is optional and defaults to the stable `gemini-3.5-flash` model. The app calls the Gemini Generate Content API with a JSON response schema. `GOOGLE_API_KEY` is also accepted, but `GEMINI_API_KEY` is preferred so the deployment contract is explicit.

The server sends deidentified, job-related assessment evidence to the selected provider. Candidate name, email, and phone are excluded. Both scenario generation and report analysis use JSON schemas; OpenAI API storage is disabled with `store: false`. Scenario and analysis prompts are separately versioned, and the stored report includes the provider, model, response ID when available, and SHA-256 hashes of its evidence and output.

The AI output is prohibited from diagnosing the candidate, inferring protected or sensitive characteristics, estimating retention probability, ranking candidates, or recommending hire/reject decisions. The 1–5 rating is a structured job-alignment evidence summary, not a cut score.

## Public access

Invitation links use `/assessment?invite=...` and open a candidate-only interface. The first interactive screen always asks `Choose your language · Elige tu idioma`; the suggested email language never bypasses this choice. Consent explicitly describes the three scenario questions and AI-assisted recruiter report before any response is recorded.

The Sites access policy must be public so account registration and candidate invitation routes are reachable. Hiring-team data remains protected by the application's own server-side sessions and role/company checks. Invitation tokens grant access only to a single candidate assessment and are stored only as SHA-256 hashes.

## Production boundary

Before operational selection use, an I/O psychologist and employment counsel should review the item bank, role analysis, interpretation, accommodations, local legal requirements, bilingual adaptation evidence, and adverse-impact monitoring plan. The pilot must pre-register outcomes and preserve assessment/model versions so later validity analyses use the exact instrument each candidate completed.
