# Gazelle Hunt · by Meikapen

> Monorepo de **Meikapen** (meikapen.com). Gazelle Hunt y Recupera corren como Playbooks. Tagline: **Instala. Activa. Sucede.** Ver `AGENTS.md` y `docs/spec/copy.md`.
>
> Rutas internas pueden seguir el prefijo histórico `ryvo/`; la marca en producto es **Meikapen**.

---

Gazelle Assessment is a public multi-company, multi-test hiring platform. Its first executable test is the bilingual **Tenure Potential** assessment for high-volume BPO and contact-center hiring.

It does not claim to predict that a candidate will stay. The current `TP-0.2.1` assessment produces a transparent pilot index that must be calibrated against local 90-day and 180-day voluntary-retention outcomes before anyone may describe it as predictive.

## What is implemented

- Public email/password registration with approval required before access
- Six protected super administrators: Alejandro Pascual (`david.alejandro.pa@gmail.com`), Alexandra (`karla.ms@alliedglobal.com`), Jose Lima (`jose.le@alliedglobal.com`), Daniela Llanos (`daniela.ld@alliedglobal.com`), Eduardo (`eduardo.ac@alliedglobal.com`), and Marcos Gutierrez (`marcos.gs@alliedglobal.com`)
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
- Journeys with scheduled email, WhatsApp, and SMS persistence steps
- OpenAI Responses API integration with strict structured outputs and `store: false`
- CSV import and authenticated user attribution

## Accounts and roles

Public registrations are created with `pending` status. A super administrator can approve them, assign a company, and choose one of these roles:

- `recruiter`: sees only candidates and lists they own
- `admin`: sees all candidates and lists in their company
- `super_admin`: sees all companies; restricted in code and database triggers to the protected email addresses listed above

The first owner activation also claims legacy pilot candidates for the Gazelle Platform company. The activation key becomes unusable after Alejandro's primary owner account exists.

Required authentication variables:

- `SUPER_ADMIN_EMAIL=david.alejandro.pa@gmail.com`
- `SUPER_ADMIN_BOOTSTRAP_TOKEN` as a secret random value of at least 24 characters
- `AUTH_PEPPER` as a secret random value of at least 32 characters

Passwords are derived with PBKDF2-HMAC-SHA-256 and a per-user random salt. Browser sessions use a `__Host-` cookie with `Secure`, `HttpOnly`, and `SameSite=Strict`; only a hash of each random session token is stored.

### Staff onboarding and password recovery

1. Send the public application URL to the recruiter or administrator.
2. The person selects **Create an account**, enters their company, and chooses their own password.
3. The registration appears in **Users & companies → Approval queue**.
4. A platform super administrator selects the company and either **Recruiter** or **Company admin**, then approves the account. The platform requests a Brevo sign-in notification automatically.
5. After activation, a platform super administrator can change the person's company, role, or status from the account table.

Users who forget their password select **Forgot password?** on the sign-in page. Brevo sends a one-time link that expires after 60 minutes; completing the reset revokes prior sessions. A super administrator can also use **Send access link** beside any active platform account, including another protected super administrator. Passwords and reset tokens are never displayed to administrators, and only reset-token hashes are stored.

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

## Journeys

The **Journeys** workspace lets recruiters and administrators design persistence flows for a candidate list. The builder supports adding, removing, and reordering steps before publishing. A journey has a list, a test, a default language, and ordered steps such as:

```text
0 hours: email invitation
3 hours: WhatsApp reminder
24 hours: email reminder
48 hours: SMS reminder
72 hours: API webhook to request a phone call
```

Each enrolled candidate receives scheduled journey events. The Worker cron checks due events every minute. If the candidate completes the selected test, remaining queued events are skipped. If the provider is not configured or rejects a send, the event is marked failed with the exact error code; it is not displayed as delivered or silently ignored.

Publishing is guarded by server-side validation. Active journeys are saved only when every selected provider is configured, every WhatsApp step points to an approved/active Template manager record, and every API webhook step has a valid HTTPS URL plus valid JSON headers when headers are provided.

The workspace includes a Template manager. Admins and super admins can create reusable templates by company; recruiters can use approved/active templates when building journeys. Email steps use the existing Brevo Transactional Email configuration and can remain editable because every assessment link is unique. WhatsApp steps are stricter: proactive outbound WhatsApp must use a Meta/Infobip-approved template stored as approved or active in Gazelle before the journey can be created.

API webhook steps are generic integration nodes inspired by tools like n8n. They do not create a new assessment invitation or consume a test attempt; they call the configured HTTPS endpoint with candidate, test, journey, event, and suggested message metadata. The external system should return any 2xx response to mark the step accepted. Non-2xx responses are stored as `api_webhook_rejected`.

WhatsApp and SMS steps can use Brevo or Infobip. Production is configured to prefer Infobip for WhatsApp/SMS:

- `WHATSAPP_PROVIDER=infobip`
- `SMS_PROVIDER=infobip`
- `INFOBIP_API_KEY`, hosted secret, with SMS send and WhatsApp message send permissions
- `INFOBIP_BASE_URL`, your Infobip personal base URL, for example `xxxxx.api.infobip.com`
- `INFOBIP_WHATSAPP_SENDER`, the registered WhatsApp sender number
- `INFOBIP_WHATSAPP_TEMPLATE_NAME`, the approved WhatsApp template name
- `INFOBIP_WHATSAPP_TEMPLATE_ID`, optional provider template id for admin visibility
- `INFOBIP_WHATSAPP_TEMPLATE_LANGUAGE`, optional, defaults to `es`
- `INFOBIP_WHATSAPP_LINK_PLACEMENT=button`, sends the unique invite token as the dynamic URL button parameter
- `INFOBIP_WEBHOOK_TOKEN`, optional secret used to authenticate inbound WhatsApp callbacks
- `INFOBIP_SMS_SENDER`, the approved SMS sender name or number
- `DEFAULT_PHONE_COUNTRY_CODE`, optional, defaults to `502`

For Infobip WhatsApp, proactive outbound messages use a Meta-approved template. With the default button URL template, Gazelle passes three body placeholders in this order: candidate name, candidate-facing brand, and role. It also passes the unique invite token as the `URL` button parameter, so the approved button URL should be `https://gazellehunt.meikapen.com/candidate?invite={{1}}`. If a future template puts the full link in the message body instead, set `INFOBIP_WHATSAPP_LINK_PLACEMENT=body` and Gazelle will send the full link as a fourth body placeholder.

Before sending a WhatsApp step through Infobip, Gazelle checks the selected template against the configured sender's template list and only sends when the selected template/language is returned as approved or active. If the template is pending, rejected, paused, missing, or cannot be verified, the journey event fails with `whatsapp_template_not_approved` or `whatsapp_template_validation_unavailable` instead of attempting a blind send.

Inbound candidate replies should be configured in Infobip to POST to `https://gazellehunt.meikapen.com/api/infobip/webhook`. If `INFOBIP_WEBHOOK_TOKEN` is set, send it either as `Authorization: Bearer TOKEN`, `X-Gazelle-Webhook-Token: TOKEN`, or as `?token=TOKEN`. Gazelle matches replies to candidates by normalized phone number, stores the WhatsApp reply on the candidate timeline, audits the event, and stops pending journey reminders for that candidate with `candidate_replied`.

The default journey preset starts in Spanish-first WhatsApp and skips weekends for every configured business-day step:

1. Same business day: WhatsApp invitation.
2. Same business day + 1 hour: email reminder.
3. Business day 1: WhatsApp reminder.
4. Business day 2: WhatsApp reminder.
5. Business day 3: email reminder.
6. Business day 4: final WhatsApp reminder.

If Infobip SMS cannot cover the destination country, Gazelle can switch SMS to a simple HTTP provider by setting `SMS_PROVIDER=custom_http` and configuring `CUSTOM_SMS_ENDPOINT`, `CUSTOM_SMS_API_KEY`, and `CUSTOM_SMS_SENDER`. The provider must accept a JSON payload with `from`, `to`, `text`, `messageId`, and `tag`; adjust `CUSTOM_SMS_AUTH_HEADER` and `CUSTOM_SMS_AUTH_SCHEME` if the provider does not use `Authorization: Bearer`.

Implementation references: [Infobip API authentication](https://www.infobip.com/docs/essentials/api-essentials/api-authentication), [Infobip base URL](https://www.infobip.com/docs/essentials/api-essentials/base-url), [Infobip WhatsApp template messages](https://www.infobip.com/docs/api/channels/whatsapp/whatsapp-outbound-messages/send-whatsapp-template-message), and [Infobip SMS API](https://www.infobip.com/docs/api/channels/sms).

## AI provider configuration

The app supports either OpenAI or Google Gemini. Set `AI_PROVIDER` to `openai` or `gemini`.

For OpenAI, store `OPENAI_API_KEY` as a hosted secret. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`, which supports the Responses API and strict Structured Outputs with lower latency and cost for this non-reasoning extraction and synthesis workload. Analysis requests are queued, retried safely up to three times, and recovered by the scheduled Worker handler. `OPENAI_BACKGROUND` is off by default so short `gpt-4.1-mini` analyses complete directly inside the Worker background task; set it to `true` only if a future model requires OpenAI background responses.

For a Google AI Studio project, create an API key and store it as the hosted secret `GEMINI_API_KEY`. `GEMINI_MODEL` is optional and defaults to the stable `gemini-3.5-flash` model. The app calls the Gemini Generate Content API with a JSON response schema. `GOOGLE_API_KEY` is also accepted, but `GEMINI_API_KEY` is preferred so the deployment contract is explicit.

The server sends deidentified, job-related assessment evidence to the selected provider. Candidate name, email, and phone are excluded. Both scenario generation and report analysis use JSON schemas; OpenAI API storage is disabled with `store: false`. Scenario and analysis prompts are separately versioned, and the stored report includes the provider, model, response ID when available, and SHA-256 hashes of its evidence and output.

The AI output is prohibited from diagnosing the candidate, inferring protected or sensitive characteristics, estimating retention probability, ranking candidates, or recommending hire/reject decisions. The 1–5 rating is a structured job-alignment evidence summary, not a cut score.

## Outcome calibration

The hiring workspace includes a **Calibration** module for feeding real-world evidence back into Gazelle Hunt. For any completed test, recruiters and admins can record outcomes such as hired, started, retention checkpoint, exit, not hired, or performance review. The app stores the outcome against the frozen assessment/test version and recalculates coverage, 30/90/180-day retention, average tenure, average performance, and the directional difference between candidates scoring 65+ and lower-scoring candidates.

Sample status is conservative by design: fewer than 30 known-tenure outcomes is a learning sample, 30-99 is directional, and 100+ is calibration-ready for deeper analysis. These metrics are evidence for validation and threshold review, not automatic hiring decisions.

## Public access

Invitation links use `/candidate?invite=...` and open the bilingual candidate portal. Candidates see the company welcome, preparation guidance, hiring-stage timeline, messages, assessment access, account options, and referral progress before entering a test. The assessment itself still begins with `Choose your language · Elige tu idioma`; the suggested email language never bypasses this choice. Consent explicitly describes the three scenario questions and AI-assisted recruiter report before any response is recorded.

Candidate password accounts are separate from hiring-team accounts and use a dedicated secure session cookie. Google sign-in requires `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`; the authorized redirect URI is `${APP_BASE_URL}/api/candidate/auth/google/callback`. A valid invitation is required to create a new candidate account, and only applications with the same verified email are linked.

Each candidate/test pair starts with three released attempts. Accepted provider sends consume an attempt; failed sends do not. Recruiters can resend while capacity remains, while company administrators and the single super administrator can release three additional attempts at a time. Every release is audited.

The production candidate host is a Cloudflare Worker backed by D1. Canonical URL: `https://gazellehunt.meikapen.com` (fallback `https://gazelle-assessment.gazellehunt.workers.dev`). Candidates do not need ChatGPT, OpenAI, or a hiring-team account to open a valid invitation. Hiring-team data remains protected by the application's own server-side sessions and role/company checks. Invitation tokens grant access only to a single candidate assessment and are stored only as SHA-256 hashes.

## Cloudflare deployment

`wrangler.jsonc` defines the Worker entry point, the production D1 binding, public non-secret variables, and the `workers.dev` fallback URL. Install and verify the project before deployment:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm deploy:cloudflare
```

Configure `AUTH_PEPPER`, `SUPER_ADMIN_BOOTSTRAP_TOKEN`, `BREVO_API_KEY`, `BREVO_SMTP_KEY`, `BREVO_WEBHOOK_TOKEN`, and the selected AI provider key with `wrangler secret put`; never add their values to `wrangler.jsonc` or source control. Production uses the Brevo Transactional Email API so every accepted message receives a provider ID that can be reconciled with delivery events; the authenticated SMTP relay remains available as a fallback transport. After changing the public domain, update `APP_BASE_URL`, redeploy, and recreate the Brevo webhook so invitations and candidate portal links use the new origin.

## Production boundary

Before operational selection use, an I/O psychologist and employment counsel should review the item bank, role analysis, interpretation, accommodations, local legal requirements, bilingual adaptation evidence, and adverse-impact monitoring plan. The pilot must pre-register outcomes and preserve assessment/model versions so later validity analyses use the exact instrument each candidate completed.
