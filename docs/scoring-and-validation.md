# Tenure Potential Scoring and Validation Contract

## Current status

- Assessment version: `TP-0.2.0`
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

### Unscored evidence

**Support leverage** contains five items. It identifies employer-controlled conditions that may help the candidate sustain tenure: written expectations, a consistent coach, schedule notice, specific feedback, and a safe way to raise concerns.

**Commitment context** contains four branch-specific items. Experienced candidates answer work-history items; first-job candidates answer questions about sustained non-work commitments. This context is reported separately because equal length does not establish psychometric equivalence.

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

The SHA-256 digest is stored with the result. A changed input or scoring result produces a different digest.

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
