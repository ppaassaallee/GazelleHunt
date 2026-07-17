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
      this.page.push('0.973 0.969 0.949 rg 0 0 595 842 re f');
      this.page.push('0.071 0.302 0.302 rg 0 806 595 36 re f');
      this.text('GAZELLE ASSESSMENT', MARGIN, 819, 10, true, '1 1 1');
      this.y = 780;
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
      this.text(value, MARGIN, this.y, size, true, '0.071 0.302 0.302');
      this.y -= size + 10;
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

    score(label, value, x, y, width) {
      this.page.push(`1 1 1 rg ${x} ${y - 30} ${width} 48 re f`);
      this.page.push(`0.82 0.82 0.78 RG 0.7 w ${x} ${y - 30} ${width} 48 re S`);
      this.text(label, x + 10, y + 4, 8, true, '0.42 0.45 0.44');
      this.text(value == null ? '-' : Number(value).toFixed(1), x + 10, y - 16, 17, true, '0.071 0.302 0.302');
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
      title: 'Reporte de Potencial de Permanencia', profile: 'Perfil de evidencia', ai: 'Análisis asistido por GPT-5.5', scenarios: 'Respuestas a escenarios', support: 'Palancas de apoyo', audit: 'Proveniencia y límites',
      index: 'Índice', fit: 'Alineación con el puesto', intent: 'Intención de permanencia', reliability: 'Confiabilidad laboral', context: 'Contexto',
      notice: 'Piloto sin calibrar. Este reporte no es una probabilidad de permanencia ni una decisión de contratación. Requiere revisión humana.',
      noAi: 'El análisis de IA todavía no está disponible para este resultado.', answer: 'Respuesta', evidence: 'Evidencia',
    } : {
      title: 'Tenure Potential Report', profile: 'Evidence profile', ai: 'GPT-5.5 assisted analysis', scenarios: 'Scenario responses', support: 'Support levers', audit: 'Provenance and limits',
      index: 'Index', fit: 'Role reality alignment', intent: 'Stay intention', reliability: 'Work reliability', context: 'Context',
      notice: 'Uncalibrated pilot. This report is not a retention probability or hiring decision. Human review is required.',
      noAi: 'AI analysis is not yet available for this result.', answer: 'Answer', evidence: 'Evidence',
    };

    const builder = new ReportBuilder(locale);
    builder.text(copy.title, MARGIN, builder.y, 25, true, '0.071 0.302 0.302');
    builder.y -= 40;
    builder.paragraph(copy.notice, { size: 10, leading: 15, color: '0.45 0.20 0.08' });
    builder.labelValue(es ? 'Candidato' : 'Candidate', report.name || '-');
    builder.labelValue(es ? 'Puesto' : 'Role', report.role || '-');
    builder.labelValue(es ? 'Sede' : 'Site', report.site || '-');
    builder.labelValue(es ? 'Completado' : 'Completed', report.completedAt ? new Date(report.completedAt).toLocaleString(es ? 'es' : 'en') : '-');
    builder.y -= 10;
    builder.score(copy.index, report.potentialIndex, MARGIN, builder.y, 94);
    builder.score(copy.fit, report.subscales?.fit?.score, 148, builder.y, 124);
    builder.score(copy.intent, report.subscales?.intent?.score, 282, builder.y, 124);
    builder.score(copy.reliability, report.subscales?.reliability?.score, 416, builder.y, 133);
    builder.y -= 70;
    builder.rule();

    builder.heading(copy.profile);
    builder.paragraph(`${copy.index}: ${Number(report.potentialIndex).toFixed(1)} / 100. ${copy.context}: ${report.subscales?.context?.score == null ? '-' : Number(report.subscales.context.score).toFixed(1)}. ${es ? 'Estado de calidad' : 'Quality status'}: ${report.quality?.status || '-'}.`);
    (report.supportLabels || []).forEach((label) => builder.paragraph(`- ${label}`, { after: 2 }));

    builder.heading(copy.ai);
    const analysis = report.aiAnalysis?.output?.[es ? 'es' : 'en'];
    if (analysis?.paragraphs?.length === 5) {
      analysis.paragraphs.forEach((paragraph, index) => {
        builder.paragraph(`${index + 1}. ${paragraph}`, { size: 10, leading: 14, after: 10 });
      });
      if (analysis.interview_focus?.length) {
        builder.paragraph(es ? 'Enfoque para entrevista humana' : 'Human interview focus', { bold: true, after: 5 });
        analysis.interview_focus.forEach((item) => builder.paragraph(`- ${item}`, { after: 3 }));
      }
    } else {
      builder.paragraph(copy.noAi);
    }

    builder.heading(copy.scenarios);
    (report.scenarioResponses || []).forEach((entry, index) => {
      builder.paragraph(`${index + 1}. ${es ? entry.question_es : entry.question_en}`, { bold: true, after: 5 });
      builder.paragraph(`${copy.answer}: ${entry.response_text}`, { color: '0.24 0.27 0.27', after: 12 });
    });

    builder.heading(copy.audit);
    builder.labelValue(es ? 'Versión de evaluación' : 'Assessment version', report.assessmentVersion || '-');
    builder.labelValue(es ? 'Modelo de puntuación' : 'Scoring model', report.modelVersion || '-');
    builder.labelValue(es ? 'Modelo de IA' : 'AI model', report.aiAnalysis?.model || '-');
    builder.labelValue(es ? 'Versión del prompt' : 'Prompt version', report.aiAnalysis?.prompt_version || '-');
    builder.paragraph(`${es ? 'Huella de resultado' : 'Result fingerprint'}: ${report.auditHash || '-'}`, { size: 8 });
    builder.paragraph(`${es ? 'Huella de evidencia de IA' : 'AI evidence fingerprint'}: ${report.aiAnalysis?.evidence_hash || '-'}`, { size: 8 });
    builder.paragraph(copy.notice, { bold: true, color: '0.45 0.20 0.08' });

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
