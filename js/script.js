/* UCAN Lesson 02 platform validation pilot v0.1 — lesson-specific runtime. */
(() => {
  'use strict';

  const Core = window.UCANCore;
  if (!Core) throw new Error('UCAN reusable core failed to load');

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

  const safeStorage = Core.storage;

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

  function caseRecordsForOutput() {
    return caseRecords().filter((record) => {
      if (record.id === OTHER_CASE_ID && !record.title.trim()) return false;
      return [record.problem, record.principle, record.localCheck].some((value) => value.trim());
    });
  }

  function caseRecordText(records = caseRecordsForOutput()) {
    if (!records.length) return '[кейси не обрано або нотатки не заповнено]';
    const communityName = document.getElementById('community-name')?.value.trim();
    const community = communityName ? `громаді «${communityName}»` : 'своїй громаді';
    return records.map((record, index) => `${index + 1}. ${record.title}
- ${record.id === OTHER_CASE_ID ? 'Що вирішував приклад' : 'Що вирішувало місто'}: ${record.problem.trim() || '[не заповнено]'}
- Корисний принцип: ${record.principle.trim() || '[не заповнено]'}
- Що варто перевірити у ${community}: ${record.localCheck.trim() || '[не заповнено]'}`).join('\n\n');
  }

  function updateCaseCommunityName() {
    const value = document.getElementById('community-name')?.value.trim();
    if (caseCommunityName) caseCommunityName.textContent = value || 'Вашої громади';
    document.querySelectorAll('[data-other-case-community-label]').forEach((label) => {
      label.textContent = value ? `Що варто перевірити у громаді «${value}»?` : 'Що варто перевірити у Вашій громаді?';
    });
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
          if (caseSelectionStatus) Core.notify(caseSelectionStatus, 'info', 'Кейс «Інше» приховано. Введені дані збережено.');
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
        otherTitleInput.addEventListener('input', () => {
          sourceRecord.title = otherTitleInput.value;
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
        textarea.addEventListener('change', () => {
          Core.notify(caseSelectionStatus, 'success', 'Нотатки до кейсів збережено.');
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
        input.setAttribute('aria-expanded', 'true');
        if (otherRecord) otherRecord.id = OTHER_CASE_ID;
        else caseState.records.push({ id: OTHER_CASE_ID, title: '', problem: '', principle: '', localCheck: '' });
        saveCaseState();
        renderSelectedCaseNotes();
        const titleInput = document.getElementById('case-other-title');
        if (titleInput) titleInput.focus();
        if (caseSelectionStatus) Core.notify(caseSelectionStatus, 'success', `Обрано прикладів: ${caseRecords().length}. Нотатки зберігаються у цьому браузері.`);
        refreshCaseDependentOutputs();
      } else if (otherRecord) {
        input.setAttribute('aria-expanded', 'false');
        otherRecord.id = OTHER_CASE_HIDDEN_ID;
        saveCaseState();
        renderSelectedCaseNotes();
        refreshCaseDependentOutputs();
        if (caseSelectionStatus) Core.notify(caseSelectionStatus, 'info', 'Кейс «Інше» приховано. Введені дані збережено.');
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
      if (caseSelectionStatus) Core.notify(caseSelectionStatus, 'success', `Обрано прикладів: ${caseRecords().length}. Нотатки зберігаються у цьому браузері.`);
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
    const transferMessage = message || `${summary} Ви залишаєтеся на цій сторінці й самі керуєте переходом до практичної картки.`;
    Core.notify(caseTransferStatus, 'success', transferMessage);
    Core.announce('success', 'Збережено у Вашій практичній картці.');
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
    Core.openDialog(transferDialog, { invoker: caseTransferButton, initialFocus: transferMergeButton });
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
      Core.notify(caseTransferStatus, 'warning', 'Оберіть приклади й запишіть хоча б один висновок.');
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
    Core.notify(caseTransferStatus, 'info', stats ? `Перенесення зупинено. Уже додано принципів: ${stats.principles}; локальних перевірок: ${stats.localChecks}.` : 'Перенесення скасовано.');
  }));
  Core.registerDialog(transferDialog, { returnFocus: caseTransferButton, closeOnOverlay: false, closeOnEscape: true });
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
  if (caseRecords().length) Core.announce('info', 'Вибрані кейси та нотатки відновлено.', { timeout: 4200 });

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
  const portfolioEmptyState = document.getElementById('portfolio-empty-state');
  const pdfActionHint = document.getElementById('pdf-action-hint');
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
    return Core.serializeForm(portfolioForm);
  }

  function formHasContent() {
    return Core.formHasContent(portfolioForm);
  }

  function savePortfolioSilently() {
    safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
  }

  function savePortfolio() {
    const saved = safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
    const message = saved ? 'Збережено у Вашій практичній картці.' : 'Відповіді залишаються у формі, але браузер не дозволив локальне збереження.';
    Core.notify(portfolioStatus, saved ? 'success' : 'error', message);
    Core.announce(saved ? 'success' : 'error', message);
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
      Core.notify(portfolioStatus, 'success', 'Доступний контекст із попереднього заняття підставлено до порожніх полів. Ви можете відредагувати його.');
      Core.announce('info', 'Дані з попереднього заняття відновлено у порожніх полях.', { timeout: 5000 });
    }
    return imported;
  }

  function restorePortfolio() {
    const raw = safeStorage.get(FORM_KEY);
    let restored = 0;
    if (raw) {
      try {
        restored = Core.restoreForm(portfolioForm, JSON.parse(raw));
      } catch (error) {
        safeStorage.remove(FORM_KEY);
      }
    }
    const imported = importLesson01Context();
    if (restored > 0 && !imported) Core.announce('info', 'Дані практичної картки відновлено.', { timeout: 4200 });
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
    if (portfolioEmptyState) portfolioEmptyState.hidden = true;
    printPortfolioButton.disabled = false;
    aiPromptText.textContent = currentAiPrompt();
  }

  portfolioFields.forEach((field) => field.addEventListener('input', () => {
    savePortfolioSilently();
    updateCaseCommunityName();
    aiPromptText.textContent = currentAiPrompt();
    updateAiContextSummary();
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
    if (pdfActionHint) pdfActionHint.hidden = false;
    Core.notify(portfolioStatus, 'info', 'У вікні браузера оберіть «Зберегти як PDF».');
    const data = formDataObject();
    const community = Core.sanitizeFilename(data.communityName);
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
    await Core.downloadPortfolioPdf({
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

  const prepareAiPromptButton = document.getElementById('prepare-ai-prompt');
  const aiContextSummaryText = document.getElementById('ai-context-summary-text');
  const currentAiPrompt = () => buildAiPrompt(document.querySelector('input[name="l02-ai-mode"]:checked')?.value || 'facts');
  let aiPreparedOnce = false;

  function updateAiContextSummary() {
    const filledFields = portfolioFields.filter((field) => field.value.trim()).length;
    const selectedCases = caseRecordsForOutput().length;
    if (!aiContextSummaryText) return;
    if (!filledFields && !selectedCases) {
      aiContextSummaryText.textContent = 'практична картка ще не заповнена.';
      return;
    }
    aiContextSummaryText.textContent = `${filledFields} заповнених полів практичної картки; кейсів із нотатками: ${selectedCases}.`;
  }

  async function prepareAiPrompt() {
    Core.setActionState(prepareAiPromptButton, 'loading', { idle: aiPreparedOnce ? '🔄 Оновити запит' : '✨ Підготувати запит', loading: 'Готуємо запит…' });
    if (aiPromptText) aiPromptText.setAttribute('aria-busy', 'true');
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    try {
      const prompt = currentAiPrompt();
      aiPromptText.textContent = prompt;
      updateAiContextSummary();
      aiPreparedOnce = true;
      const hasContext = formHasContent() || caseRecordsForOutput().length > 0;
      Core.notify(aiPromptStatus, hasContext ? 'success' : 'warning', hasContext
        ? 'Запит підготовлено. Перегляньте його, скопіюйте та вставте у вибраний AI-чат.'
        : 'Запит підготовлено, але практична картка ще порожня. Спочатку додайте власний контекст.');
      Core.setActionState(prepareAiPromptButton, hasContext ? 'success' : 'warning', {
        idle: '🔄 Оновити запит', success: '✓ Запит підготовлено', warning: 'Перевірте контекст'
      });
      window.setTimeout(() => Core.setActionState(prepareAiPromptButton, 'idle', { idle: '🔄 Оновити запит' }), 1500);
    } catch (error) {
      console.error('AI prompt preparation failed', error);
      Core.notify(aiPromptStatus, 'error', 'Не вдалося підготувати запит. Дані картки збережені; спробуйте ще раз.');
      Core.setActionState(prepareAiPromptButton, 'error', { idle: '🔄 Спробувати ще раз', error: 'Помилка підготовки' });
      window.setTimeout(() => Core.setActionState(prepareAiPromptButton, 'idle', { idle: '🔄 Спробувати ще раз' }), 1700);
    } finally {
      aiPromptText?.removeAttribute('aria-busy');
    }
  }

  prepareAiPromptButton?.addEventListener('click', prepareAiPrompt);

  document.querySelectorAll('[data-ai-platform]').forEach((link) => link.addEventListener('click', () => {
    const platform = link.dataset.aiPlatform || 'AI-платформу';
    Core.notify(aiPromptStatus, 'info', `${platform} відкривається в новій вкладці. Вставте скопійований запит у чат і самостійно перевірте результат.`);
  }));

  document.querySelectorAll('input[name="l02-ai-mode"]').forEach(input => input.addEventListener('change', () => {
    aiPromptText.textContent = currentAiPrompt();
    updateAiContextSummary();
    Core.notify(aiPromptStatus, 'info', 'Режим змінено. Запит оновлено; перегляньте його перед копіюванням.');
  }));

  copyAiPromptButton.addEventListener('click', async () => {
    const prompt = currentAiPrompt();
    aiPromptText.textContent = prompt;
    Core.setActionState(copyAiPromptButton, 'loading', { idle: '📋 Скопіювати запит', loading: 'Копіюємо…' });
    try {
      await Core.copyText(prompt);
      Core.notify(aiPromptStatus, 'success', 'Скопійовано. Відкрийте ChatGPT або Gemini та вставте запит у чат.');
      Core.setActionState(copyAiPromptButton, 'success', { idle: '📋 Скопіювати запит', success: 'Скопійовано' });
      window.setTimeout(() => Core.setActionState(copyAiPromptButton, 'idle', { idle: '📋 Скопіювати запит' }), 1600);
    } catch (error) {
      Core.notify(aiPromptStatus, 'error', 'Автоматичне копіювання недоступне. Відкрийте попередній перегляд і скопіюйте текст вручну.');
      Core.setActionState(copyAiPromptButton, 'error', { idle: '📋 Спробувати копіювання ще раз', error: 'Не скопійовано' });
      window.setTimeout(() => Core.setActionState(copyAiPromptButton, 'idle', { idle: '📋 Спробувати копіювання ще раз' }), 1800);
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
    Core.openDialog(aiPromptDialog, { invoker: previewAiPromptButton, initialFocus: aiPromptDialogContent });
  });
  Core.registerDialog(aiPromptDialog, { returnFocus: previewAiPromptButton, initialFocus: aiPromptDialogContent });
  closeAiPromptDialogButton?.addEventListener('click', () => Core.closeDialog(aiPromptDialog, 'button'));
  copyAiPromptDialogButton?.addEventListener('click', async () => {
    try {
      await Core.copyText(currentAiPrompt());
      Core.notify(aiDialogStatus, 'success', 'Скопійовано.');
      const originalLabel = copyAiPromptDialogButton.textContent;
      copyAiPromptDialogButton.textContent = 'Скопійовано';
      window.setTimeout(() => { copyAiPromptDialogButton.textContent = originalLabel; }, 1600);
    } catch (error) {
      Core.notify(aiDialogStatus, 'error', 'Автоматичне копіювання недоступне. Виділіть текст і скопіюйте його вручну.');
    }
  });

  const imageLightbox = document.getElementById('image-lightbox');
  const imageLightboxImage = document.getElementById('image-lightbox-image');
  const imageLightboxCaption = document.getElementById('image-lightbox-caption');
  const closeImageLightboxButton = document.getElementById('close-image-lightbox');
  Core.initImageViewer({
    dialog: imageLightbox,
    image: imageLightboxImage,
    caption: imageLightboxCaption,
    closeButton: closeImageLightboxButton,
    triggers: document.querySelectorAll('.image-zoom-trigger')
  });
  closeImageLightboxButton?.addEventListener('click', () => Core.closeDialog(imageLightbox, 'button'));


  clearPortfolioButton.addEventListener('click', () => {
    const confirmed = window.confirm('Очистити всі поля Картки кліматично нейтральної візії громади?');
    if (!confirmed) return;
    portfolioForm.reset();
    updateCaseCommunityName();
    safeStorage.remove(FORM_KEY);
    portfolioSummary.hidden = true;
    if (portfolioEmptyState) portfolioEmptyState.hidden = false;
    if (pdfActionHint) pdfActionHint.hidden = true;
    printPortfolioButton.disabled = true;
    aiPromptText.textContent = currentAiPrompt();
    portfolioStatus.textContent = 'Форму очищено.';
    portfolioStatus.className = 'feedback';
  });

  restorePortfolio();
  updateCaseCommunityName();
  aiPromptText.textContent = currentAiPrompt();
  updateAiContextSummary();
  if (formHasContent()) renderPortfolioSummary();
  else if (portfolioEmptyState) portfolioEmptyState.hidden = false;

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
