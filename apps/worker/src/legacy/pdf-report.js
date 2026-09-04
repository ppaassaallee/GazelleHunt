(function initializeGazellePdfReport(global) {
  const WIDTH = 595;
  const HEIGHT = 842;
  const MARGIN = 46;

  function pdfText(value) {
    return String(value ?? '')
      .replace(/[–—]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/•/g, '*')
      .replace(/…/g, '...')
      .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function wrap(value, maxWidth, fontSize) {
    const maxChars = Math.max(12, Math.floor(maxWidth / (fontSize * 0.52)));
    const words = String(value ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      if (word.length > maxChars) {
        if (line) lines.push(line);
        for (let index = 0; index < word.length; index += maxChars) lines.push(word.slice(index, index + maxChars));
        line = '';
      } else if (!line || `${line} ${word}`.length <= maxChars) {
        line = line ? `${line} ${word}` : word;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  class ReportBuilder {
    constructor(locale) {
      this.locale = locale === 'es' ? 'es' : 'en';
      this.pages = [];
      this.page = null;
      this.y = 0;
      this.newPage();
    }

    newPage() {
      this.page = [];
      this.pages.push(this.page);
      this.page.push('1 1 1 rg 0 0 595 842 re f');
      this.page.push('0.090 0.247 0.259 rg 0 801 595 41 re f');
      this.page.push('0.894 0.341 0.106 rg 0 798 595 3 re f');
      this.text('GAZELLE ASSESSMENT', MARGIN, 817, 10, true, '1 1 1');
      this.y = 771;
    }

    text(value, x, y, size = 10, bold = false, color = '0.125 0.153 0.157') {
      this.page.push(`${color} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfText(value)}) Tj ET`);
    }

    ensure(height) {
      if (this.y - height < 52) this.newPage();
    }

    rule() {
      this.page.push(`0.82 0.82 0.78 RG 0.7 w ${MARGIN} ${this.y} m ${WIDTH - MARGIN} ${this.y} l S`);
      this.y -= 14;
    }

    heading(value, size = 16) {
      this.ensure(size + 22);
      this.text(value, MARGIN, this.y, size, true, '0.090 0.247 0.259');
      this.y -= size + 10;
    }

    section(value, eyebrow = '') {
      this.ensure(46);
      if (eyebrow) {
        this.text(eyebrow.toUpperCase(), MARGIN, this.y, 7, true, '0.894 0.341 0.106');
        this.y -= 14;
      }
      this.heading(value, 15);
    }

    paragraph(value, options = {}) {
      const size = options.size || 10;
      const leading = options.leading || 14;
      const width = options.width || WIDTH - MARGIN * 2;
      const lines = wrap(value, width, size);
      this.ensure(lines.length * leading + 10);
      for (const line of lines) {
        this.text(line, options.x || MARGIN, this.y, size, Boolean(options.bold), options.color || '0.19 0.22 0.22');
        this.y -= leading;
      }
      this.y -= options.after ?? 8;
    }

    labelValue(label, value) {
      this.ensure(24);
      this.text(label.toUpperCase(), MARGIN, this.y, 8, true, '0.42 0.45 0.44');
      this.text(value, 190, this.y, 10, true);
      this.y -= 19;
    }

    callout(value, options = {}) {
      const size = options.size || 10;
      const leading = options.leading || 14;
      const lines = wrap(value, WIDTH - MARGIN * 2 - 28, size);
      const height = lines.length * leading + 24;
      this.ensure(height + 10);
      this.page.push(`${options.fill || '0.922 0.969 0.965'} rg ${MARGIN} ${this.y - height + 8} ${WIDTH - MARGIN * 2} ${height} re f`);
      this.page.push(`${options.accent || '0.035 0.498 0.514'} rg ${MARGIN} ${this.y - height + 8} 4 ${height} re f`);
      let lineY = this.y - 8;
      for (const line of lines) {
        this.text(line, MARGIN + 16, lineY, size, Boolean(options.bold), options.color || '0.15 0.24 0.25');
        lineY -= leading;
      }
      this.y -= height + 8;
    }

    bullets(items, options = {}) {
      for (const item of items || []) this.paragraph(`- ${item}`, { size: options.size || 9, leading: options.leading || 13, after: options.after ?? 3, x: options.x, width: options.width });
    }

    bar(label, value) {
      this.ensure(32);
      const numeric = value == null ? null : Math.max(0, Math.min(100, Number(value)));
      this.text(label, MARGIN, this.y, 9, true, '0.25 0.31 0.32');
      this.text(numeric == null ? '-' : numeric.toFixed(1), WIDTH - MARGIN - 31, this.y, 9, true, '0.090 0.247 0.259');
      this.y -= 12;
      this.page.push(`0.894 0.914 0.910 rg ${MARGIN} ${this.y - 3} ${WIDTH - MARGIN * 2} 7 re f`);
      if (numeric != null) this.page.push(`0.035 0.498 0.514 rg ${MARGIN} ${this.y - 3} ${(WIDTH - MARGIN * 2) * numeric / 100} 7 re f`);
      this.y -= 18;
    }

    alignment(rating, labels) {
      this.ensure(66);
      const gap = 5;
      const width = (WIDTH - MARGIN * 2 - gap * 4) / 5;
      for (let index = 0; index < 5; index += 1) {
        const x = MARGIN + index * (width + gap);
        const active = index < rating;
        const current = index + 1 === rating;
        this.page.push(`${current ? '0.996 0.945 0.910' : active ? '0.922 0.969 0.965' : '0.965 0.972 0.970'} rg ${x} ${this.y - 42} ${width} 48 re f`);
        this.page.push(`${current ? '0.894 0.341 0.106' : active ? '0.035 0.498 0.514' : '0.78 0.82 0.81'} RG ${current ? 1.8 : 0.7} w ${x} ${this.y - 42} ${width} 48 re S`);
        this.text(String(index + 1), x + 8, this.y - 15, 13, true, current ? '0.72 0.235 0.031' : active ? '0.035 0.390 0.400' : '0.45 0.49 0.49');
        this.text(labels[index], x + 8, this.y - 31, 7, true, '0.32 0.37 0.37');
      }
      this.y -= 62;
    }

    score(label, value, x, y, width) {
      this.page.push(`0.965 0.972 0.970 rg ${x} ${y - 36} ${width} 56 re f`);
      this.page.push(`0.82 0.85 0.84 RG 0.7 w ${x} ${y - 36} ${width} 56 re S`);
      this.text(label, x + 10, y + 5, 7, true, '0.42 0.45 0.44');
      this.text(value == null ? '-' : String(value), x + 10, y - 21, 18, true, '0.090 0.247 0.259');
    }
  }

  function buildPdf(pages) {
    const objects = [null];
    const add = (value) => { objects.push(value); return objects.length - 1; };
    const fontRegular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pagesId = add('');
    const pageIds = [];

    pages.forEach((commands, index) => {
      commands.push(`0.82 0.85 0.84 RG 0.6 w ${MARGIN} 40 m ${WIDTH - MARGIN} 40 l S`);
      commands.push(`0.42 0.45 0.44 rg BT /F1 7 Tf 1 0 0 1 ${MARGIN} 24 Tm (CONFIDENTIAL - STRUCTURED ASSESSMENT EVIDENCE) Tj ET`);
      commands.push(`0.42 0.45 0.44 rg BT /F1 8 Tf 1 0 0 1 ${WIDTH - MARGIN - 74} 24 Tm (Page ${index + 1} of ${pages.length}) Tj ET`);
      const stream = `${commands.join('\n')}\n`;
      const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${WIDTH} ${HEIGHT}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    });

    objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let binary = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = binary.length;
      binary += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xref = binary.length;
    binary += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id += 1) binary += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    binary += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Uint8Array.from(binary, (character) => character.charCodeAt(0) & 0xff);
  }

  function createBytes(report, locale = 'en') {
    const es = locale === 'es';
    const copy = es ? {
      title: 'Reporte de Potencial de Permanencia', subtitle: 'Perfil estructurado de evidencia laboral', profile: 'Perfil cuantitativo', alignment: 'Alineación laboral basada en evidencia', analysis: 'Interpretación profesional asistida', scenarios: 'Análisis de los tres escenarios', actions: 'Guía de entrevista e incorporación', audit: 'Registro técnico y alcance',
      index: 'Índice del cuestionario', fit: 'Realidad del puesto', intent: 'Intención de permanencia', reliability: 'Confiabilidad laboral', context: 'Contexto de compromiso', aiRating: 'Alineación IA', quality: 'Calidad de respuesta',
      noAi: 'El análisis de IA no se ha generado para este resultado.', answer: 'Respuesta del candidato', finding: 'Lectura conductual', strengths: 'Fortalezas observadas', watch: 'Aspectos por verificar', interview: 'Preguntas de entrevista', support: 'Acciones de incorporación',
      scope: 'Utilice este perfil con una entrevista estructurada y otra evidencia relacionada con el puesto. La validación contra resultados locales de permanencia sigue en desarrollo.',
      paragraphLabels: ['Resultado general', 'Ajuste al puesto e interés de permanencia', 'Respuesta ante situaciones laborales', 'Acciones recomendadas para supervisión', 'Qué confirmar en entrevista'],
      alignmentLabels: ['Limitada', 'Baja', 'Mixta', 'Alineada', 'Sólida'],
    } : {
      title: 'Tenure Potential Report', subtitle: 'Structured profile of job-related evidence', profile: 'Quantitative profile', alignment: 'Evidence-based job alignment', analysis: 'Assisted professional interpretation', scenarios: 'Analysis of all three scenarios', actions: 'Interview and onboarding guide', audit: 'Technical record and scope',
      index: 'Questionnaire index', fit: 'Role reality', intent: 'Stay intention', reliability: 'Work reliability', context: 'Commitment context', aiRating: 'AI alignment', quality: 'Response quality',
      noAi: 'AI analysis has not been generated for this result.', answer: 'Candidate response', finding: 'Behavioral finding', strengths: 'Observed strengths', watch: 'Areas to verify', interview: 'Structured interview probes', support: 'Onboarding actions',
      scope: 'Use this profile with a structured interview and other job-related evidence. Validation against local tenure outcomes remains in progress.',
      paragraphLabels: ['Overall result', 'Role fit and interest in staying', 'Response to work situations', 'Recommended management actions', 'What to confirm in the interview'],
      alignmentLabels: ['Limited', 'Below', 'Mixed', 'Aligned', 'Strong'],
    };

    const builder = new ReportBuilder(locale);
    const analysis = report.aiAnalysis?.output?.[es ? 'es' : 'en'];
    const alignment = analysis?.job_alignment;
    const readable = (value) => global.GazelleAiAssessment?.recruiterText(value, es ? 'es' : 'en') || String(value || '');
    const readableList = (values) => (values || []).map(readable);
    const confidence = (es
      ? { low: 'Baja', moderate: 'Moderada', high: 'Alta' }
      : { low: 'Low', moderate: 'Moderate', high: 'High' })[alignment?.confidence] || readable(alignment?.confidence);
    const signalLabels = es
      ? { supportive: 'Evidencia favorable', mixed: 'Evidencia mixta', limited: 'Evidencia limitada' }
      : { supportive: 'Supportive evidence', mixed: 'Mixed evidence', limited: 'Limited evidence' };
    const rating = Number.isInteger(alignment?.rating) ? alignment.rating : null;
    const provider = report.aiAnalysis?.provider || 'AI';
    const quality = report.quality?.status === 'pilot_usable'
      ? (es ? 'Patrón claro' : 'Clear pattern')
      : report.quality?.status === 'review_required'
        ? (es ? 'Revisar calidad' : 'Review quality')
        : (es ? 'Registrada' : 'Recorded');

    builder.text(copy.title, MARGIN, builder.y, 24, true, '0.090 0.247 0.259');
    builder.y -= 28;
    builder.text(copy.subtitle, MARGIN, builder.y, 11, false, '0.37 0.43 0.43');
    builder.y -= 28;
    builder.callout(`${report.name || '-'}  |  ${report.role || '-'}${report.site ? `  |  ${report.site}` : ''}`, { bold: true, fill: '0.965 0.972 0.970', accent: '0.894 0.341 0.106' });
    builder.labelValue(es ? 'Completado' : 'Completed', report.completedAt ? new Date(report.completedAt).toLocaleString(es ? 'es' : 'en') : '-');
    builder.y -= 7;
    builder.score(copy.index, report.potentialIndex == null ? '-' : `${Number(report.potentialIndex).toFixed(1)} / 100`, MARGIN, builder.y, 160);
    builder.score(copy.aiRating, rating == null ? '-' : `${rating} / 5`, 217, builder.y, 160);
    builder.score(copy.quality, quality, 388, builder.y, 161);
    builder.y -= 72;

    builder.section(copy.profile, es ? 'Cuestionario estructurado' : 'Structured questionnaire');
    builder.bar(copy.fit, report.subscales?.fit?.score);
    builder.bar(copy.intent, report.subscales?.intent?.score);
    builder.bar(copy.reliability, report.subscales?.reliability?.score);
    builder.bar(copy.context, report.subscales?.context?.score);

    if (alignment) {
      builder.section(copy.alignment, es ? 'Cuestionario + tres escenarios' : 'Questionnaire + three scenarios');
      builder.alignment(rating, copy.alignmentLabels);
      builder.callout(`${readable(es ? alignment.label_es : alignment.label_en)}. ${readable(es ? alignment.rationale_es : alignment.rationale_en)}`, { fill: '0.996 0.965 0.941', accent: '0.894 0.341 0.106' });
      builder.paragraph(copy.strengths, { bold: true, color: '0.090 0.247 0.259', after: 4 });
      builder.bullets(readableList(analysis.observed_strengths));
      builder.paragraph(copy.watch, { bold: true, color: '0.090 0.247 0.259', after: 4 });
      builder.bullets(readableList(analysis.watch_areas));
      builder.paragraph(`${es ? 'Confianza del análisis' : 'Analysis confidence'}: ${confidence}. ${es ? 'La evidencia técnica citada permanece disponible en la auditoría del sistema.' : 'The cited technical evidence remains available in the system audit.'}`, { size: 8, color: '0.43 0.47 0.47' });
    }

    builder.section(copy.analysis, `${provider} | ${report.aiAnalysis?.model || '-'}`);
    if (analysis?.paragraphs?.length === 5) {
      if (analysis.executive_summary) builder.callout(readable(analysis.executive_summary), { bold: true });
      analysis.paragraphs.forEach((paragraph, index) => {
        builder.paragraph(`${index + 1}. ${copy.paragraphLabels[index]}`, { size: 10, bold: true, color: '0.090 0.247 0.259', after: 4 });
        builder.paragraph(readable(paragraph), { size: 9.5, leading: 13.5, after: 10 });
      });
    } else {
      builder.paragraph(copy.noAi);
    }

    builder.ensure(180);
    builder.section(copy.scenarios, es ? 'Evidencia conductual abierta' : 'Open behavioral evidence');
    (report.scenarioResponses || []).forEach((entry, index) => {
      const scenarioId = entry.scenario_id || entry.id;
      const finding = (analysis?.scenario_findings || []).find((item) => item.scenario_id === scenarioId);
      builder.paragraph(`${index + 1}. ${es ? entry.question_es : entry.question_en}`, { bold: true, color: '0.090 0.247 0.259', after: 5 });
      builder.paragraph(`${copy.answer}: ${entry.response_text}`, { size: 9, color: '0.24 0.27 0.27', after: 6 });
      if (finding) builder.callout(`${signalLabels[finding.signal] || readable(finding.signal)}: ${readable(es ? finding.finding_es : finding.finding_en)}`, { size: 9, leading: 13 });
    });

    if (analysis) {
      builder.ensure(150);
      builder.section(copy.actions, es ? 'Aplicación práctica' : 'Practical application');
      builder.paragraph(copy.interview, { bold: true, color: '0.090 0.247 0.259', after: 4 });
      builder.bullets(readableList(analysis.interview_focus));
      builder.paragraph(copy.support, { bold: true, color: '0.090 0.247 0.259', after: 4 });
      builder.bullets(readableList(analysis.support_actions));
    }
    if ((report.supportLabels || []).length) {
      builder.ensure(42 + report.supportLabels.length * 18);
      builder.paragraph(es ? 'Preferencias de apoyo reportadas' : 'Reported support preferences', { bold: true, color: '0.090 0.247 0.259', after: 4 });
      builder.bullets(report.supportLabels);
    }

    builder.ensure(220);
    builder.section(copy.audit, es ? 'Proveniencia auditable' : 'Auditable provenance');
    builder.labelValue(es ? 'Versión de evaluación' : 'Assessment version', report.assessmentVersion || '-');
    builder.labelValue(es ? 'Modelo de puntuación' : 'Scoring model', report.modelVersion || '-');
    builder.labelValue(es ? 'Proveedor de IA' : 'AI provider', report.aiAnalysis?.provider || '-');
    builder.labelValue(es ? 'Modelo de IA' : 'AI model', report.aiAnalysis?.model || '-');
    builder.labelValue(es ? 'Versión del prompt' : 'Prompt version', report.aiAnalysis?.prompt_version || '-');
    builder.paragraph(`${es ? 'Huella de resultado' : 'Result fingerprint'}: ${report.auditHash || '-'}`, { size: 8 });
    builder.paragraph(`${es ? 'Huella de evidencia de IA' : 'AI evidence fingerprint'}: ${report.aiAnalysis?.evidence_hash || '-'}`, { size: 8 });
    builder.paragraph(`${es ? 'Huella de salida de IA' : 'AI output fingerprint'}: ${report.aiAnalysis?.output_hash || '-'}`, { size: 8 });
    builder.callout(copy.scope, { size: 9, fill: '0.965 0.972 0.970', accent: '0.035 0.498 0.514' });

    return buildPdf(builder.pages);
  }

  function download(report, locale = 'en') {
    const bytes = createBytes(report, locale);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const candidate = String(report.name || 'candidate').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    link.href = url;
    link.download = `tenure-potential-${candidate || 'report'}-${locale}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  global.GazellePdfReport = Object.freeze({ createBytes, download });
})(globalThis);
