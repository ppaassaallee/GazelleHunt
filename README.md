# Gazelle Assessment — Tenure Potential

Gazelle Assessment is an auditable bilingual research application for measuring **Tenure Potential** in high-volume BPO and contact-center hiring.

It does not claim to predict that a candidate will stay. The current `TP-0.2.0` assessment produces a transparent pilot index that must be calibrated against local 90-day and 180-day voluntary-retention outcomes before anyone may describe it as predictive.

## What is implemented

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
- CSV import and authenticated admin attribution

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

## Candidate access

Invitation links use `/assessment?invite=...` and open a candidate-only interface. The first interactive screen always asks `Choose your language · Elige tu idioma`; the suggested email language never bypasses this choice. Consent explicitly describes the three scenario questions and AI-assisted recruiter report before any response is recorded.

The hosting access policy must allow the intended candidates to reach `/assessment`. A private owner-only deployment is suitable for internal review but not for external candidate delivery.

## Production boundary

Before operational selection use, an I/O psychologist and employment counsel should review the item bank, role analysis, interpretation, accommodations, local legal requirements, bilingual adaptation evidence, and adverse-impact monitoring plan. The pilot must pre-register outcomes and preserve assessment/model versions so later validity analyses use the exact instrument each candidate completed.
