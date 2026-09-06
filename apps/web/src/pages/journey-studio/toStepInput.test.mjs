import assert from "node:assert/strict";

function toStepInput(step) {
  if (step.channel === "api") {
    return {
      channel: "api",
      delayHours: step.delayHours,
      businessDayOffset: step.businessDayOffset,
      apiUrl: step.apiUrl,
      apiMethod: step.apiMethod,
      apiHeadersJson: step.apiHeadersJson || undefined,
      messageEs: step.messageEs,
      messageEn: step.messageEn,
    };
  }
  return {
    channel: step.channel,
    delayHours: step.delayHours,
    businessDayOffset: step.businessDayOffset,
    templateName: step.templateRef || undefined,
    brevoTemplateId: step.channel === "whatsapp" ? step.templateRef || undefined : undefined,
    subjectEs: step.subjectEs || undefined,
    subjectEn: step.subjectEs || undefined,
    messageEs: step.messageEs,
    messageEn: step.messageEn,
  };
}

const wa = toStepInput({
  channel: "whatsapp",
  delayHours: 0,
  businessDayOffset: 1,
  templateRef: "recupera_recordatorio",
  subjectEs: "Asunto",
  messageEs: "Hola",
  messageEn: "Hi",
  apiUrl: "",
  apiMethod: "POST",
  apiHeadersJson: "",
});

assert.deepEqual(wa, {
  channel: "whatsapp",
  delayHours: 0,
  businessDayOffset: 1,
  templateName: "recupera_recordatorio",
  brevoTemplateId: "recupera_recordatorio",
  subjectEs: "Asunto",
  subjectEn: "Asunto",
  messageEs: "Hola",
  messageEn: "Hi",
});

const api = toStepInput({
  channel: "api",
  delayHours: 2,
  businessDayOffset: 0,
  templateRef: "",
  subjectEs: "",
  messageEs: "ok",
  messageEn: "ok",
  apiUrl: "https://example.com",
  apiMethod: "POST",
  apiHeadersJson: "",
});

assert.equal(api.apiUrl, "https://example.com");
assert.equal(api.brevoTemplateId, undefined);
console.log("toStepInput snapshot ok");
