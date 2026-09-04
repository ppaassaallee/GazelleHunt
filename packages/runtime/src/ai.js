/**
 * Meikapen runtime — AI provider layer (OpenAI / Gemini JSON).
 * Move-only extraction from server-worker.js. Do not improve.
 * fetchWithTimeout() remains in server-worker (shared with messaging).
 */
function aiConfig(env) {
  const openAiKey = String(env.OPENAI_API_KEY || '');
  const geminiKey = String(env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '');
  const requested = cleanText(env.AI_PROVIDER, 30).toLowerCase();
  const providerKey = ['openai', 'gemini'].includes(requested)
    ? requested
    : openAiKey ? 'openai' : geminiKey ? 'gemini' : 'openai';
  const openAiModel = cleanText(env.OPENAI_MODEL, 120) || GazelleAiAssessment.DEFAULT_MODEL;
  const geminiModel = cleanText(env.GEMINI_MODEL, 120) || GazelleAiAssessment.DEFAULT_GEMINI_MODEL;
  const apiKey = providerKey === 'gemini' ? geminiKey : openAiKey;
  const background = String(env.OPENAI_BACKGROUND || '').toLowerCase() === 'true';
  return {
    configured: Boolean(apiKey),
    providerKey,
    provider: providerKey === 'gemini' ? 'Google Gemini' : 'OpenAI',
    apiKey,
    model: providerKey === 'gemini' ? geminiModel : openAiModel,
    background,
  };
}

function responseOutputText(body) {
  if (typeof body?.output_text === 'string') return body.output_text;
  for (const item of body?.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

function openAiSupportsReasoning(model) {
  return /^(?:gpt-5|o[134](?:-|$))/i.test(String(model || ''));
}

function openAiJsonResult(body, config) {
  if (['queued', 'in_progress'].includes(body?.status)) {
    return { pending: true, responseId: cleanText(body.id, 200), model: cleanText(body.model, 120) || config.model };
  }
  if (['failed', 'cancelled', 'incomplete'].includes(body?.status)) {
    const error = new Error(body?.status === 'incomplete' ? 'openai_incomplete' : 'openai_background_failed');
    error.providerMessage = cleanText(body?.error?.message || body?.incomplete_details?.reason || 'OpenAI could not complete the response.', 400);
    throw error;
  }
  const text = responseOutputText(body);
  if (!text) throw new Error('openai_empty_output');
  try {
    return { data: JSON.parse(text), responseId: cleanText(body.id, 200), model: cleanText(body.model, 120) || config.model };
  } catch {
    throw new Error('openai_invalid_json');
  }
}

async function retrieveOpenAiJson(config, responseId) {
  const response = await fetchWithTimeout(`https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${config.apiKey}` },
  }, 10000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('openai_retrieve_failed');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'OpenAI rejected the status request.', 400);
    throw error;
  }
  return openAiJsonResult(body, config);
}

async function callOpenAiJson(config, { instructions, input, schema, schemaName, safetyIdentifier, maxOutputTokens, reasoningEffort = 'medium', background = false }) {
  const payload = {
    model: config.model,
    instructions,
    input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(input) }] }],
    text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
    max_output_tokens: maxOutputTokens,
    safety_identifier: safetyIdentifier,
  };
  if (background) payload.background = true;
  else payload.store = false;
  if (openAiSupportsReasoning(config.model)) payload.reasoning = { effort: reasoningEffort };
  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }, background ? 10000 : 25000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('openai_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'OpenAI rejected the request.', 400);
    throw error;
  }
  return openAiJsonResult(body, config);
}

async function callGeminiJson(config, { instructions, input, schema, maxOutputTokens }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'x-goog-api-key': config.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        maxOutputTokens,
        temperature: 0.2,
      },
    }),
  }, 25000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('gemini_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'Gemini rejected the request.', 400);
    throw error;
  }
  const text = (body?.candidates?.[0]?.content?.parts || []).map((part) => part?.text || '').join('');
  if (!text) throw new Error('gemini_empty_output');
  try {
    return {
      data: JSON.parse(text),
      responseId: cleanText(body.responseId, 200) || null,
      model: cleanText(body.modelVersion, 120) || config.model,
      provider: config.provider,
    };
  } catch {
    throw new Error('gemini_invalid_json');
  }
}

async function callAiJson(env, request) {
  const config = aiConfig(env);
  if (!config.configured) throw new Error('ai_not_configured');
  const result = config.providerKey === 'gemini'
    ? await callGeminiJson(config, request)
    : await callOpenAiJson(config, request);
  return { ...result, provider: config.provider };
}

function isRetryableAiError(error) {
  const status = Number(error?.providerStatus || 0);
  const code = cleanText(error?.message, 120);
  if (['provider_timeout', 'openai_empty_output', 'gemini_empty_output'].includes(code)) return true;
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500 || (!status && !['ai_invalid_analysis', 'scenario_evidence_incomplete', 'assessment_not_found', 'ai_not_configured'].includes(code));
}
