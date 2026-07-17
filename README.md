# Gazelle Assessment — Tenure Potential

Gazelle Assessment is an auditable bilingual research application for measuring **Tenure Potential** in high-volume BPO and contact-center hiring.

It does not claim to predict that a candidate will stay. The current `TP-0.2.0` assessment produces a transparent pilot index that must be calibrated against local 90-day and 180-day voluntary-retention outcomes before anyone may describe it as predictive.

## What is implemented

- English/Spanish language choice before the assessment
- Separate experienced and first-job context branches of equal length
- 27 items per candidate path
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

## Production boundary

Before operational selection use, an I/O psychologist and employment counsel should review the item bank, role analysis, interpretation, accommodations, local legal requirements, bilingual adaptation evidence, and adverse-impact monitoring plan. The pilot must pre-register outcomes and preserve assessment/model versions so later validity analyses use the exact instrument each candidate completed.
