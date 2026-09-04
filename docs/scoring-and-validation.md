# Tenure Potential Scoring and Validation Contract

## Current status

- Assessment version: `TP-0.2.1`
- Scoring model: `transparent-equal-weight-v1`
- Status: `pilot_uncalibrated`
- Permitted claim: descriptive Tenure Potential index for research and structured human review
- Prohibited claim: probability that a candidate will stay, validated hiring recommendation, or automatic pass/fail decision

## Construct design

### Scored constructs

1. **Role reality alignment** — six items covering schedule, location, compensation model, customer intensity, performance metrics, and schedule-change expectation.
2. **Stay intention** — six items covering six-month intention, training investment, continued job search, temporary-role framing, career path, and perceived realism.
3. **Work reliability** — six items covering quality during repetition, recovery after setbacks, early support-seeking, follow-through, adjustment persistence, and overcommitment.

Each construct contributes one-third of the pilot index.

Version `TP-0.2.1` replaces the first schedule item with a role-neutral statement about compatibility with the schedule actually communicated for the position. The scoring key and equal-weight model are unchanged. Assessments completed under `TP-0.2.0` retain their original item wording and version in the audit record.

### Unscored evidence

**Support leverage** contains five items. It identifies employer-controlled conditions that may help the candidate sustain tenure: written expectations, a consistent coach, schedule notice, specific feedback, and a safe way to raise concerns.

**Commitment context** contains four branch-specific items. Experienced candidates answer work-history items; first-job candidates answer questions about sustained non-work commitments. This context is reported separately because equal length does not establish psychometric equivalence.

**Scenario evidence** contains three job-related, behaviorally anchored responses selected after scoring. Questions cover role-reality sustainability, reliability/recovery, and realistic persistence. They are displayed separately and contribute zero weight to the index.

**AI-assisted recruiter interpretation** contains exactly five paragraphs in English and five equivalent paragraphs in Spanish. It also produces a 1–5 Job Alignment Evidence Rating that must cite at least three questionnaire items and all three scenarios. The rating summarizes cross-source job-alignment evidence; it does not alter the deterministic index and is not a cut score or selection decision.

## Item scoring

All items use a 1–5 agreement scale.

```text
transformed response = response              (positive-keyed item)
transformed response = 6 - response          (reverse-keyed item)
0–100 item contribution = (transformed - 1) × 25
subscale = mean(item contributions in subscale)
index = mean(fit subscale, intention subscale, reliability subscale)
```

The server stores the raw response, reverse-scoring flag, transformed response, 0–100 contribution, response time, and inclusion rule for every item.

## Response-quality checks

- Missing required items block scoring.
- A single response category used for at least 80% of scored items creates a low-variation review flag.
- Large disagreement across reverse-keyed content pairs creates a consistency review flag.
- Average completion below 2.5 seconds per item creates a speed review flag.

Flags do not silently alter the score. They are reported to the human reviewer.

## Audit fingerprint

The server canonicalizes and hashes:

- assessment and model versions
- candidate/invitation/assessment identifiers
- locale and experience branch
- start/completion timestamps and duration
- item responses and timings
- complete score object and scoring trace
- scenario identifiers, responses, language, and timing

The SHA-256 digest is stored with the result. A changed input or scoring result produces a different digest.

AI provenance is stored separately: provider, model snapshot, prompt version, provider response ID when available, evidence hash, output hash, generation status, and timestamp. This separation makes it possible to reproduce the transparent score without depending on a generative model and to audit a regenerated narrative independently.

## AI use boundary

- Candidate free text is treated as untrusted evidence, never as model instructions.
- Candidate identity and contact fields are excluded from model input.
- Diagnosis, deception judgments, protected-trait inference, ranking, and automated employment decisions are prohibited.
- The narrative must distinguish observed evidence, interpretation, and missing evidence.
- The 1–5 rating must integrate the questionnaire and all three scenarios, record counterevidence, state confidence, and cite its evidence IDs.
- Human review with other job-related information is mandatory.

## Validation gates

1. Role and content analysis with an I/O psychologist.
2. English and Spanish cognitive interviews in each target hiring market.
3. Translation/adaptation review and documented item changes.
4. Item distributions, factor structure, omega reliability, and response-quality analysis.
5. Configural, metric, and scalar invariance plus differential item functioning by language and country.
6. Pre-registered 90-day and 180-day **voluntary** turnover outcomes; involuntary exits and business closures must be separated.
7. Interpretable survival or discrete-time logistic model trained on local data with assessment/model version controls.
8. Holdout evaluation with calibration intercept/slope, calibration curve, Brier score, discrimination metric, confidence intervals, and role/site transport checks.
9. Adverse-impact and suitable-alternative review by job, site, language, and legally permitted groups.
10. Change control and revalidation every 6–12 months or after material item/model/job changes.

Until these gates pass, bands are descriptive summaries and must not be converted into cut scores.

## Outcome feedback and calibration

Gazelle now stores post-assessment outcomes in a generic `assessment_outcomes` table so the same feedback loop can support Tenure Potential and future tests. Each record links the completed assessment, candidate, company, test version, outcome type, date, optional tenure days, optional 1–5 performance rating, employment status, source, notes, recorder, and audit event.

This implements a criterion-related validation workflow:

1. **Predictor snapshot:** the original assessment score, band, test id, and model version stay frozen.
2. **Criterion evidence:** recruiters or admins add real outcomes such as hired, started, 30/90/180-day checkpoint, exit, not hired, or performance review.
3. **Coverage monitoring:** the app shows what share of completed tests already has known outcome evidence.
4. **Retention checkpoints:** the app reports retained 30/90/180 based on known tenure outcomes.
5. **Score/outcome signal:** the app compares 90-day retention for candidates scoring 65+ against lower-scoring candidates.
6. **Sample gates:** fewer than 30 known-tenure outcomes is a learning sample; 30–99 is directional; 100+ is calibration-ready for deeper review.

These metrics are intentionally conservative. They are operational learning signals, not automatic employment decisions. Any threshold change should be documented, reviewed for job relevance, checked for adverse impact, and validated again after material changes to test content, job conditions, market, language, or scoring model.
