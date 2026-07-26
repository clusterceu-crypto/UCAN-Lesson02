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
    const paragraphs = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
    const lines = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (!paragraph.trim()) {
        lines.push('');
      } else {
        const words = paragraph.trim().split(/\s+/);
        let line = '';
        words.forEach(word => {
          const candidate = line ? `${line} ${word}` : word;
          if (context.measureText(candidate).width <= maxWidth) {
            line = candidate;
            return;
          }
          if (line) lines.push(line);
          if (context.measureText(word).width <= maxWidth) {
            line = word;
            return;
          }
          let fragment = '';
          Array.from(word).forEach(character => {
            const next = fragment + character;
            if (context.measureText(next).width > maxWidth && fragment) {
              lines.push(fragment);
              fragment = character;
            } else {
              fragment = next;
            }
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
      if (!context) throw new Error('Canvas 2D context is unavailable');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      canvases.push(canvas);
      y = margin;
    }

    function ensureSpace(required) {
      if (y + required > bottom) newPage();
    }

    function drawText(text, options = {}) {
      const fontSize = options.fontSize || 28;
      const lineHeight = options.lineHeight || Math.round(fontSize * 1.42);
      const weight = options.weight || 400;
      const color = options.color || '#1f2a33';
      const gapAfter = options.gapAfter ?? 18;
      const font = `${weight} ${fontSize}px Arial, "DejaVu Sans", sans-serif`;
      context.font = font;
      context.fillStyle = color;
      const lines = wrapCanvasText(context, text, options.maxWidth || maxWidth);
      for (const line of lines) {
        ensureSpace(lineHeight + gapAfter);
        context.font = font;
        context.fillStyle = color;
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
    button.textContent = 'Створюємо PDF…';
    if (status) status.textContent = 'Створюємо PDF локально…';
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
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      if (status) status.textContent = 'PDF створено та завантажено.';
    } catch (error) {
      console.error('Portfolio PDF generation failed', error);
      if (status) status.textContent = 'Не вдалося створити PDF.\nСпробуйте ще раз у сучасному браузері.';
      throw error;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = original;
    }
  };

  window.UCANInterface = Object.freeze(Interface);
})();

/* UCAN Lesson 02 Consolidated Corrective Release v2.5. */
(() => {
  'use strict';

  const TOTAL_PAGES = 10;
  const PAGE_KEY = 'ucan_l02_progress_v1';
  const FORM_KEY = 'ucan_l02_portfolio_v1';
  const TEST_KEY = 'ucan_l02_test_v2';
  const SCENARIO_KEY = 'ucan_l02_scenarios_v2';
  const MAX_PAGE_KEY = 'ucan_l02_max_page_v2';
  const COMPLETED_KEY = 'ucan_l02_completed_v2';
  const CASE_KEY_V1 = 'ucan_l02_case_notes_v1';
  const CASE_KEY = 'ucan_l02_case_notes_v2';
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
    },
    keys() {
      try {
        return Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index)).filter(Boolean);
      } catch (error) {
        return [];
      }
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

    if (requested > 5 && !validateOtherCaseSelection({ focus: true })) return;

    if (requested > 8 && !validatePortfolioRequired({ focus: true, announce: true })) return;

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

  // Practice-oriented multi-case notes.
  const CASE_VERSION = 2;
  const OTHER_CASE_ID = 'other';
  const OTHER_CASE_HIDDEN_ID = 'other-hidden';
  const CASE_CATALOG = Object.freeze([
    { id: 'lviv', title: 'Львів — системна візія громади' },
    { id: 'rotterdam', title: 'Роттердам — багатофункціональна водна площа' },
    { id: 'amsterdam', title: 'Амстердам — циркулярність у міських рішеннях' },
    { id: 'leuven', title: 'Левен — від візії до дорожньої карти' }
  ]);
  const CASE_BY_ID = new Map(CASE_CATALOG.map((item) => [item.id, item]));
  const CASE_ID_BY_TITLE = new Map(CASE_CATALOG.map((item) => [item.title, item.id]));
  const caseSelectionInputs = [...document.querySelectorAll('[data-case-select]')];
  const selectedCaseNotes = document.getElementById('selected-case-notes');
  const caseSelectionStatus = document.getElementById('case-selection-status');
  const caseCommunityName = document.getElementById('case-community-name');
  const caseTransferButton = document.getElementById('case-transfer');
  const caseTransferStatus = document.getElementById('case-transfer-status');
  let caseState = { version: CASE_VERSION, records: [] };

  function cleanCaseRecord(record) {
    const recordId = String(record?.id || '');
    if (recordId === OTHER_CASE_ID || recordId === OTHER_CASE_HIDDEN_ID) {
      return {
        id: recordId,
        title: typeof record.title === 'string' ? record.title : '',
        problem: typeof record.problem === 'string' ? record.problem : '',
        principle: typeof record.principle === 'string' ? record.principle : '',
        localCheck: typeof record.localCheck === 'string' ? record.localCheck : ''
      };
    }
    const catalogItem = CASE_BY_ID.get(recordId);
    if (!catalogItem) return null;
    return {
      id: catalogItem.id,
      title: catalogItem.title,
      problem: typeof record.problem === 'string' ? record.problem : '',
      principle: typeof record.principle === 'string' ? record.principle : '',
      localCheck: typeof record.localCheck === 'string' ? record.localCheck : ''
    };
  }

  function saveCaseState() {
    const payload = {
      version: CASE_VERSION,
      records: caseState.records.map(cleanCaseRecord).filter(Boolean),
      updatedAt: new Date().toISOString()
    };
    caseState.version = CASE_VERSION;
    caseState.updatedAt = payload.updatedAt;
    return safeStorage.set(CASE_KEY, JSON.stringify(payload));
  }

  function migrateLegacyCaseNotes() {
    const raw = safeStorage.get(CASE_KEY_V1);
    if (!raw) return [];
    try {
      const legacy = JSON.parse(raw);
      const title = typeof legacy['case-example'] === 'string' ? legacy['case-example'].trim() : '';
      const id = CASE_ID_BY_TITLE.get(title);
      const problem = typeof legacy['case-problem'] === 'string' ? legacy['case-problem'] : '';
      const principle = typeof legacy['case-principle'] === 'string' ? legacy['case-principle'] : '';
      const localCheck = typeof legacy['case-local-decision'] === 'string' ? legacy['case-local-decision'] : '';
      if (!id || ![title, problem, principle, localCheck].some((value) => String(value).trim())) return [];
      const migrated = [{ id, title: CASE_BY_ID.get(id).title, problem, principle, localCheck }];
      const saved = safeStorage.set(CASE_KEY, JSON.stringify({ version: CASE_VERSION, records: migrated, migratedFrom: CASE_KEY_V1, updatedAt: new Date().toISOString() }));
      if (saved && caseSelectionStatus) {
        caseSelectionStatus.textContent = 'Попередню нотатку з кейсу перенесено до нового формату без видалення вихідних даних.';
        caseSelectionStatus.className = 'feedback is-correct';
      }
      return saved ? migrated : [];
    } catch (error) {
      return [];
    }
  }

  function restoreCaseState() {
    const raw = safeStorage.get(CASE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const records = Array.isArray(parsed?.records) ? parsed.records.map(cleanCaseRecord).filter(Boolean) : [];
        const unique = [];
        const seen = new Set();
        records.forEach((record) => {
          const uniqueId = record.id === OTHER_CASE_HIDDEN_ID ? OTHER_CASE_ID : record.id;
          if (!seen.has(uniqueId)) { seen.add(uniqueId); unique.push(record); }
        });
        caseState = { version: CASE_VERSION, records: unique };
        return;
      } catch (error) {
        // Keep the invalid source untouched and fall back to recoverable legacy data.
      }
    }
    caseState = { version: CASE_VERSION, records: migrateLegacyCaseNotes() };
  }

  function caseRecords() {
    return caseState.records
      .filter((record) => record.id !== OTHER_CASE_HIDDEN_ID)
      .map((record) => ({ ...record }));
  }

  function storedOtherCaseRecord() {
    return caseState.records.find((record) => record.id === OTHER_CASE_ID || record.id === OTHER_CASE_HIDDEN_ID) || null;
  }

  function sourceRecordTitleMissing(record) {
    return !record || !record.title || !record.title.trim();
  }

  function validateOtherCaseSelection({ focus = false } = {}) {
    const record = storedOtherCaseRecord();
    if (!record || record.id !== OTHER_CASE_ID || record.title.trim()) {
      const field = document.getElementById('case-other-title');
      if (field) {
        field.removeAttribute('aria-invalid');
        field.setCustomValidity('');
      }
      return true;
    }
    const field = document.getElementById('case-other-title');
    if (field) {
      field.setCustomValidity('Вкажіть назву власного прикладу.');
      field.setAttribute('aria-invalid', 'true');
      if (focus) {
        field.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
        if (typeof field.reportValidity === 'function') field.reportValidity();
      }
    }
    if (caseSelectionStatus) {
      caseSelectionStatus.textContent = 'Вкажіть назву власного прикладу або зніміть позначку «Інше».';
      caseSelectionStatus.className = 'feedback is-incorrect';
    }
    return false;
  }

  function caseRecordsForOutput() {
    return caseRecords().filter((record) => {
      if (record.id === OTHER_CASE_ID && !record.title.trim()) return false;
      return [record.problem, record.principle, record.localCheck].some((value) => value.trim());
    });
  }

  function caseRecordText(records = caseRecordsForOutput()) {
    if (!records.length) return 'Висновки з кейсів не додано.';
    const communityName = document.getElementById('community-name')?.value.trim();
    const community = communityName ? `громаді «${communityName}»` : 'своїй громаді';
    return records.map((record, index) => `${index + 1}. ${record.title}
- ${record.id === OTHER_CASE_ID ? 'Що вирішував приклад' : 'Що вирішувало місто'}: ${record.problem.trim() || 'Не надано'}
- Корисний принцип: ${record.principle.trim() || 'Не надано'}
- Що варто перевірити у ${community}: ${record.localCheck.trim() || 'Не надано'}`).join('\n\n');
  }

  function updateCaseCommunityName() {
    const value = document.getElementById('community-name')?.value.trim();
    if (caseCommunityName) caseCommunityName.textContent = value || 'Вашої громади';
    document.querySelectorAll('[data-other-case-community-label]').forEach((label) => {
      label.textContent = value ? `Що варто перевірити у громаді «${value}»?` : 'Що варто перевірити у Вашій громаді?';
    });
  }

  function refreshCaseDependentOutputs() {
    const summary = document.getElementById('portfolio-summary');
    if (summary && !summary.hidden) renderPortfolioSummary();
  }

  function removeCaseRecord(id, checkbox) {
    const record = caseState.records.find((item) => item.id === id);
    const hasNotes = record && [record.problem, record.principle, record.localCheck].some((value) => value.trim());
    if (hasNotes && !window.confirm(`Видалити збережені нотатки для кейсу «${record.title}»?`)) {
      checkbox.checked = true;
      return;
    }
    caseState.records = caseState.records.filter((item) => item.id !== id);
    saveCaseState();
    renderSelectedCaseNotes();
    refreshCaseDependentOutputs();
  }

  function renderSelectedCaseNotes() {
    const activeRecords = caseRecords();
    caseSelectionInputs.forEach((input) => { input.checked = activeRecords.some((record) => record.id === input.value); });
    if (!selectedCaseNotes) return;
    selectedCaseNotes.innerHTML = '';
    if (!activeRecords.length) {
      const empty = document.createElement('p');
      empty.className = 'field-hint';
      empty.textContent = 'Оберіть щонайменше один приклад, щоб додати окремі нотатки.';
      selectedCaseNotes.appendChild(empty);
      return;
    }

    activeRecords.forEach((record, index) => {
      const sourceRecord = caseState.records.find((item) => item.id === record.id);
      if (!sourceRecord) return;
      const isOtherCase = sourceRecord.id === OTHER_CASE_ID;
      const article = document.createElement('article');
      article.className = 'case-note-record';
      article.dataset.caseId = sourceRecord.id;

      const header = document.createElement('div');
      header.className = 'case-record-header';
      const heading = document.createElement('h4');
      heading.id = `case-record-title-${sourceRecord.id}`;
      heading.textContent = `${index + 1}. ${isOtherCase ? (sourceRecord.title.trim() || 'Інше') : sourceRecord.title}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-secondary button-small';
      remove.textContent = 'Прибрати приклад';
      remove.setAttribute('aria-label', `Прибрати приклад «${isOtherCase ? (sourceRecord.title.trim() || 'Інше') : sourceRecord.title}»`);
      remove.addEventListener('click', () => {
        const checkbox = caseSelectionInputs.find((input) => input.value === sourceRecord.id);
        if (checkbox) checkbox.checked = false;
        if (isOtherCase) {
          sourceRecord.id = OTHER_CASE_HIDDEN_ID;
          saveCaseState();
          renderSelectedCaseNotes();
          refreshCaseDependentOutputs();
          if (caseSelectionStatus) {
            caseSelectionStatus.textContent = 'Кейс «Інше» приховано. Введені дані збережено.';
            caseSelectionStatus.className = 'feedback';
          }
        } else {
          removeCaseRecord(sourceRecord.id, checkbox || { checked: false });
        }
      });
      header.append(heading, remove);
      article.appendChild(header);

      let otherTitleInput = null;
      if (isOtherCase) {
        const titleLabel = document.createElement('label');
        titleLabel.setAttribute('for', 'case-other-title');
        titleLabel.textContent = 'Назва прикладу';
        otherTitleInput = document.createElement('input');
        otherTitleInput.id = 'case-other-title';
        otherTitleInput.type = 'text';
        otherTitleInput.value = sourceRecord.title;
        otherTitleInput.autocomplete = 'off';
        otherTitleInput.required = true;
        otherTitleInput.setAttribute('aria-required', 'true');
        otherTitleInput.addEventListener('input', () => {
          sourceRecord.title = otherTitleInput.value;
          otherTitleInput.setCustomValidity('');
          otherTitleInput.removeAttribute('aria-invalid');
          if (caseSelectionStatus) {
            caseSelectionStatus.textContent = sourceRecord.title.trim() ? 'Назву прикладу збережено.' : 'Вкажіть назву власного прикладу.';
            caseSelectionStatus.className = sourceRecord.title.trim() ? 'feedback is-correct' : 'feedback is-incorrect';
          }
          const displayTitle = sourceRecord.title.trim() || 'Інше';
          heading.textContent = `${index + 1}. ${displayTitle}`;
          remove.setAttribute('aria-label', `Прибрати приклад «${displayTitle}»`);
          article.querySelectorAll('[data-other-case-note-field]').forEach((field) => {
            field.hidden = !sourceRecord.title.trim();
          });
          saveCaseState();
          refreshCaseDependentOutputs();
        });
        titleLabel.appendChild(otherTitleInput);
        article.appendChild(titleLabel);
      }

      const communityName = document.getElementById('community-name')?.value.trim();
      const fields = [
        { key: 'problem', label: isOtherCase ? 'Яку управлінську проблему вирішував цей приклад?' : 'Яку управлінську проблему вирішувало місто?' },
        { key: 'principle', label: 'Який принцип корисний для Вашої громади?' },
        {
          key: 'localCheck',
          label: isOtherCase
            ? (communityName ? `Що варто перевірити у громаді «${communityName}»?` : 'Що варто перевірити у Вашій громаді?')
            : 'Що варто перевірити у своїй громаді через цей принцип?'
        }
      ];
      fields.forEach(({ key, label }) => {
        const fieldId = `case-${sourceRecord.id}-${key}`;
        const wrapper = document.createElement('label');
        wrapper.setAttribute('for', fieldId);
        if (isOtherCase) {
          wrapper.dataset.otherCaseNoteField = '';
          wrapper.hidden = !sourceRecord.title.trim();
        }
        if (isOtherCase && key === 'localCheck') {
          const labelText = document.createElement('span');
          labelText.dataset.otherCaseCommunityLabel = '';
          labelText.textContent = label;
          wrapper.appendChild(labelText);
        } else {
          wrapper.appendChild(document.createTextNode(label));
        }
        const textarea = document.createElement('textarea');
        textarea.id = fieldId;
        textarea.rows = 3;
        textarea.value = sourceRecord[key];
        textarea.dataset.caseField = key;
        textarea.addEventListener('input', () => {
          sourceRecord[key] = textarea.value;
          saveCaseState();
          refreshCaseDependentOutputs();
        });
        wrapper.appendChild(textarea);
        article.appendChild(wrapper);
      });
      selectedCaseNotes.appendChild(article);
    });
  }

  caseSelectionInputs.forEach((input) => input.addEventListener('change', () => {
    const id = input.value;
    if (id === OTHER_CASE_ID) {
      const otherRecord = storedOtherCaseRecord();
      if (input.checked) {
        if (otherRecord) otherRecord.id = OTHER_CASE_ID;
        else caseState.records.push({ id: OTHER_CASE_ID, title: '', problem: '', principle: '', localCheck: '' });
        saveCaseState();
        renderSelectedCaseNotes();
        const titleInput = document.getElementById('case-other-title');
        if (titleInput) titleInput.focus();
        if (caseSelectionStatus) {
          caseSelectionStatus.textContent = sourceRecordTitleMissing(otherRecord) ? 'Вкажіть назву власного прикладу.' : `Обрано прикладів: ${caseRecords().length}. Нотатки зберігаються у цьому браузері.`;
          caseSelectionStatus.className = sourceRecordTitleMissing(otherRecord) ? 'feedback is-incorrect' : 'feedback is-correct';
        }
        refreshCaseDependentOutputs();
      } else if (otherRecord) {
        otherRecord.id = OTHER_CASE_HIDDEN_ID;
        saveCaseState();
        renderSelectedCaseNotes();
        refreshCaseDependentOutputs();
        if (caseSelectionStatus) {
          caseSelectionStatus.textContent = 'Кейс «Інше» приховано. Введені дані збережено.';
          caseSelectionStatus.className = 'feedback';
        }
      }
      return;
    }

    if (input.checked) {
      if (!caseState.records.some((record) => record.id === id) && CASE_BY_ID.has(id)) {
        const item = CASE_BY_ID.get(id);
        caseState.records.push({ id, title: item.title, problem: '', principle: '', localCheck: '' });
      }
      saveCaseState();
      renderSelectedCaseNotes();
      if (caseSelectionStatus) {
        caseSelectionStatus.textContent = `Обрано прикладів: ${caseRecords().length}. Нотатки зберігаються у цьому браузері.`;
        caseSelectionStatus.className = 'feedback is-correct';
      }
      refreshCaseDependentOutputs();
    } else {
      removeCaseRecord(id, input);
    }
  }));

  const transferDialog = document.getElementById('portfolio-transfer-dialog');
  const transferExisting = document.getElementById('portfolio-transfer-existing');
  const transferIncoming = document.getElementById('portfolio-transfer-incoming');
  const transferCase = document.getElementById('portfolio-transfer-case');
  const transferTargetLabel = document.getElementById('portfolio-transfer-target-label');
  const transferMergeButton = document.getElementById('portfolio-transfer-merge');
  const transferReplaceButton = document.getElementById('portfolio-transfer-replace');
  const transferSkipButton = document.getElementById('portfolio-transfer-skip');
  const transferCancelButtons = [document.getElementById('portfolio-transfer-cancel'), document.getElementById('portfolio-transfer-cancel-top')].filter(Boolean);
  let pendingTransferConflicts = [];
  let transferStats = null;

  function appendManagementSignal(decision, example) {
    const managementSignal = document.getElementById('management-signal');
    if (!decision || !managementSignal) return false;
    const addition = `${example}: ${decision}`;
    const existing = managementSignal.value.trim();
    if (!existing) managementSignal.value = addition;
    else if (!existing.includes(addition)) managementSignal.value = `${existing}\n${addition}`;
    else return false;
    return true;
  }

  function finishMultiCaseTransfer(message = '') {
    savePortfolioSilently();
    refreshCaseDependentOutputs();
    const summary = transferStats ? `Перенесено принципів: ${transferStats.principles}; локальних перевірок: ${transferStats.localChecks}; пропущено: ${transferStats.skipped}.` : '';
    caseTransferStatus.textContent = message || `${summary} Ви залишаєтеся на цій сторінці й самі керуєте переходом до практичної картки.`;
    caseTransferStatus.className = 'feedback is-correct';
    pendingTransferConflicts = [];
    transferStats = null;
    if (transferDialog?.open) transferDialog.close();
  }

  function showNextTransferConflict() {
    const conflict = pendingTransferConflicts[0];
    if (!conflict) {
      finishMultiCaseTransfer();
      return;
    }
    transferCase.textContent = conflict.record.title;
    transferTargetLabel.textContent = `Поточне значення поля «${conflict.targetLabel}»`;
    transferExisting.textContent = conflict.targetField.value.trim();
    transferIncoming.textContent = conflict.record.principle.trim();
    transferDialog.showModal();
    transferMergeButton.focus();
  }

  function resolveTransferConflict(strategy) {
    const conflict = pendingTransferConflicts.shift();
    if (!conflict) return;
    const incoming = conflict.record.principle.trim();
    const existing = conflict.targetField.value.trim();
    if (strategy === 'merge') {
      if (!existing.includes(incoming)) conflict.targetField.value = `${existing}; ${incoming}`;
      transferStats.principles += 1;
    } else if (strategy === 'replace') {
      conflict.targetField.value = incoming;
      transferStats.principles += 1;
    } else {
      transferStats.skipped += 1;
    }
    if (transferDialog.open) transferDialog.close();
    window.setTimeout(showNextTransferConflict, 0);
  }

  caseTransferButton?.addEventListener('click', () => {
    if (!validateOtherCaseSelection({ focus: true })) return;
    const records = caseRecordsForOutput();
    if (!records.length) {
      caseTransferStatus.textContent = 'Оберіть приклади й запишіть хоча б один висновок.';
      caseTransferStatus.className = 'feedback is-incorrect';
      return;
    }
    const principleFields = [
      { field: document.getElementById('principle-1'), label: 'Принцип 1' },
      { field: document.getElementById('principle-2'), label: 'Принцип 2' },
      { field: document.getElementById('principle-3'), label: 'Принцип 3' }
    ].filter((item) => item.field);
    pendingTransferConflicts = [];
    transferStats = { principles: 0, localChecks: 0, skipped: 0 };
    let occupiedTargetIndex = 0;

    records.forEach((record) => {
      const principle = record.principle.trim();
      if (principle) {
        const duplicate = principleFields.some(({ field }) => field.value.trim() === principle || field.value.split(';').map((value) => value.trim()).includes(principle));
        if (duplicate) {
          transferStats.skipped += 1;
        } else {
          const emptyTarget = principleFields.find(({ field }) => !field.value.trim());
          if (emptyTarget) {
            emptyTarget.field.value = principle;
            transferStats.principles += 1;
          } else {
            const target = principleFields[occupiedTargetIndex % principleFields.length];
            occupiedTargetIndex += 1;
            pendingTransferConflicts.push({ record, targetField: target.field, targetLabel: target.label });
          }
        }
      }
      if (record.localCheck.trim() && appendManagementSignal(record.localCheck.trim(), record.title)) transferStats.localChecks += 1;
    });

    savePortfolioSilently();
    if (pendingTransferConflicts.length) showNextTransferConflict();
    else finishMultiCaseTransfer();
  });

  transferMergeButton?.addEventListener('click', () => resolveTransferConflict('merge'));
  transferReplaceButton?.addEventListener('click', () => resolveTransferConflict('replace'));
  transferSkipButton?.addEventListener('click', () => resolveTransferConflict('skip'));
  transferCancelButtons.forEach((button) => button.addEventListener('click', () => {
    const stats = transferStats;
    pendingTransferConflicts = [];
    transferStats = null;
    if (transferDialog?.open) transferDialog.close();
    savePortfolioSilently();
    refreshCaseDependentOutputs();
    caseTransferStatus.textContent = stats ? `Перенесення зупинено. Уже додано принципів: ${stats.principles}; локальних перевірок: ${stats.localChecks}.` : 'Перенесення скасовано.';
    caseTransferStatus.className = 'feedback';
  }));
  transferDialog?.addEventListener('close', () => caseTransferButton?.focus());
  transferDialog?.addEventListener('click', (event) => {
    if (event.target === transferDialog) {
      pendingTransferConflicts = [];
      transferStats = null;
      transferDialog.close();
      caseTransferStatus.textContent = 'Перенесення зупинено. Уже додані неперезаписувальні значення збережено.';
      caseTransferStatus.className = 'feedback';
    }
  });

  restoreCaseState();
  renderSelectedCaseNotes();
  updateCaseCommunityName();

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
  const portfolioSummaryVision = document.getElementById('portfolio-summary-vision');
  const portfolioSummaryCases = document.getElementById('portfolio-summary-cases');
  const portfolioSummaryCasesList = document.getElementById('portfolio-summary-cases-list');
  const pdfDownloadButton = document.getElementById('print-portfolio');
  const editPortfolioButton = document.getElementById('edit-portfolio');
  const clearPortfolioButton = document.getElementById('clear-portfolio');
  const aiAssistantBlock = document.getElementById('ai-assistant-block');
  const aiServiceStatus = document.getElementById('ai-service-status');
  const portfolioFields = [...portfolioForm.querySelectorAll('input[type="text"], textarea')];

  const labels = {
    communityName: 'Назва громади',
    climateChallenge: 'Головний кліматичний виклик із попереднього заняття',
    communityVision: 'Попередній ескіз бажаного стану громади',
    resilienceRole: 'Що означає кліматична стійкість для цієї візії?',
    nbsRole: 'Яку роль можуть відіграти природоорієнтовані рішення?',
    resourceLoss: 'Яку ресурсну втрату має зменшити циркулярна економіка?',
    principles: 'Які 3 принципи мають пройти через майбутні рішення?',
    managementSignal: 'Який перший управлінський сигнал можна дати команді?',
    climateNeutralVision: 'Фінальна кліматично нейтральна візія громади'
  };

  function formDataObject() {
    return Object.fromEntries(portfolioFields.map((field) => [field.name, field.value]));
  }

  function formHasContent() {
    return portfolioFields.some((field) => field.value.trim());
  }

  function portfolioRequiredFields() {
    return portfolioFields.filter((field) => field.required);
  }

  function portfolioIsComplete() {
    return portfolioRequiredFields().every((field) => field.value.trim());
  }

  function fieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) return label.textContent.replace('*', '').trim();
    if (field.id.startsWith('principle-')) return `Принцип ${field.id.slice(-1)}`;
    return 'обов’язкове поле';
  }

  function validatePortfolioRequired({ focus = false, announce = false } = {}) {
    const invalid = portfolioRequiredFields().filter((field) => !field.value.trim());
    portfolioRequiredFields().forEach((field) => {
      const missing = !field.value.trim();
      field.toggleAttribute('aria-invalid', missing);
      field.setCustomValidity(missing ? `Заповніть поле «${fieldLabel(field)}».` : '');
    });
    const complete = invalid.length === 0;
    pdfDownloadButton.disabled = !complete;
    if (!complete && announce && portfolioStatus) {
      portfolioStatus.textContent = `Заповніть поле «${fieldLabel(invalid[0])}». Незавершених обов’язкових полів: ${invalid.length}.`;
      portfolioStatus.className = 'feedback is-incorrect';
    }
    if (!complete && focus && invalid[0]) {
      invalid[0].focus({ preventScroll: true });
      invalid[0].scrollIntoView({ behavior: scrollBehavior, block: 'center' });
      if (typeof invalid[0].reportValidity === 'function') invalid[0].reportValidity();
    }
    return complete;
  }

  function savePortfolioSilently() {
    safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
  }

  function savePortfolio() {
    const saved = safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
    portfolioStatus.textContent = saved ? 'Відповіді збережено у цьому браузері.' : 'Відповіді залишаються у формі, але браузер не дозволив локальне збереження.';
    portfolioStatus.className = saved ? 'feedback is-correct' : 'feedback is-incorrect';
  }

  function normalizeStorageFieldName(value) {
    return String(value || '').toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi, '');
  }

  function findStringByAliases(source, aliases, depth = 0) {
    if (!source || typeof source !== 'object' || depth > 3) return '';
    const normalizedAliases = new Set(aliases.map(normalizeStorageFieldName));
    for (const [key, value] of Object.entries(source)) {
      const normalizedKey = normalizeStorageFieldName(key);
      const matchesAlias = [...normalizedAliases].some((alias) => normalizedKey === alias || normalizedKey.endsWith(alias));
      if (typeof value === 'string' && value.trim() && matchesAlias) return value.trim();
    }
    for (const value of Object.values(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = findStringByAliases(value, aliases, depth + 1);
        if (nested) return nested;
      }
    }
    return '';
  }

  function importLesson01Context() {
    const communityField = portfolioForm.elements.communityName;
    const challengeField = portfolioForm.elements.climateChallenge;
    if ((!communityField || communityField.value.trim()) && (!challengeField || challengeField.value.trim())) return false;

    const verifiedCandidateKeys = ['ucan_l01_portfolio_v1', 'ucan_l01_portfolio_v2', 'ucan_lesson_01_portfolio_v1', 'ucan_lesson01_portfolio_v1'];
    const lesson01Pattern = /(?:^|[_-])(?:ucan[_-]?)?(?:lesson[_-]?)?l?0?1(?:[_-]|$)/i;
    const availableKeys = safeStorage.keys();
    const fallbackKeys = availableKeys.filter((key) => lesson01Pattern.test(key) && !verifiedCandidateKeys.includes(key));
    const candidateKeys = [...verifiedCandidateKeys.filter((key) => availableKeys.includes(key)), ...fallbackKeys];
    const sources = [];

    candidateKeys.forEach((key) => {
      const raw = safeStorage.get(key);
      if (typeof raw !== 'string' || !raw.trim()) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') sources.push(parsed);
      } catch (error) {
        sources.push({ [key]: raw });
      }
    });

    const communityAliases = ['communityName', 'community', 'community_name', 'municipalityName', 'cityName', 'hromadaName', 'назваГромади', 'громада'];
    const challengeAliases = ['climateChallenge', 'mainClimateChallenge', 'primaryClimateChallenge', 'mainChallenge', 'challenge', 'climateProblem', 'climate_problem', 'головнийКліматичнийВиклик', 'кліматичнийВиклик'];
    let imported = false;

    if (communityField && !communityField.value.trim()) {
      for (const source of sources) {
        const value = findStringByAliases(source, communityAliases);
        if (value) { communityField.value = value; imported = true; break; }
      }
    }
    if (challengeField && !challengeField.value.trim()) {
      for (const source of sources) {
        const value = findStringByAliases(source, challengeAliases);
        if (value) { challengeField.value = value; imported = true; break; }
      }
    }

    if (imported) {
      savePortfolioSilently();
      portfolioStatus.textContent = 'Доступний контекст із попереднього заняття підставлено до порожніх полів. Ви можете відредагувати його.';
      portfolioStatus.className = 'feedback is-correct';
    }
    return imported;
  }

  function restorePortfolio() {
    let restored = false;
    const raw = safeStorage.get(FORM_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        portfolioFields.forEach((field) => {
          if (typeof data[field.name] === 'string') {
            field.value = data[field.name];
            if (field.value.trim()) restored = true;
          }
        });
      } catch (error) {
        safeStorage.remove(FORM_KEY);
      }
    }
    const imported = importLesson01Context();
    if (restored && !imported && portfolioStatus) {
      portfolioStatus.textContent = 'Збережені дані відновлено.';
      portfolioStatus.className = 'feedback is-correct';
    }
    return restored || imported;
  }

  function buildAiPrompt(mode = 'facts') {
    const data = formDataObject();
    const valueOrMissing = (value) => value && value.trim() ? value.trim() : 'Не надано';
    const principles = [data.principle1, data.principle2, data.principle3]
      .filter((value) => value && value.trim())
      .map((value, index) => `${index + 1}. ${value.trim()}`)
      .join('\n') || 'Не надано';
    const selectedCaseContext = caseRecordText();
    const contracts = {
      facts: {
        title: 'ПЕРЕВІРКА ФАКТІВ І ПРИПУЩЕНЬ',
        role: 'Ви — аналітичний помічник для міської управлінської команди.',
        task: 'Відокремте твердження, що прямо випливають із картки, від припущень. Визначте, що потребує додаткових даних або перевірки. Не переписуйте картку.',
        output: `Подайте відповідь у трьох блоках:\n1. «Твердження з картки».\n2. «Припущення або нечіткі твердження».\n3. «Що потребує даних або перевірки».\nЯкщо даних недостатньо для висновку, поставте до трьох коротких уточнювальних запитань.`
      },
      questions: {
        title: 'УТОЧНЮВАЛЬНІ ПИТАННЯ',
        role: 'Ви — фасилітатор стратегічної розмови міської управлінської команди.',
        task: 'Поставте короткі запитання, які допоможуть автору самостійно уточнити кліматичну візію та управлінську логіку картки. Не давайте готової відповіді й не переписуйте картку.',
        output: 'Подайте лише нумерований список із трьох–п’яти запитань. Почніть із найбільш критичного питання. Не додавайте вступу, оцінки або нової версії картки.'
      },
      structure: {
        title: 'ПОВНОТА ТА СЛАБКІ МІСЦЯ',
        role: 'Ви — рецензент управлінської логіки кліматичної картки громади.',
        task: 'Перевірте зв’язок між викликом, бажаним станом, кліматично нейтральною візією, стійкістю, природоорієнтованими рішеннями, циркулярністю, трьома принципами та першим управлінським сигналом. Не переписуйте картку.',
        output: `Подайте відповідь у трьох блоках:\n1. «Сильні логічні зв’язки».\n2. «Прогалини або суперечності».\n3. «Кроки для самостійного уточнення» — до трьох коротких дій.\nЯкщо даних недостатньо, назвіть відсутню інформацію й поставте уточнювальне запитання.`
      }
    };
    const contract = contracts[mode] || contracts.facts;
    return `${contract.title}

РОЛЬ
${contract.role}

КОНТЕКСТ
Учасник курсу формує первинну кліматично нейтральну візію громади на основі власного виклику, управлінських принципів і висновків із міських прикладів.

ЗАВДАННЯ
${contract.task}

ДАНІ УЧАСНИКА
Назва громади:
${valueOrMissing(data.communityName)}

Головний кліматичний виклик:
${valueOrMissing(data.climateChallenge)}

Попередній ескіз бажаного стану громади:
${valueOrMissing(data.communityVision)}

Кліматична стійкість у цій візії:
${valueOrMissing(data.resilienceRole)}

Роль природоорієнтованих рішень:
${valueOrMissing(data.nbsRole)}

Ресурсна втрата, яку має зменшити циркулярна економіка:
${valueOrMissing(data.resourceLoss)}

Три принципи майбутніх рішень:
${principles}

Перший управлінський сигнал:
${valueOrMissing(data.managementSignal)}

Фінальна кліматично нейтральна візія громади:
${valueOrMissing(data.climateNeutralVision)}

ВИСНОВКИ З ОБРАНИХ КЕЙСІВ
${selectedCaseContext}

ОБМЕЖЕННЯ
- Працюйте лише з наданою інформацією.
- Не вигадуйте показників, проєктів, строків, бюджетів або характеристик громади.
- Не підміняйте управлінське рішення автора.
- Пишіть українською, коротко, доброзичливо й професійно.
- Якщо інформації недостатньо, прямо зазначте це та поставте уточнювальне запитання.

ФОРМАТ ВІДПОВІДІ
${contract.output}`;
  }

  function renderCaseSummary() {
    if (!portfolioSummaryCases || !portfolioSummaryCasesList) return;
    const records = caseRecordsForOutput();
    portfolioSummaryCasesList.innerHTML = '';
    portfolioSummaryCases.hidden = records.length === 0;
    records.forEach((record, index) => {
      const article = document.createElement('article');
      article.className = 'case-summary-record';
      const heading = document.createElement('h4');
      heading.textContent = `${index + 1}. ${record.title}`;
      const list = document.createElement('dl');
      [
        [record.id === OTHER_CASE_ID ? 'Що вирішував приклад' : 'Що вирішувало місто', record.problem],
        ['Корисний принцип', record.principle],
        ['Що варто перевірити у своїй громаді', record.localCheck]
      ].forEach(([label, value]) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = label;
        dd.textContent = value.trim() || '—';
        list.append(dt, dd);
      });
      article.append(heading, list);
      portfolioSummaryCasesList.appendChild(article);
    });
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
    if (portfolioSummaryVision) portfolioSummaryVision.textContent = data.climateNeutralVision || '—';
    renderCaseSummary();
    portfolioDate.textContent = new Date().toLocaleDateString('uk-UA');
    portfolioSummary.hidden = false;
    pdfDownloadButton.disabled = !portfolioIsComplete();
  }

  portfolioFields.forEach((field) => field.addEventListener('input', () => {
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    savePortfolioSilently();
    updateCaseCommunityName();
    pdfDownloadButton.disabled = !portfolioIsComplete();
    if (!portfolioSummary.hidden) renderPortfolioSummary();
  }));

  portfolioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validatePortfolioRequired({ focus: true, announce: true })) return;
    savePortfolio();
    renderPortfolioSummary();
    portfolioStatus.textContent = 'Картку збережено у цьому браузері.';
    portfolioStatus.className = 'feedback is-correct';
    portfolioSummary.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  });

  function localDateStamp(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function downloadPortfolioPdf(event) {
    const button = event && event.currentTarget ? event.currentTarget : pdfDownloadButton;
    if (!validatePortfolioRequired({ focus: true, announce: true })) return;
    if (!validateOtherCaseSelection({ focus: true })) return;
    renderPortfolioSummary();
    const data = formDataObject();
    const community = window.UCANInterface.sanitizeFilename(data.communityName) || 'Громада';
    const date = localDateStamp();
    const pdfData = {
      communityName: data.communityName,
      climateChallenge: data.climateChallenge,
      climateNeutralVision: data.climateNeutralVision,
      communityVision: data.communityVision,
      caseInsights: caseRecordText(),
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
      filename: `Картка_кліматичного_виклику_${community}_${date}.pdf`,
      fields: [
        { key: 'communityName', label: labels.communityName },
        { key: 'climateChallenge', label: labels.climateChallenge },
        { key: 'communityVision', label: labels.communityVision },
        { key: 'resilienceRole', label: labels.resilienceRole },
        { key: 'nbsRole', label: labels.nbsRole },
        { key: 'resourceLoss', label: labels.resourceLoss },
        { key: 'principles', label: labels.principles },
        { key: 'managementSignal', label: labels.managementSignal },
        { key: 'climateNeutralVision', label: labels.climateNeutralVision },
        ...(caseRecordsForOutput().length ? [{ key: 'caseInsights', label: 'Висновки з обраних кейсів' }] : [])
      ],
      data: pdfData,
      note: 'Чернетка створена учасником. Перевірте зміст разом із командою громади.'
    });
  }

  pdfDownloadButton.addEventListener('click', downloadPortfolioPdf);
  editPortfolioButton.addEventListener('click', () => {
    portfolioForm.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    const firstField = portfolioForm.querySelector('input, textarea');
    if (firstField) firstField.focus({ preventScroll: true });
  });
  const aiCopyResetTimers = new WeakMap();

  document.querySelectorAll('[data-ai-action="copy"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const scenario = button.dataset.aiScenario;
      const status = document.querySelector(`[data-ai-status="${scenario}"]`);
      if (!validatePortfolioRequired({ focus: true, announce: true })) {
        if (status) {
          status.textContent = 'Спочатку заповніть і збережіть усі поля практичної картки.';
          status.className = 'ai-copy-status is-warning';
        }
        return;
      }
      if (!validateOtherCaseSelection({ focus: true })) {
        if (status) {
          status.textContent = 'Завершіть опис власного прикладу «Інше».';
          status.className = 'ai-copy-status is-warning';
        }
        return;
      }
      const existingTimer = aiCopyResetTimers.get(button);
      if (existingTimer) window.clearTimeout(existingTimer);
      try {
        const prompt = buildAiPrompt(scenario);
        await window.UCANInterface.copyText(prompt);
        button.textContent = 'Скопійовано';
        button.classList.add('is-success');
        if (status) {
          status.textContent = 'Промпт скопійовано.';
          status.className = 'ai-copy-status is-success';
        }
        const timer = window.setTimeout(() => {
          button.textContent = 'Скопіювати промпт';
          button.classList.remove('is-success');
          if (status) {
            status.textContent = '';
            status.className = 'ai-copy-status';
          }
          aiCopyResetTimers.delete(button);
        }, 1800);
        aiCopyResetTimers.set(button, timer);
      } catch (error) {
        button.textContent = 'Скопіювати промпт';
        button.classList.remove('is-success');
        if (status) {
          status.textContent = 'Не вдалося скопіювати. Дозвольте доступ до буфера обміну та спробуйте ще раз.';
          status.className = 'ai-copy-status is-error';
        }
      }
    });
  });

  document.querySelectorAll('[data-ai-platform]').forEach((link) => link.addEventListener('click', () => {
    const platform = link.dataset.aiPlatform || 'ШІ-сервіс';
    if (aiServiceStatus) {
      aiServiceStatus.textContent = `${platform} відкривається в новій вкладці. Вставте скопійований промпт у чат і перевірте відповідь самостійно.`;
      aiServiceStatus.className = 'feedback';
    }
  }));


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
    const confirmed = window.confirm('Очистити всі поля практичної картки? Нотатки до обраних кейсів залишаться збереженими.');
    if (!confirmed) return;
    portfolioForm.reset();
    portfolioRequiredFields().forEach((field) => {
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
    });
    updateCaseCommunityName();
    safeStorage.remove(FORM_KEY);
    safeStorage.remove(COMPLETED_KEY);
    lessonCompleted = false;
    document.body.classList.remove('is-completed');
    portfolioSummary.hidden = true;
    pdfDownloadButton.disabled = true;
    portfolioStatus.textContent = 'Поля практичної картки очищено. Нотатки до кейсів збережено.';
    portfolioStatus.className = 'feedback';
    portfolioForm.querySelector('input, textarea')?.focus();
  });

  restorePortfolio();
  updateCaseCommunityName();
  validatePortfolioRequired({ focus: false, announce: false });
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
      nextPageButton.textContent = 'Перейти до підсумку ➡️';
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
  let initialPage = restoredPage > 6 && !scenarioIsComplete() ? 6 : restoredPage;
  if (initialPage > 5 && !validateOtherCaseSelection({ focus: false })) initialPage = 5;
  if (initialPage > 8 && !portfolioIsComplete()) initialPage = 8;
  if (restoredPage > 6 && initialPage === 6 && globalStatus) globalStatus.textContent = 'Завершіть інтерактивні ситуації, щоб продовжити заняття.';
  if (restoredPage > 8 && initialPage === 8 && globalStatus) globalStatus.textContent = 'Заповніть обов’язкові поля практичної картки, щоб продовжити заняття.';
  if (lessonCompleted && (!scenarioIsComplete() || !portfolioIsComplete() || !testPassed)) {
    lessonCompleted = false;
    safeStorage.remove(COMPLETED_KEY);
  }
  if (lessonCompleted) document.body.classList.add('is-completed');
  showPage(initialPage, { replace: true, focus: false, allowLocked: testPassed, bypassScenarioCheckpoint: true });
})();
