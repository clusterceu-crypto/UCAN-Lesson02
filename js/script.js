(() => {
  'use strict';

  const Interface = {};

  Interface.copyText = async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('Clipboard copy failed');
    return true;
  };

  function sanitizeFilename(value) {
    const cleaned = String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    return cleaned || '';
  }
  Interface.sanitizeFilename = sanitizeFilename;

  function wrapCanvasText(context, text, maxWidth) {
    const value = String(text || '—').replace(/\r\n?/g, '\n');
    const paragraphs = value.split('\n');
    const lines = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) lines.push('');
      else {
        let line = '';
        words.forEach(word => {
          const candidate = line ? `${line} ${word}` : word;
          if (context.measureText(candidate).width <= maxWidth) { line = candidate; return; }
          if (line) lines.push(line);
          if (context.measureText(word).width <= maxWidth) { line = word; return; }
          let fragment = '';
          Array.from(word).forEach(character => {
            const next = fragment + character;
            if (context.measureText(next).width > maxWidth && fragment) {
              lines.push(fragment);
              fragment = character;
            } else fragment = next;
          });
          line = fragment;
        });
        if (line) lines.push(line);
      }
      if (paragraphIndex < paragraphs.length - 1) lines.push('');
    });
    return lines;
  }

  function createPdfCanvases({ title, label = 'Портфель мера', fields, data, note }) {
    const width = 1240;
    const height = 1754;
    const margin = 92;
    const maxWidth = width - margin * 2;
    const bottom = height - margin;
    const canvases = [];
    let canvas;
    let context;
    let y;

    function newPage() {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      canvases.push(canvas);
      y = margin;
    }
    function ensureSpace(required) { if (y + required > bottom) newPage(); }
    function drawText(text, options = {}) {
      const fontSize = options.fontSize || 28;
      const lineHeight = options.lineHeight || Math.round(fontSize * 1.42);
      const weight = options.weight || 400;
      const color = options.color || '#1f2a33';
      const gapAfter = options.gapAfter ?? 18;
      context.font = `${weight} ${fontSize}px Arial, "DejaVu Sans", sans-serif`;
      context.fillStyle = color;
      const lines = wrapCanvasText(context, text, options.maxWidth || maxWidth);
      for (const line of lines) {
        ensureSpace(lineHeight + gapAfter);
        if (line) context.fillText(line, margin, y);
        y += lineHeight;
      }
      y += gapAfter;
    }

    newPage();
    drawText(title, { fontSize: 42, lineHeight: 54, weight: 700, color: '#123f68', gapAfter: 10 });
    drawText(label, { fontSize: 30, lineHeight: 40, weight: 700, color: '#2d7b55', gapAfter: 34 });
    drawText('Локально створений навчальний артефакт. Дані не передавалися на сервер.', { fontSize: 22, lineHeight: 32, color: '#47545e', gapAfter: 32 });
    fields.forEach(field => {
      ensureSpace(110);
      context.strokeStyle = '#cfd9df';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(margin, y);
      context.lineTo(width - margin, y);
      context.stroke();
      y += 24;
      drawText(field.label, { fontSize: 24, lineHeight: 34, weight: 700, color: '#123f68', gapAfter: 8 });
      drawText((data[field.key] || '').trim() || '—', { fontSize: 24, lineHeight: 36, gapAfter: 28 });
    });
    if (note) {
      ensureSpace(130);
      context.strokeStyle = '#cfd9df';
      context.beginPath();
      context.moveTo(margin, y);
      context.lineTo(width - margin, y);
      context.stroke();
      y += 24;
      drawText('Примітка', { fontSize: 24, lineHeight: 34, weight: 700, color: '#123f68', gapAfter: 8 });
      drawText(note, { fontSize: 22, lineHeight: 33, color: '#47545e', gapAfter: 0 });
    }
    return canvases;
  }

  function base64ToBytes(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function buildImagePdf(canvases) {
    const encoder = new TextEncoder();
    const chunks = [];
    const offsets = [0];
    let length = 0;
    const pushBytes = bytes => { chunks.push(bytes); length += bytes.length; };
    const pushText = text => pushBytes(encoder.encode(text));
    const images = canvases.map(canvas => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      return { width: canvas.width, height: canvas.height, bytes: base64ToBytes(dataUrl.split(',')[1]) };
    });
    const objectCount = 2 + images.length * 3;
    const pageIds = images.map((_, index) => 3 + index * 3);
    pushText('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    function startObject(id) { offsets[id] = length; pushText(`${id} 0 obj\n`); }
    function endObject() { pushText('endobj\n'); }
    startObject(1); pushText('<< /Type /Catalog /Pages 2 0 R >>\n'); endObject();
    startObject(2); pushText(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>\n`); endObject();
    images.forEach((record, index) => {
      const pageId = 3 + index * 3;
      const contentId = pageId + 1;
      const imageId = pageId + 2;
      const imageName = `Im${index}`;
      const content = `q\n595 0 0 842 0 0 cm\n/${imageName} Do\nQ\n`;
      const contentBytes = encoder.encode(content);
      startObject(pageId); pushText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /${imageName} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\n`); endObject();
      startObject(contentId); pushText(`<< /Length ${contentBytes.length} >>\nstream\n`); pushBytes(contentBytes); pushText('endstream\n'); endObject();
      startObject(imageId); pushText(`<< /Type /XObject /Subtype /Image /Width ${record.width} /Height ${record.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${record.bytes.length} >>\nstream\n`); pushBytes(record.bytes); pushText('\nendstream\n'); endObject();
    });
    const xrefOffset = length;
    pushText(`xref\n0 ${objectCount + 1}\n`);
    pushText('0000000000 65535 f \n');
    for (let id = 1; id <= objectCount; id += 1) pushText(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    pushText(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  Interface.downloadPortfolioPdf = async function downloadPortfolioPdf({ button, status, title, label, filename, fields, data, note }) {
    if (!button) throw new Error('PDF button is required');
    const original = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Створення PDF…';
    if (status) status.textContent = 'Створюємо PDF локально у Вашому браузері…';
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const canvases = createPdfCanvases({ title, label, fields, data, note });
      const blob = buildImagePdf(canvases);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      if (status) status.textContent = 'PDF створено та завантажено. Дані залишилися у Вашому браузері.';
    } catch (error) {
      console.error('Portfolio PDF generation failed', error);
      if (status) status.textContent = 'Не вдалося створити PDF. Перевірте налаштування браузера та спробуйте ще раз.';
      throw error;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = original;
    }
  };

  window.UCANInterface = Object.freeze(Interface);
})();

/* Lesson 02 Gold Release runtime — Candidate B with controlled Candidate A architecture merge. */
(() => {
  'use strict';

  const TOTAL_PAGES = 10;
  const PAGE_KEY = 'ucan_l02_progress_v1';
  const FORM_KEY = 'ucan_l02_portfolio_v1';
  const TEST_KEY = 'ucan_l02_test_v2';
  const SCENARIO_KEY = 'ucan_l02_scenarios_v2';
  const MAX_PAGE_KEY = 'ucan_l02_max_page_v2';
  const COMPLETED_KEY = 'ucan_l02_completed_v2';
  const CASE_KEY = 'ucan_l02_case_notes_v1';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (error) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (error) { return false; }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); return true; } catch (error) { return false; }
    }
  };

  const pages = [...document.querySelectorAll('.lesson-page')];
  const pageLinks = [...document.querySelectorAll('[data-page-link]')];
  const prevPageButton = document.getElementById('previous-page');
  const nextPageButton = document.getElementById('next-page');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent');
  const progressBar = document.getElementById('progress-bar');
  const progressTrack = document.getElementById('progress-track');
  const pageLabel = document.getElementById('page-label');
  const navPageCount = document.getElementById('nav-page-count');
  const globalStatus = document.getElementById('global-status');
  const tocToggle = document.querySelector('.toc-toggle');
  const tocList = document.getElementById('toc-list');
  let currentPage = 1;
  let testPassed = safeStorage.get(TEST_KEY) === 'passed';
  let maxVisited = Math.min(TOTAL_PAGES, Math.max(1, Number.parseInt(safeStorage.get(MAX_PAGE_KEY) || safeStorage.get(PAGE_KEY) || '1', 10) || 1));
  let lessonCompleted = safeStorage.get(COMPLETED_KEY) === 'true';
  let pendingScenarioTarget = 7;

  const normalizePage = (value) => {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return 1;
    return Math.min(TOTAL_PAGES, Math.max(1, number));
  };

  const pageFromHash = () => {
    const match = window.location.hash.match(/^#page-(\d+)$/);
    return match ? normalizePage(match[1]) : null;
  };

  function updateTestGate() {
    const finalLink = document.querySelector('[data-requires-test="true"]');
    if (!finalLink) return;
    finalLink.setAttribute('aria-disabled', testPassed ? 'false' : 'true');
    finalLink.title = testPassed ? '' : 'Спочатку правильно виконайте підсумковий тест.';
  }

  function scenarioState() {
    const fallback = { selected: {}, completed: [] };
    const raw = safeStorage.get(SCENARIO_KEY);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return {
        selected: parsed && typeof parsed.selected === 'object' ? parsed.selected : {},
        completed: Array.isArray(parsed && parsed.completed) ? parsed.completed.map(Number).filter(Number.isFinite) : []
      };
    } catch (error) {
      safeStorage.remove(SCENARIO_KEY);
      return fallback;
    }
  }

  let storedScenarioState = scenarioState();
  const completedScenarios = new Set(storedScenarioState.completed);

  function scenarioIsComplete() {
    return completedScenarios.size === 3;
  }

  function shouldOfferScenarioCheckpoint(targetPage) {
    return currentPage === 6 && targetPage > 6 && !scenarioIsComplete();
  }

  function showScenarioCheckpoint(targetPage) {
    const panel = document.getElementById('scenario-gate');
    const text = document.getElementById('scenario-gate-text');
    if (!panel) return false;
    pendingScenarioTarget = normalizePage(targetPage);
    const remaining = 3 - completedScenarios.size;
    text.textContent = `Залишилося виконати ${remaining} ${remaining === 1 ? 'ситуацію' : 'ситуації'}. Завершіть усі три ситуації, щоб перейти далі.`;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
    const stayButton = document.getElementById('scenario-stay');
    if (stayButton) stayButton.focus({ preventScroll: true });
    return true;
  }

  function hideScenarioCheckpoint() {
    const panel = document.getElementById('scenario-gate');
    if (panel) panel.hidden = true;
  }

  function showPage(pageNumber, options = {}) {
    const requested = normalizePage(pageNumber);

    if (requested === 10 && !testPassed && options.allowLocked !== true) {
      showPage(9, { replace: true, focus: true, allowLocked: true, bypassScenarioCheckpoint: true });
      const testStatus = document.getElementById('test-status');
      if (testStatus) {
        testStatus.textContent = 'Щоб перейти до підсумку, правильно виконайте всі п’ять питань.';
        testStatus.className = 'feedback is-incorrect';
      }
      return;
    }

    if (!options.bypassScenarioCheckpoint && shouldOfferScenarioCheckpoint(requested)) {
      showScenarioCheckpoint(requested);
      return;
    }

    currentPage = requested;
    maxVisited = Math.max(maxVisited, currentPage);
    if (currentPage === TOTAL_PAGES && testPassed) {
      lessonCompleted = true;
      safeStorage.set(COMPLETED_KEY, 'true');
      document.body.classList.add('is-completed');
    }
    safeStorage.set(MAX_PAGE_KEY, String(maxVisited));
    pages.forEach((page) => page.classList.toggle('is-active', Number(page.dataset.page) === currentPage));
    pageLinks.forEach((link) => {
      const active = Number(link.dataset.pageLink) === currentPage;
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });

    const percent = lessonCompleted ? 100 : Math.round((maxVisited / TOTAL_PAGES) * 100);
    progressText.textContent = lessonCompleted ? 'Заняття завершено' : `Сторінка ${currentPage} з ${TOTAL_PAGES}`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', String(percent));
    progressTrack.setAttribute('aria-valuetext', lessonCompleted ? 'Заняття завершено, прогрес 100%' : `Сторінка ${currentPage} з ${TOTAL_PAGES}, прогрес ${percent}%`);
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === TOTAL_PAGES || (currentPage === 9 && !testPassed);
    nextPageButton.textContent = currentPage === 9 && !testPassed ? 'Спочатку виконайте тест' : currentPage === TOTAL_PAGES ? 'Заняття завершено' : 'Наступний розділ ➡️';
    if (pageLabel) { const active = pages[currentPage - 1]; pageLabel.textContent = active?.dataset.pageLabel || ''; }
    if (navPageCount) navPageCount.textContent = `${currentPage} / ${TOTAL_PAGES}`;

    safeStorage.set(PAGE_KEY, String(currentPage));
    const hash = `#page-${currentPage}`;
    if (window.location.hash !== hash) {
      if (options.replace) history.replaceState({ page: currentPage }, '', hash);
      else history.pushState({ page: currentPage }, '', hash);
    }

    if (options.focus !== false) {
      const activeHeading = document.querySelector(`#page-${currentPage} h1`);
      if (activeHeading) {
        activeHeading.setAttribute('tabindex', '-1');
        activeHeading.focus({ preventScroll: true });
        activeHeading.scrollIntoView({ block: 'start', behavior: scrollBehavior });
      }
    }
    if (tocList) tocList.classList.remove('is-open');
    if (tocToggle) tocToggle.setAttribute('aria-expanded', 'false');
  }

  pageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.dataset.requiresTest === 'true' && !testPassed) {
        showPage(9, { focus: true, bypassScenarioCheckpoint: true });
        return;
      }
      showPage(link.dataset.pageLink, { focus: true });
    });
  });

  prevPageButton.addEventListener('click', () => showPage(currentPage - 1, { focus: true, bypassScenarioCheckpoint: true }));
  nextPageButton.addEventListener('click', () => showPage(currentPage + 1, { focus: true }));
  if (tocToggle && tocList) tocToggle.addEventListener('click', () => {
    const open = tocList.classList.toggle('is-open');
    tocToggle.setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('popstate', () => showPage(pageFromHash() || 1, { replace: true, focus: false }));

  const stayButton = document.getElementById('scenario-stay');
  if (stayButton) {
    stayButton.addEventListener('click', () => {
      hideScenarioCheckpoint();
      const currentScenario = document.querySelector('.scenario.is-current legend');
      if (currentScenario) {
        currentScenario.setAttribute('tabindex', '-1');
        currentScenario.focus();
      }
    });
  }

  // Practice-oriented case notes.
  const caseFields = ['case-example', 'case-problem', 'case-principle', 'case-local-decision']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const caseTransferButton = document.getElementById('case-transfer');
  const caseTransferStatus = document.getElementById('case-transfer-status');

  function caseDataObject() {
    return Object.fromEntries(caseFields.map((field) => [field.id, field.value]));
  }

  function restoreCaseNotes() {
    const raw = safeStorage.get(CASE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      caseFields.forEach((field) => {
        if (typeof data[field.id] === 'string') field.value = data[field.id];
      });
    } catch (error) {
      safeStorage.remove(CASE_KEY);
    }
  }

  caseFields.forEach((field) => field.addEventListener('input', () => safeStorage.set(CASE_KEY, JSON.stringify(caseDataObject()))));
  caseFields.forEach((field) => field.addEventListener('change', () => safeStorage.set(CASE_KEY, JSON.stringify(caseDataObject()))));

  const transferDialog = document.getElementById('portfolio-transfer-dialog');
  const transferExisting = document.getElementById('portfolio-transfer-existing');
  const transferIncoming = document.getElementById('portfolio-transfer-incoming');
  const transferMergeButton = document.getElementById('portfolio-transfer-merge');
  const transferReplaceButton = document.getElementById('portfolio-transfer-replace');
  const transferCancelButtons = [document.getElementById('portfolio-transfer-cancel'), document.getElementById('portfolio-transfer-cancel-top')].filter(Boolean);
  let pendingCaseTransfer = null;

  function appendManagementSignal(decision, example) {
    const managementSignal = document.getElementById('management-signal');
    if (!decision || !managementSignal) return;
    const prefix = example ? `Орієнтир: ${example}. ` : '';
    const addition = `${prefix}${decision}`;
    const existing = managementSignal.value.trim();
    if (!existing) managementSignal.value = addition;
    else if (!existing.includes(addition)) managementSignal.value = `${existing}
${addition}`;
  }

  function finishCaseTransfer({ principle, decision, example, targetField = null, strategy = 'set' }) {
    if (principle && targetField) {
      const existing = targetField.value.trim();
      if (strategy === 'merge' && existing && !existing.includes(principle)) targetField.value = `${existing}; ${principle}`;
      else if (strategy === 'replace' || !existing) targetField.value = principle;
    }
    appendManagementSignal(decision, example);
    savePortfolioSilently();
    if (!portfolioSummary.hidden) renderPortfolioSummary();
    caseTransferStatus.textContent = 'Підказки перенесено до практичної картки без втрати вже введених відповідей.';
    caseTransferStatus.className = 'feedback is-correct';
    pendingCaseTransfer = null;
    if (transferDialog?.open) transferDialog.close();
    showPage(8, { focus: true, bypassScenarioCheckpoint: true });
  }

  if (caseTransferButton) {
    caseTransferButton.addEventListener('click', () => {
      const principle = document.getElementById('case-principle').value.trim();
      const decision = document.getElementById('case-local-decision').value.trim();
      const example = document.getElementById('case-example').value.trim();
      if (!principle && !decision) {
        caseTransferStatus.textContent = 'Запишіть хоча б принцип або рішення, яке варто перевірити.';
        caseTransferStatus.className = 'feedback is-incorrect';
        return;
      }
      const principleFields = [document.getElementById('principle-1'), document.getElementById('principle-2'), document.getElementById('principle-3')].filter(Boolean);
      const emptyField = principleFields.find((field) => !field.value.trim());
      if (!principle || emptyField) {
        finishCaseTransfer({ principle, decision, example, targetField: emptyField || null });
        return;
      }
      pendingCaseTransfer = { principle, decision, example, targetField: principleFields[0] };
      transferExisting.textContent = principleFields[0].value.trim();
      transferIncoming.textContent = principle;
      transferDialog.showModal();
      transferMergeButton.focus();
    });
  }
  transferMergeButton?.addEventListener('click', () => pendingCaseTransfer && finishCaseTransfer({ ...pendingCaseTransfer, strategy: 'merge' }));
  transferReplaceButton?.addEventListener('click', () => pendingCaseTransfer && finishCaseTransfer({ ...pendingCaseTransfer, strategy: 'replace' }));
  transferCancelButtons.forEach((button) => button.addEventListener('click', () => transferDialog.close()));
  transferDialog?.addEventListener('close', () => caseTransferButton?.focus());
  transferDialog?.addEventListener('click', (event) => { if (event.target === transferDialog) transferDialog.close(); });
  restoreCaseNotes();

  // Interactive concept matching.
  const scenarios = [...document.querySelectorAll('.scenario')];
  const scenarioProgress = document.getElementById('scenario-progress');
  const scenarioCompletion = document.getElementById('scenario-completion');
  const scenarioFeedback = document.getElementById('scenario-feedback');
  const scenarioPrev = document.getElementById('scenario-prev');
  const scenarioNext = document.getElementById('scenario-next');
  const scenarioCheck = document.getElementById('scenario-check');
  let scenarioIndex = 0;
  const scenarioAnswers = ['B', 'C', 'D'];
  const scenarioMessages = [
    'Правильно. Основна концепція — природоорієнтовані рішення. Кліматична стійкість також підтримує логіку цього рішення.',
    'Правильно. Це циркулярна економіка: рішення змінює ресурсну та життєциклову логіку закупівель.',
    'Правильно. Це візія громади: рішення задає бажаний напрям і критерії для майбутніх дій.'
  ];

  function persistScenarioState() {
    const selected = {};
    scenarios.forEach((scenario, index) => {
      const checked = scenario.querySelector(`input[name="scenario-${index + 1}"]:checked`);
      if (checked) selected[index + 1] = checked.value;
    });
    safeStorage.set(SCENARIO_KEY, JSON.stringify({ selected, completed: [...completedScenarios] }));
  }

  function updateScenarioCompletion() {
    scenarioCompletion.textContent = `Виконано ${completedScenarios.size} із ${scenarios.length}`;
    if (scenarioIsComplete()) {
      hideScenarioCheckpoint();
    }
  }

  function renderScenario() {
    scenarios.forEach((scenario, index) => scenario.classList.toggle('is-current', index === scenarioIndex));
    scenarioProgress.textContent = `Ситуація ${scenarioIndex + 1} з ${scenarios.length}`;
    scenarioPrev.disabled = scenarioIndex === 0;
    scenarioNext.disabled = scenarioIndex === scenarios.length - 1;
    if (completedScenarios.has(scenarioIndex + 1)) {
      scenarioFeedback.textContent = scenarioMessages[scenarioIndex];
      scenarioFeedback.className = 'feedback is-correct';
    } else {
      scenarioFeedback.textContent = '';
      scenarioFeedback.className = 'feedback';
    }
    updateScenarioCompletion();
  }

  scenarios.forEach((scenario, index) => {
    const selectedValue = storedScenarioState.selected[index + 1];
    if (selectedValue) {
      const input = scenario.querySelector(`input[value="${selectedValue}"]`);
      if (input) input.checked = true;
    }
    scenario.querySelectorAll('input[type="radio"]').forEach((input) => input.addEventListener('change', persistScenarioState));
  });

  scenarioPrev.addEventListener('click', () => { scenarioIndex = Math.max(0, scenarioIndex - 1); renderScenario(); });
  scenarioNext.addEventListener('click', () => { scenarioIndex = Math.min(scenarios.length - 1, scenarioIndex + 1); renderScenario(); });
  scenarioCheck.addEventListener('click', () => {
    const selected = document.querySelector(`input[name="scenario-${scenarioIndex + 1}"]:checked`);
    if (!selected) {
      scenarioFeedback.textContent = 'Оберіть одну концепцію, а потім натисніть «Перевірити відповідь».';
      scenarioFeedback.className = 'feedback is-incorrect';
      return;
    }
    const correct = selected.value === scenarioAnswers[scenarioIndex];
    if (correct) completedScenarios.add(scenarioIndex + 1);
    else completedScenarios.delete(scenarioIndex + 1);
    persistScenarioState();
    updateScenarioCompletion();
    scenarioFeedback.textContent = correct ? scenarioMessages[scenarioIndex] : 'Ця відповідь звучить правдоподібно, але не є основною концепцією для ситуації. Перегляньте управлінську логіку й спробуйте ще раз.';
    scenarioFeedback.className = `feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
    if (scenarioIsComplete()) {
      scenarioFeedback.textContent += ' Інтерактив завершено. Можна переходити далі.';
    }
  });
  renderScenario();

  // Portfolio form and preview.
  const portfolioForm = document.getElementById('portfolio-form');
  const portfolioStatus = document.getElementById('portfolio-status');
  const portfolioSummary = document.getElementById('portfolio-summary');
  const portfolioSummaryList = document.getElementById('portfolio-summary-list');
  const portfolioDate = document.getElementById('portfolio-date');
  const printPortfolioButton = document.getElementById('print-portfolio');
  const summaryPrintButton = document.getElementById('summary-print-portfolio');
  const editPortfolioButton = document.getElementById('edit-portfolio');
  const clearPortfolioButton = document.getElementById('clear-portfolio');
  const aiAssistantBlock = document.getElementById('ai-assistant-block');
  const aiPromptText = document.getElementById('ai-prompt-text');
  const copyAiPromptButton = document.getElementById('copy-ai-prompt');
  const aiPromptStatus = document.getElementById('ai-prompt-status');
  const portfolioFields = [...portfolioForm.querySelectorAll('input[type="text"], textarea')];

  const labels = {
    communityName: 'Назва громади',
    climateChallenge: 'Головний кліматичний виклик із попереднього заняття',
    communityVision: 'Якою громадою ми хочемо стати?',
    resilienceRole: 'Що означає кліматична стійкість для цієї візії?',
    nbsRole: 'Яку роль можуть відіграти природоорієнтовані рішення?',
    resourceLoss: 'Яку ресурсну втрату має зменшити циркулярна економіка?',
    principles: 'Які 3 принципи мають пройти через майбутні рішення?',
    managementSignal: 'Який перший управлінський сигнал можна дати команді?'
  };

  function formDataObject() {
    return Object.fromEntries(portfolioFields.map((field) => [field.name, field.value]));
  }

  function formHasContent() {
    return portfolioFields.some((field) => field.value.trim());
  }

  function savePortfolioSilently() {
    safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
  }

  function savePortfolio() {
    const saved = safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
    portfolioStatus.textContent = saved ? 'Відповіді збережено у цьому браузері.' : 'Відповіді залишаються у формі, але браузер не дозволив локальне збереження.';
    portfolioStatus.className = saved ? 'feedback is-correct' : 'feedback is-incorrect';
  }

  function restorePortfolio() {
    const raw = safeStorage.get(FORM_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      portfolioFields.forEach((field) => {
        if (typeof data[field.name] === 'string') field.value = data[field.name];
      });
    } catch (error) {
      safeStorage.remove(FORM_KEY);
    }
  }

  function buildAiPrompt(mode = 'facts') {
    const data = formDataObject();
    const principles = [data.principle1, data.principle2, data.principle3].filter((value) => value && value.trim()).join('; ') || '[не заповнено]';
    const caseNotes = caseDataObject();
    const contracts = {
      facts: {
        title: 'РЕЖИМ: ПЕРЕВІРКА ФАКТІВ І ПРИПУЩЕНЬ',
        task: 'Проаналізуйте тільки наданий текст. Не переписуйте картку і не додавайте нових фактів.',
        output: `Відповідь подайте у трьох блоках:
1. «Твердження, що прямо містяться у картці».
2. «Припущення або нечіткі твердження».
3. «Що потребує даних або перевірки». Якщо таких пунктів немає, напишіть «Не виявлено».`
      },
      questions: {
        title: 'РЕЖИМ: УТОЧНЮВАЛЬНІ ПИТАННЯ',
        task: 'Поставте від одного до трьох коротких уточнювальних запитань, які допоможуть автору самостійно покращити картку. Не давайте готової відповіді й не переписуйте текст.',
        output: 'Відповідь подайте лише як нумерований список запитань. Не додавайте вступу, оцінки або нової версії картки.'
      },
      structure: {
        title: 'РЕЖИМ: ПОВНОТА ТА СЛАБКІ МІСЦЯ',
        task: 'Перевірте логічні зв’язки між викликом, бажаним станом, стійкістю, NBS, циркулярністю, трьома принципами та першим управлінським сигналом. Не переписуйте картку.',
        output: `Відповідь подайте у трьох блоках:
1. «Сильні логічні зв’язки».
2. «Прогалини або суперечності».
3. «Кроки для самостійного уточнення» — до трьох коротких дій.`
      }
    };
    const contract = contracts[mode] || contracts.facts;
    return `${contract.title}

ЗАВДАННЯ
${contract.task}

ФОРМАТ ВІДПОВІДІ
${contract.output}

МЕЖІ БЕЗПЕКИ
- Працюйте лише з інформацією нижче.
- Не вигадуйте показників, проєктів, строків, бюджетів або характеристик громади.
- Пишіть українською, доброзичливо, стримано й професійно.
- Не використовуйте надмірної похвали та не ухвалюйте рішення замість міського голови або команди.

КАРТКА УЧАСНИКА
Назва громади:
${data.communityName || '[не заповнено]'}

Головний кліматичний виклик:
${data.climateChallenge || '[не заповнено]'}

Бажаний стан громади:
${data.communityVision || '[не заповнено]'}

Кліматична стійкість у цій візії:
${data.resilienceRole || '[не заповнено]'}

Роль природоорієнтованих рішень:
${data.nbsRole || '[не заповнено]'}

Ресурсна втрата, яку має зменшити циркулярна економіка:
${data.resourceLoss || '[не заповнено]'}

Три принципи майбутніх рішень:
${principles}

Перший управлінський сигнал:
${data.managementSignal || '[не заповнено]'}

ОРІЄНТИР ІЗ КЕЙСУ
Місто або приклад:
${caseNotes['case-example'] || '[не обрано]'}

Принцип із кейсу:
${caseNotes['case-principle'] || '[не заповнено]'}`;
  }

  function renderPortfolioSummary() {
    const data = formDataObject();
    const values = {
      communityName: data.communityName,
      climateChallenge: data.climateChallenge,
      communityVision: data.communityVision,
      resilienceRole: data.resilienceRole,
      nbsRole: data.nbsRole,
      resourceLoss: data.resourceLoss,
      principles: [data.principle1, data.principle2, data.principle3].filter(Boolean).join('\n'),
      managementSignal: data.managementSignal
    };
    portfolioSummaryList.innerHTML = '';
    Object.entries(labels).forEach(([key, label]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = values[key] || '—';
      portfolioSummaryList.append(dt, dd);
    });
    portfolioDate.textContent = new Date().toLocaleDateString('uk-UA');
    portfolioSummary.hidden = false;
    printPortfolioButton.disabled = false;
    aiPromptText.textContent = currentAiPrompt();
  }

  portfolioFields.forEach((field) => field.addEventListener('input', () => {
    savePortfolioSilently();
    aiPromptText.textContent = currentAiPrompt();
    if (!portfolioSummary.hidden) renderPortfolioSummary();
  }));

  caseFields.forEach((field) => {
    field.addEventListener('input', () => { aiPromptText.textContent = currentAiPrompt(); });
    field.addEventListener('change', () => { aiPromptText.textContent = currentAiPrompt(); });
  });

  portfolioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    savePortfolio();
    renderPortfolioSummary();
    portfolioSummary.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  });

  async function printPortfolio(event) {
    const button = event && event.currentTarget ? event.currentTarget : printPortfolioButton;
    renderPortfolioSummary();
    const data = formDataObject();
    const community = window.UCANInterface.sanitizeFilename(data.communityName);
    const pdfData = {
      communityName: data.communityName,
      climateChallenge: data.climateChallenge,
      communityVision: data.communityVision,
      resilienceRole: data.resilienceRole,
      nbsRole: data.nbsRole,
      resourceLoss: data.resourceLoss,
      principles: [data.principle1, data.principle2, data.principle3].filter(Boolean).join('\n'),
      managementSignal: data.managementSignal
    };
    await window.UCANInterface.downloadPortfolioPdf({
      button,
      status: portfolioStatus,
      title: 'Картка кліматично нейтральної візії громади',
      label: 'Портфель мера',
      filename: community ? `UCAN_Картка_кліматично_нейтральної_візії_${community}.pdf` : 'UCAN_Картка_кліматично_нейтральної_візії.pdf',
      fields: Object.entries(labels).map(([key, label]) => ({ key, label })),
      data: pdfData,
      note: 'Чернетка створена учасником. Перевірте зміст разом із командою громади.'
    });
  }

  printPortfolioButton.addEventListener('click', printPortfolio);
  if (summaryPrintButton) summaryPrintButton.addEventListener('click', printPortfolio);
  editPortfolioButton.addEventListener('click', () => {
    portfolioForm.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    const firstField = portfolioForm.querySelector('input, textarea');
    if (firstField) firstField.focus({ preventScroll: true });
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('print-portfolio'));

  const currentAiPrompt = () => buildAiPrompt(document.querySelector('input[name="l02-ai-mode"]:checked')?.value || 'facts');
  document.querySelectorAll('input[name="l02-ai-mode"]').forEach(input => input.addEventListener('change', () => { aiPromptText.textContent = currentAiPrompt(); aiPromptStatus.textContent = 'Режим змінено. Запит оновлено.'; input.focus(); }));

  copyAiPromptButton.addEventListener('click', async () => {
    const prompt = currentAiPrompt();
    aiPromptText.textContent = prompt;
    try {
      await window.UCANInterface.copyText(prompt);
      aiPromptStatus.textContent = 'Скопійовано';
      const originalLabel = copyAiPromptButton.textContent;
      copyAiPromptButton.textContent = 'Скопійовано';
      window.setTimeout(() => { copyAiPromptButton.textContent = originalLabel; }, 1600);
      aiPromptStatus.className = 'feedback is-correct';
    } catch (error) {
      aiPromptStatus.textContent = 'Автоматичне копіювання недоступне. Відкрийте попередній перегляд і скопіюйте текст вручну.';
      aiPromptStatus.className = 'feedback is-incorrect';
    }
  });


  const previewAiPromptButton = document.getElementById('preview-ai-prompt');
  const aiPromptDialog = document.getElementById('ai-prompt-dialog');
  const aiPromptDialogContent = document.getElementById('ai-prompt-dialog-content');
  const aiDialogStatus = document.getElementById('ai-dialog-status');
  const closeAiPromptDialogButton = document.getElementById('close-ai-prompt-dialog');
  const copyAiPromptDialogButton = document.getElementById('copy-ai-prompt-dialog');

  previewAiPromptButton?.addEventListener('click', () => {
    aiPromptDialogContent.textContent = currentAiPrompt();
    aiDialogStatus.textContent = '';
    aiPromptDialog.showModal();
    aiPromptDialogContent.focus();
  });
  closeAiPromptDialogButton?.addEventListener('click', () => aiPromptDialog.close());
  aiPromptDialog?.addEventListener('close', () => previewAiPromptButton?.focus());
  aiPromptDialog?.addEventListener('click', (event) => { if (event.target === aiPromptDialog) aiPromptDialog.close(); });
  copyAiPromptDialogButton?.addEventListener('click', async () => {
    try {
      await window.UCANInterface.copyText(currentAiPrompt());
      aiDialogStatus.textContent = 'Скопійовано';
      const originalLabel = copyAiPromptDialogButton.textContent;
      copyAiPromptDialogButton.textContent = 'Скопійовано';
      window.setTimeout(() => { copyAiPromptDialogButton.textContent = originalLabel; }, 1600);
    } catch (error) {
      aiDialogStatus.textContent = 'Автоматичне копіювання недоступне. Виділіть текст і скопіюйте його вручну.';
    }
  });

  const imageLightbox = document.getElementById('image-lightbox');
  const imageLightboxImage = document.getElementById('image-lightbox-image');
  const imageLightboxCaption = document.getElementById('image-lightbox-caption');
  const closeImageLightboxButton = document.getElementById('close-image-lightbox');
  let imageLightboxInvoker = null;
  document.querySelectorAll('.image-zoom-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const sourceImage = trigger.querySelector('img');
      imageLightboxInvoker = trigger;
      imageLightboxImage.src = trigger.dataset.imageSrc || sourceImage?.src || '';
      imageLightboxImage.alt = sourceImage?.alt || '';
      imageLightboxCaption.textContent = trigger.dataset.imageCaption || sourceImage?.alt || '';
      imageLightbox.showModal();
      closeImageLightboxButton.focus();
    });
  });
  closeImageLightboxButton?.addEventListener('click', () => imageLightbox.close());
  imageLightbox?.addEventListener('click', (event) => { if (event.target === imageLightbox) imageLightbox.close(); });
  imageLightbox?.addEventListener('close', () => imageLightboxInvoker?.focus());



  clearPortfolioButton.addEventListener('click', () => {
    const confirmed = window.confirm('Очистити всі поля Картки кліматично нейтральної візії громади?');
    if (!confirmed) return;
    portfolioForm.reset();
    safeStorage.remove(FORM_KEY);
    portfolioSummary.hidden = true;
    printPortfolioButton.disabled = true;
    aiPromptText.textContent = currentAiPrompt();
    portfolioStatus.textContent = 'Форму очищено.';
    portfolioStatus.className = 'feedback';
  });

  restorePortfolio();
  aiPromptText.textContent = currentAiPrompt();
  if (formHasContent()) renderPortfolioSummary();

  // Final test — Assessment Correction Addendum v1.0.
  const finalTest = document.getElementById('final-test');
  const testStatus = document.getElementById('test-status');
  const correctAnswers = { q1: 'A', q2: 'D', q3: 'B', q4: 'C', q5: 'A' };
  const explanations = {
    q1: 'Стійкість означає підтримувати ключові послуги під час ризику, адаптуватися й відновлюватися, а не лише реагувати після події.',
    q2: 'NBS мають управлінську цінність, коли природні процеси працюють разом з інженерією, доглядом і потребами людей.',
    q3: 'Циркулярна логіка враховує строк служби, ремонт, повторне використання та майбутні витрати ще до закупівлі або відновлення.',
    q4: 'Візія задає бажаний стан і принципи вибору, тому допомагає погоджувати рішення різних секторів.',
    q5: 'Спочатку потрібно назвати ризик, користь для людей і відповідальність за догляд; лише потім обирати форму рішення.'
  };

  finalTest.addEventListener('submit', (event) => {
    event.preventDefault();
    let score = 0;
    let answered = 0;
    Object.entries(correctAnswers).forEach(([name, answer]) => {
      const selected = finalTest.querySelector(`input[name="${name}"]:checked`);
      const feedback = finalTest.querySelector(`[data-feedback-for="${name}"]`);
      if (selected) answered += 1;
      const correct = selected && selected.value === answer;
      if (correct) score += 1;
      feedback.textContent = selected ? `${correct ? 'Правильно.' : 'Спробуйте ще раз.'} ${explanations[name]}` : 'Оберіть одну відповідь.';
      feedback.className = `question-feedback ${correct ? 'correct' : 'incorrect'}`;
    });

    if (answered < 5) {
      testStatus.textContent = 'Дайте відповідь на всі п’ять питань.';
      testStatus.className = 'feedback is-incorrect';
      return;
    }
    if (score === 5) {
      testPassed = true;
      safeStorage.set(TEST_KEY, 'passed');
      testStatus.textContent = 'Усі відповіді правильні. Можна перейти до підсумку заняття.';
      testStatus.className = 'feedback is-correct';
      nextPageButton.disabled = false;
      nextPageButton.textContent = 'Далі';
      updateTestGate();
    } else {
      testStatus.textContent = `Правильних відповідей: ${score} з 5. Перегляньте пояснення і спробуйте ще раз.`;
      testStatus.className = 'feedback is-incorrect';
    }
  });


  const resetProgressButton = document.getElementById('reset-progress-top');
  if (resetProgressButton) {
    resetProgressButton.addEventListener('click', () => {
      const confirmed = window.confirm('Скинути прогрес, інтерактивні ситуації та підсумковий тест? Практична картка залишиться збереженою.');
      if (!confirmed) return;
      [PAGE_KEY, MAX_PAGE_KEY, COMPLETED_KEY, TEST_KEY, SCENARIO_KEY].forEach(key => safeStorage.remove(key));
      testPassed = false;
      maxVisited = 1;
      lessonCompleted = false;
      document.body.classList.remove('is-completed');
      completedScenarios.clear();
      scenarios.forEach(scenario => scenario.querySelectorAll('input').forEach(input => { input.checked = false; }));
      finalTest.reset();
      document.querySelectorAll('.question-feedback, #test-status').forEach(el => { el.textContent = ''; el.className = el.id === 'test-status' ? 'feedback' : 'question-feedback'; });
      if (globalStatus) globalStatus.textContent = 'Навчальний прогрес скинуто. Практична картка збережена.';
      updateTestGate();
      renderScenario();
      showPage(1, { replace: true, focus: true, allowLocked: true, bypassScenarioCheckpoint: true });
    });
  }

  updateTestGate();
  const restoredPage = pageFromHash() || normalizePage(safeStorage.get(PAGE_KEY) || 1);
  const initialPage = restoredPage > 6 && !scenarioIsComplete() ? 6 : restoredPage;
  if (restoredPage > 6 && initialPage === 6 && globalStatus) globalStatus.textContent = 'Завершіть інтерактивні ситуації, щоб продовжити заняття.';
  if (lessonCompleted) document.body.classList.add('is-completed');
  showPage(initialPage, { replace: true, focus: false, allowLocked: testPassed, bypassScenarioCheckpoint: true });
})();
