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

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function printableValue(value) {
    const normalized = String(value ?? '').replace(/\r\n?/g, '\n').trim();
    return normalized || '—';
  }

  function createPortfolioPrintHtml({ title, label = 'Портфель мера', filename, fields, data, note }) {
    const documentTitle = String(filename || title || 'UCAN Portfolio')
      .replace(/\.pdf$/i, '')
      .trim() || 'UCAN Portfolio';
    const fieldSections = fields.map(field => `
      <section class="portfolio-section" aria-labelledby="pdf-field-${escapeHtml(field.key)}">
        <h2 id="pdf-field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</h2>
        <div class="portfolio-value">${escapeHtml(printableValue(data[field.key]))}</div>
      </section>`).join('');
    const noteSection = note ? `
      <footer class="portfolio-note">
        <strong>Примітка:</strong> ${escapeHtml(note)}
      </footer>` : '';

    return `<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    @page { size: A4; margin: 15mm 16mm 16mm; }
    *, *::before, *::after { box-sizing: border-box; }
    html { color: #1f2a33; background: #ffffff; font-family: Arial, "DejaVu Sans", sans-serif; }
    body { margin: 0; font-size: 10.5pt; line-height: 1.42; }
    header { margin: 0 0 5.5mm; }
    h1 { margin: 0 0 2mm; color: #123f68; font-size: 22pt; line-height: 1.16; }
    .portfolio-label { margin: 0 0 4mm; color: #2d7b55; font-size: 14pt; font-weight: 700; }
    .privacy-note { margin: 0; padding: 3.5mm 4mm; border-left: 1.2mm solid #2d7b55; background: #eef7f2; color: #34454f; }
    main { display: block; }
    .portfolio-section { margin: 0; padding: 3mm 0 2.8mm; border-top: 0.35mm solid #cfd9df; break-inside: auto; page-break-inside: auto; }
    .portfolio-section h2 { margin: 0 0 1.3mm; color: #123f68; font-size: 12.2pt; line-height: 1.25; break-after: avoid; page-break-after: avoid; }
    .portfolio-value { white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal; orphans: 3; widows: 3; }
    .portfolio-note { margin: 2mm 0 0; color: #47545e; font-size: 9.2pt; line-height: 1.35; white-space: pre-wrap; overflow-wrap: anywhere; }
    @media screen {
      body { max-width: 210mm; margin: 0 auto; padding: 17mm; box-shadow: 0 0 18px rgba(0,0,0,.12); }
    }
    @media print {
      html, body { background: #ffffff; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p class="portfolio-label">${escapeHtml(label)}</p>
    <p class="privacy-note">Локально створений навчальний артефакт. Дані не передавалися на сервер.</p>
    ${noteSection}
  </header>
  <main>${fieldSections}</main>
</body>
</html>`;
  }

  Interface.createPortfolioPrintHtml = createPortfolioPrintHtml;

  async function printPortfolioHtml(html) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Підготовка локального PDF');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '1px',
      height: '1px',
      border: '0',
      opacity: '0',
      pointerEvents: 'none'
    });
    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    const printDocument = iframe.contentDocument || (printWindow && printWindow.document);
    if (!printWindow || !printDocument) {
      iframe.remove();
      throw new Error('Print document could not be created');
    }

    printDocument.open();
    printDocument.write(html);
    printDocument.close();

    if (printDocument.fonts && printDocument.fonts.ready) {
      try { await printDocument.fonts.ready; } catch (error) { /* Browser fallback font is acceptable. */ }
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    let removed = false;
    const cleanup = () => {
      if (removed) return;
      removed = true;
      iframe.remove();
    };
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 60000);
    printWindow.focus();
    printWindow.print();
  }

  Interface.downloadPortfolioPdf = async function downloadPortfolioPdf({ button, status, title, label, filename, fields, data, note }) {
    if (!button) throw new Error('PDF button is required');
    const original = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Підготовка PDF…';
    if (status) status.textContent = 'Готуємо текстовий PDF локально у Вашому браузері…';
    try {
      const html = createPortfolioPrintHtml({ title, label, filename, fields, data, note });
      await printPortfolioHtml(html);
      if (status) status.textContent = 'Відкрито системний діалог друку. Оберіть «Зберегти як PDF». Дані залишаються у Вашому браузері.';
    } catch (error) {
      console.error('Portfolio PDF generation failed', error);
      if (status) status.textContent = 'Не вдалося підготувати PDF. Перевірте налаштування друку браузера та спробуйте ще раз.';
      throw error;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = original;
    }
  };

  window.UCANInterface = Object.freeze(Interface);
})();

/* UCAN Lesson 02 Gold Release v2.2 — completed local production runtime. */
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
    const catalogItem = CASE_BY_ID.get(String(record?.id || ''));
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
          if (!seen.has(record.id)) { seen.add(record.id); unique.push(record); }
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
    return caseState.records.map((record) => ({ ...record }));
  }

  function caseRecordsForOutput() {
    return caseRecords().filter((record) => [record.problem, record.principle, record.localCheck].some((value) => value.trim()));
  }

  function caseRecordText(records = caseRecordsForOutput()) {
    if (!records.length) return '[кейси не обрано або нотатки не заповнено]';
    const communityName = document.getElementById('community-name')?.value.trim();
    const community = communityName ? `громаді «${communityName}»` : 'своїй громаді';
    return records.map((record, index) => `${index + 1}. ${record.title}
- Що вирішувало місто: ${record.problem.trim() || '[не заповнено]'}
- Корисний принцип: ${record.principle.trim() || '[не заповнено]'}
- Що варто перевірити у ${community}: ${record.localCheck.trim() || '[не заповнено]'}`).join('\n\n');
  }

  function updateCaseCommunityName() {
    if (!caseCommunityName) return;
    const value = document.getElementById('community-name')?.value.trim();
    caseCommunityName.textContent = value || 'Вашої громади';
  }

  function refreshCaseDependentOutputs() {
    const promptTarget = document.getElementById('ai-prompt-text');
    if (promptTarget) promptTarget.textContent = buildAiPrompt(document.querySelector('input[name="l02-ai-mode"]:checked')?.value || 'facts');
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
    caseSelectionInputs.forEach((input) => { input.checked = caseState.records.some((record) => record.id === input.value); });
    if (!selectedCaseNotes) return;
    selectedCaseNotes.innerHTML = '';
    if (!caseState.records.length) {
      const empty = document.createElement('p');
      empty.className = 'field-hint';
      empty.textContent = 'Оберіть щонайменше один приклад, щоб додати окремі нотатки.';
      selectedCaseNotes.appendChild(empty);
      return;
    }

    caseState.records.forEach((record, index) => {
      const article = document.createElement('article');
      article.className = 'case-note-record';
      article.dataset.caseId = record.id;

      const header = document.createElement('div');
      header.className = 'case-record-header';
      const heading = document.createElement('h4');
      heading.id = `case-record-title-${record.id}`;
      heading.textContent = `${index + 1}. ${record.title}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-secondary button-small';
      remove.textContent = 'Прибрати приклад';
      remove.setAttribute('aria-label', `Прибрати приклад «${record.title}»`);
      remove.addEventListener('click', () => {
        const checkbox = caseSelectionInputs.find((input) => input.value === record.id);
        if (checkbox) checkbox.checked = false;
        removeCaseRecord(record.id, checkbox || { checked: false });
      });
      header.append(heading, remove);
      article.appendChild(header);

      const fields = [
        { key: 'problem', label: 'Яку управлінську проблему вирішувало місто?' },
        { key: 'principle', label: 'Який принцип корисний для Вашої громади?' },
        { key: 'localCheck', label: 'Що варто перевірити у своїй громаді через цей принцип?' }
      ];
      fields.forEach(({ key, label }) => {
        const fieldId = `case-${record.id}-${key}`;
        const wrapper = document.createElement('label');
        wrapper.setAttribute('for', fieldId);
        wrapper.textContent = label;
        const textarea = document.createElement('textarea');
        textarea.id = fieldId;
        textarea.rows = 3;
        textarea.value = record[key];
        textarea.dataset.caseField = key;
        textarea.addEventListener('input', () => {
          record[key] = textarea.value;
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
    if (input.checked) {
      if (!caseState.records.some((record) => record.id === id) && CASE_BY_ID.has(id)) {
        const item = CASE_BY_ID.get(id);
        caseState.records.push({ id, title: item.title, problem: '', principle: '', localCheck: '' });
      }
      saveCaseState();
      renderSelectedCaseNotes();
      if (caseSelectionStatus) {
        caseSelectionStatus.textContent = `Обрано прикладів: ${caseState.records.length}. Нотатки зберігаються у цьому браузері.`;
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
    communityVision: 'Попередній ескіз бажаного стану громади',
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
    const raw = safeStorage.get(FORM_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        portfolioFields.forEach((field) => {
          if (typeof data[field.name] === 'string') field.value = data[field.name];
        });
      } catch (error) {
        safeStorage.remove(FORM_KEY);
      }
    }
    importLesson01Context();
  }

  function buildAiPrompt(mode = 'facts') {
    const data = formDataObject();
    const principles = [data.principle1, data.principle2, data.principle3].filter((value) => value && value.trim()).join('; ') || '[не заповнено]';
    const selectedCaseContext = caseRecordText();
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

Кліматично нейтральна візія громади:
${data.climateNeutralVision || '[не заповнено]'}

Попередній ескіз бажаного стану громади:
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

ВИСНОВКИ З ОБРАНИХ КЕЙСІВ
${selectedCaseContext}`;
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
        ['Що вирішувало місто', record.problem],
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
    printPortfolioButton.disabled = false;
    aiPromptText.textContent = currentAiPrompt();
  }

  portfolioFields.forEach((field) => field.addEventListener('input', () => {
    savePortfolioSilently();
    updateCaseCommunityName();
    aiPromptText.textContent = currentAiPrompt();
    if (!portfolioSummary.hidden) renderPortfolioSummary();
  }));

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
      filename: community ? `UCAN_Картка_кліматично_нейтральної_візії_${community}.pdf` : 'UCAN_Картка_кліматично_нейтральної_візії.pdf',
      fields: [
        { key: 'communityName', label: labels.communityName },
        { key: 'climateChallenge', label: labels.climateChallenge },
        { key: 'climateNeutralVision', label: 'Фінальна кліматично нейтральна візія громади' },
        { key: 'communityVision', label: labels.communityVision },
        { key: 'caseInsights', label: 'Висновки з обраних кейсів' },
        { key: 'resilienceRole', label: labels.resilienceRole },
        { key: 'nbsRole', label: labels.nbsRole },
        { key: 'resourceLoss', label: labels.resourceLoss },
        { key: 'principles', label: labels.principles },
        { key: 'managementSignal', label: labels.managementSignal }
      ],
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
  document.querySelectorAll('[data-ai-platform]').forEach((link) => link.addEventListener('click', () => {
    const platform = link.dataset.aiPlatform || 'AI-платформу';
    aiPromptStatus.textContent = `${platform} відкривається в новій вкладці. Вставте скопійований запит у чат і самостійно перевірте результат.`;
    aiPromptStatus.className = 'feedback';
  }));
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
    updateCaseCommunityName();
    safeStorage.remove(FORM_KEY);
    portfolioSummary.hidden = true;
    printPortfolioButton.disabled = true;
    aiPromptText.textContent = currentAiPrompt();
    portfolioStatus.textContent = 'Форму очищено.';
    portfolioStatus.className = 'feedback';
  });

  restorePortfolio();
  updateCaseCommunityName();
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
