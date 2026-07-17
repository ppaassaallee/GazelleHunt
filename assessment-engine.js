(function initializeGazelleAssessment(global) {
  const ASSESSMENT_VERSION = 'TP-0.2.0';
  const MODEL_VERSION = 'transparent-equal-weight-v1';

  const RESPONSE_LABELS = {
    en: ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'],
    es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Ni de acuerdo ni en desacuerdo', 'De acuerdo', 'Totalmente de acuerdo'],
  };

  const DIMENSIONS = {
    fit: {
      en: 'Role reality alignment',
      es: 'Alineación con la realidad del puesto',
      description: {
        en: 'Whether the stated schedule, location, compensation model, work intensity, and performance expectations are sustainable for this candidate.',
        es: 'Si el horario, la ubicación, el modelo de compensación, la intensidad y las expectativas de desempeño son sostenibles para la persona.',
      },
    },
    intent: {
      en: 'Stay intention',
      es: 'Intención de permanencia',
      description: {
        en: 'Current commitment to invest in the role and remain when the stated conditions are honored.',
        es: 'Compromiso actual de invertir en el puesto y permanecer cuando se cumplen las condiciones informadas.',
      },
    },
    reliability: {
      en: 'Work reliability',
      es: 'Confiabilidad laboral',
      description: {
        en: 'Self-regulation, follow-through, recovery from setbacks, and early support-seeking.',
        es: 'Autorregulación, cumplimiento, recuperación ante dificultades y búsqueda oportuna de apoyo.',
      },
    },
    support: {
      en: 'Support leverage',
      es: 'Palancas de apoyo',
      description: {
        en: 'Conditions the employer can provide to improve the candidate’s chance of sustaining tenure. This dimension is not added to the score.',
        es: 'Condiciones que la empresa puede ofrecer para mejorar la posibilidad de permanencia. Esta dimensión no se suma al puntaje.',
      },
    },
    context: {
      en: 'Commitment context',
      es: 'Contexto de compromiso',
      description: {
        en: 'Work-history or non-work commitment evidence. It is reported separately until branch equivalence is validated.',
        es: 'Evidencia de historial laboral o compromisos no laborales. Se reporta por separado hasta validar la equivalencia entre ramas.',
      },
    },
  };

  const ITEMS = [
    item('fit_schedule', 'fit', false,
      'The rotating evening or weekend schedule described for this role is workable for me for at least six months.',
      'El horario rotativo nocturno o de fin de semana descrito para este puesto es viable para mí durante al menos seis meses.'),
    item('fit_location', 'fit', false,
      'The work location and travel requirements described for this role are sustainable for me.',
      'La ubicación y los desplazamientos descritos para este puesto son sostenibles para mí.'),
    item('fit_compensation', 'fit', false,
      'The base pay, variable pay, and attendance conditions explained for this role match what I need.',
      'El salario base, la compensación variable y las condiciones de asistencia explicadas para este puesto se ajustan a lo que necesito.'),
    item('fit_workload', 'fit', false,
      'Back-to-back customer conversations are a type of work I can realistically sustain.',
      'Las conversaciones consecutivas con clientes son un tipo de trabajo que puedo sostener de manera realista.'),
    item('fit_metrics', 'fit', false,
      'Working with quality, productivity, and attendance targets fits the way I prefer to work.',
      'Trabajar con metas de calidad, productividad y asistencia se ajusta a mi forma preferida de trabajar.'),
    item('fit_schedule_reverse', 'fit', true,
      'Even if I accepted this role, I would probably need the schedule to change soon after I started.',
      'Aunque aceptara este puesto, probablemente necesitaría cambiar el horario poco después de comenzar.'),

    item('intent_six_months', 'intent', false,
      'If the job conditions remain as described, I intend to stay in this role for at least six months.',
      'Si las condiciones del puesto se mantienen como fueron descritas, tengo la intención de permanecer al menos seis meses.'),
    item('intent_training', 'intent', false,
      'I am willing to invest the effort needed to complete training and become independent in the role.',
      'Estoy dispuesto/a a invertir el esfuerzo necesario para completar la capacitación y desempeñarme de manera independiente.'),
    item('intent_search', 'intent', true,
      'I expect to continue actively searching for another job immediately after starting this one.',
      'Espero seguir buscando activamente otro empleo inmediatamente después de comenzar este puesto.'),
    item('intent_temporary', 'intent', true,
      'I mainly see this role as a temporary option until something else becomes available.',
      'Veo este puesto principalmente como una opción temporal hasta que aparezca otra oportunidad.'),
    item('intent_path', 'intent', false,
      'The experience I could gain in this role supports a work path I want to build.',
      'La experiencia que podría adquirir en este puesto apoya una trayectoria laboral que quiero desarrollar.'),
    item('intent_realistic', 'intent', false,
      'Based on what I know today, staying through the first six months feels realistic for me.',
      'Con la información que tengo hoy, permanecer durante los primeros seis meses me parece realista.'),

    item('reliability_repetition', 'reliability', false,
      'When work becomes repetitive, I continue checking the quality of what I do.',
      'Cuando el trabajo se vuelve repetitivo, sigo verificando la calidad de lo que hago.'),
    item('reliability_recovery', 'reliability', false,
      'After a difficult customer interaction or mistake, I can reset and continue working carefully.',
      'Después de una interacción difícil con un cliente o de un error, puedo recuperarme y continuar trabajando con cuidado.'),
    item('reliability_support', 'reliability', false,
      'I ask for help early when I am unsure how to complete an important task.',
      'Pido ayuda a tiempo cuando no estoy seguro/a de cómo completar una tarea importante.'),
    item('reliability_followthrough', 'reliability', false,
      'I follow through on scheduled commitments without needing repeated reminders.',
      'Cumplo los compromisos programados sin necesitar recordatorios repetidos.'),
    item('reliability_quit', 'reliability', true,
      'When a new job becomes frustrating, leaving quickly is usually better than working through the adjustment period.',
      'Cuando un trabajo nuevo se vuelve frustrante, normalmente es mejor irse pronto que atravesar el período de adaptación.'),
    item('reliability_overcommit', 'reliability', true,
      'I sometimes agree to a work commitment even when I already doubt I can meet it.',
      'A veces acepto un compromiso laboral aunque ya dude que pueda cumplirlo.'),

    item('support_expectations', 'support', false,
      'Clear written expectations during the first weeks would help me stay and perform well.',
      'Tener expectativas claras y por escrito durante las primeras semanas me ayudaría a permanecer y desempeñarme bien.'),
    item('support_coach', 'support', false,
      'Having one consistent coach during training would make it easier for me to succeed in this role.',
      'Contar con un mismo coach durante la capacitación facilitaría mi éxito en este puesto.'),
    item('support_schedule', 'support', false,
      'Receiving my schedule with reasonable notice would materially improve my ability to remain in the role.',
      'Recibir mi horario con anticipación razonable mejoraría de forma importante mi capacidad de permanecer en el puesto.'),
    item('support_feedback', 'support', false,
      'Frequent, specific feedback during the first month would help me adjust faster.',
      'Recibir retroalimentación frecuente y específica durante el primer mes me ayudaría a adaptarme más rápido.'),
    item('support_voice', 'support', false,
      'I am more likely to stay where I can raise a concern without being treated negatively.',
      'Es más probable que permanezca donde pueda expresar una preocupación sin recibir un trato negativo.'),

    branchItem('experienced_tenure', 'experienced', true,
      'In the last three years, I left one or more jobs before six months for reasons that were within my control.',
      'En los últimos tres años dejé uno o más empleos antes de cumplir seis meses por razones que estaban bajo mi control.'),
    branchItem('experienced_attendance', 'experienced', false,
      'In my recent work, I consistently met the attendance expectations that had been explained to me.',
      'En mis trabajos recientes cumplí de forma constante las expectativas de asistencia que me habían explicado.'),
    branchItem('experienced_preview', 'experienced', false,
      'Before starting my recent jobs, the day-to-day work was explained accurately.',
      'Antes de comenzar mis trabajos recientes, las tareas diarias me fueron explicadas con precisión.'),
    branchItem('experienced_notice', 'experienced', false,
      'When I chose to leave a job and it was practical, I communicated the decision responsibly.',
      'Cuando decidí dejar un empleo y fue posible, comuniqué la decisión de manera responsable.'),

    branchItem('new_completion', 'new', false,
      'When I begin a course, project, or recurring responsibility, I usually complete what I committed to do.',
      'Cuando comienzo un curso, proyecto o responsabilidad recurrente, normalmente completo lo que me comprometí a hacer.'),
    branchItem('new_schedule', 'new', false,
      'I consistently arrive or connect on time for scheduled study, volunteer, family, or team commitments.',
      'Llego o me conecto puntualmente a compromisos programados de estudio, voluntariado, familia o equipo.'),
    branchItem('new_clarify', 'new', false,
      'When requirements change, I ask questions early instead of waiting until the deadline.',
      'Cuando cambian los requisitos, hago preguntas a tiempo en lugar de esperar hasta la fecha límite.'),
    branchItem('new_six_months', 'new', false,
      'I have maintained at least one recurring responsibility for six months or longer.',
      'He mantenido al menos una responsabilidad recurrente durante seis meses o más.'),
  ];

  const CONSISTENCY_PAIRS = [
    ['fit_schedule', 'fit_schedule_reverse'],
    ['intent_six_months', 'intent_temporary'],
    ['reliability_followthrough', 'reliability_overcommit'],
  ];

  function item(id, dimension, reverse, en, es) {
    return { id, dimension, reverse, branch: 'core', text: { en, es } };
  }

  function branchItem(id, branch, reverse, en, es) {
    return { id, dimension: 'context', reverse, branch, text: { en, es } };
  }

  function applicableItems(experienceBranch) {
    return ITEMS.filter((candidate) => candidate.branch === 'core' || candidate.branch === experienceBranch);
  }

  function transformedValue(response, reverse) {
    const numeric = Number(response);
    return reverse ? 6 - numeric : numeric;
  }

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  function toHundred(value) {
    return value == null ? null : Math.round((value - 1) * 25 * 10) / 10;
  }

  function bandFor(score) {
    if (score == null) return 'incomplete';
    if (score >= 75) return 'strong_observed';
    if (score >= 55) return 'conditional';
    return 'more_evidence';
  }

  function scoreAssessment(input) {
    const experienceBranch = input.experienceBranch === 'experienced' ? 'experienced' : 'new';
    const answers = input.answers || {};
    const responseTimes = input.responseTimes || {};
    const items = applicableItems(experienceBranch);
    const missing = items.filter((candidate) => !Number.isInteger(Number(answers[candidate.id])) || Number(answers[candidate.id]) < 1 || Number(answers[candidate.id]) > 5);
    const trace = items.filter((candidate) => !missing.some((entry) => entry.id === candidate.id)).map((candidate) => {
      const raw = Number(answers[candidate.id]);
      const transformed = transformedValue(raw, candidate.reverse);
      return {
        itemId: candidate.id,
        dimension: candidate.dimension,
        branch: candidate.branch,
        rawResponse: raw,
        reverseScored: candidate.reverse,
        transformedResponse: transformed,
        scaledContribution: (transformed - 1) * 25,
        responseMs: Number(responseTimes[candidate.id] || 0),
        includedInPotentialIndex: ['fit', 'intent', 'reliability'].includes(candidate.dimension),
      };
    });

    const subscales = {};
    ['fit', 'intent', 'reliability', 'context'].forEach((dimension) => {
      const values = trace.filter((entry) => entry.dimension === dimension).map((entry) => entry.transformedResponse);
      subscales[dimension] = { score: toHundred(mean(values)), itemCount: values.length };
    });

    const scoredDimensions = ['fit', 'intent', 'reliability'].map((dimension) => subscales[dimension].score).filter((value) => value != null);
    const potentialIndex = missing.some((candidate) => ['fit', 'intent', 'reliability'].includes(candidate.dimension))
      ? null
      : Math.round(mean(scoredDimensions) * 10) / 10;

    const qualityFlags = [];
    if (missing.length) qualityFlags.push({ code: 'missing_items', severity: 'block', count: missing.length });

    const coreResponses = trace.filter((entry) => entry.includedInPotentialIndex).map((entry) => entry.rawResponse);
    if (coreResponses.length) {
      const frequencies = coreResponses.reduce((result, value) => ({ ...result, [value]: (result[value] || 0) + 1 }), {});
      const longestShare = Math.max(...Object.values(frequencies)) / coreResponses.length;
      if (longestShare >= 0.8) qualityFlags.push({ code: 'low_response_variation', severity: 'review', share: Math.round(longestShare * 100) / 100 });
    }

    const contradictions = CONSISTENCY_PAIRS.reduce((result, pair) => {
      const first = trace.find((entry) => entry.itemId === pair[0]);
      const second = trace.find((entry) => entry.itemId === pair[1]);
      if (first && second && Math.abs(first.transformedResponse - second.transformedResponse) >= 3) result.push(pair);
      return result;
    }, []);
    if (contradictions.length) qualityFlags.push({ code: 'paired_item_inconsistency', severity: 'review', pairs: contradictions });

    const totalDurationMs = Number(input.durationMs || trace.reduce((sum, entry) => sum + entry.responseMs, 0));
    if (totalDurationMs > 0 && totalDurationMs / Math.max(1, items.length) < 2500) {
      qualityFlags.push({ code: 'unusually_fast_completion', severity: 'review', averageItemMs: Math.round(totalDurationMs / items.length) });
    }

    const supportProfile = trace
      .filter((entry) => entry.dimension === 'support')
      .sort((a, b) => b.rawResponse - a.rawResponse || a.itemId.localeCompare(b.itemId))
      .map((entry) => ({ itemId: entry.itemId, importance: entry.rawResponse }));

    return {
      assessmentVersion: ASSESSMENT_VERSION,
      modelVersion: MODEL_VERSION,
      modelStatus: 'pilot_uncalibrated',
      experienceBranch,
      potentialIndex,
      potentialBand: bandFor(potentialIndex),
      subscales,
      supportProfile,
      quality: {
        status: qualityFlags.some((flag) => flag.severity === 'block') ? 'incomplete' : qualityFlags.length >= 2 ? 'review_required' : 'pilot_usable',
        flags: qualityFlags,
        completedItems: trace.length,
        expectedItems: items.length,
        durationMs: totalDurationMs,
      },
      scoringTrace: trace,
      missingItemIds: missing.map((candidate) => candidate.id),
      weights: { fit: 1 / 3, intent: 1 / 3, reliability: 1 / 3, support: 0, context: 0 },
    };
  }

  function supportLabel(itemId, locale) {
    const labels = {
      support_expectations: { en: 'Written first-week expectations', es: 'Expectativas claras por escrito' },
      support_coach: { en: 'One consistent training coach', es: 'Un mismo coach durante la capacitación' },
      support_schedule: { en: 'Predictable schedule notice', es: 'Aviso anticipado del horario' },
      support_feedback: { en: 'Frequent specific feedback', es: 'Retroalimentación frecuente y específica' },
      support_voice: { en: 'Safe way to raise concerns', es: 'Canal seguro para expresar inquietudes' },
    };
    return (labels[itemId] || { en: itemId, es: itemId })[locale === 'es' ? 'es' : 'en'];
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  global.GazelleAssessmentEngine = Object.freeze({
    ASSESSMENT_VERSION,
    MODEL_VERSION,
    RESPONSE_LABELS,
    DIMENSIONS,
    ITEMS,
    applicableItems,
    scoreAssessment,
    supportLabel,
    stableStringify,
  });
})(globalThis);
