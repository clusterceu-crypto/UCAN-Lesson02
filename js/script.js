(() => {
  'use strict';

  const TOTAL_PAGES = 10;
  const PAGE_KEY = 'ucan_l02_progress_v1';
  const FORM_KEY = 'ucan_l02_portfolio_v1';
  const TEST_KEY = 'ucan_l02_test_v2';
  const SCENARIO_KEY = 'ucan_l02_scenarios_v2';
  const SCENARIO_SKIP_KEY = 'ucan_l02_scenario_skip_v1';
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
  const progressTrack = document.querySelector('.progress-track');
  const tocToggle = document.querySelector('.toc-toggle');
  const tocList = document.getElementById('toc-list');
  let currentPage = 1;
  let testPassed = safeStorage.get(TEST_KEY) === 'passed';
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
    return currentPage === 6 && targetPage > 6 && !scenarioIsComplete() && safeStorage.get(SCENARIO_SKIP_KEY) !== 'confirmed';
  }

  function showScenarioCheckpoint(targetPage) {
    const panel = document.getElementById('scenario-gate');
    const text = document.getElementById('scenario-gate-text');
    if (!panel) return false;
    pendingScenarioTarget = normalizePage(targetPage);
    const remaining = 3 - completedScenarios.size;
    text.textContent = `Залишилося виконати ${remaining} ${remaining === 1 ? 'ситуацію' : 'ситуації'}. Можна залишитися й завершити завдання або перейти далі свідомо.`;
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
    pages.forEach((page) => page.classList.toggle('is-active', Number(page.dataset.page) === currentPage));
    pageLinks.forEach((link) => {
      const active = Number(link.dataset.pageLink) === currentPage;
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });

    const percent = Math.round((currentPage / TOTAL_PAGES) * 100);
    progressText.textContent = `Сторінка ${currentPage} з ${TOTAL_PAGES}`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', String(currentPage));
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === TOTAL_PAGES || (currentPage === 9 && !testPassed);
    nextPageButton.textContent = currentPage === 9 && !testPassed ? 'Спочатку виконайте тест' : currentPage === TOTAL_PAGES ? 'Заняття завершено' : 'Далі';

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
    tocList.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
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
  tocToggle.addEventListener('click', () => {
    const open = tocList.classList.toggle('is-open');
    tocToggle.setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('popstate', () => showPage(pageFromHash() || 1, { replace: true, focus: false, bypassScenarioCheckpoint: true }));

  const stayButton = document.getElementById('scenario-stay');
  const continueButton = document.getElementById('scenario-continue');
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
  if (continueButton) {
    continueButton.addEventListener('click', () => {
      safeStorage.set(SCENARIO_SKIP_KEY, 'confirmed');
      hideScenarioCheckpoint();
      showPage(pendingScenarioTarget, { focus: true, bypassScenarioCheckpoint: true });
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
      const principleFields = [document.getElementById('principle-1'), document.getElementById('principle-2'), document.getElementById('principle-3')];
      const targetPrinciple = principleFields.find((field) => field && !field.value.trim()) || principleFields[0];
      if (principle && targetPrinciple) targetPrinciple.value = principle;
      const managementSignal = document.getElementById('management-signal');
      if (decision && managementSignal) {
        const prefix = example ? `Орієнтир: ${example}. ` : '';
        managementSignal.value = managementSignal.value.trim()
          ? `${managementSignal.value.trim()}\n${prefix}${decision}`
          : `${prefix}${decision}`;
      }
      savePortfolioSilently();
      caseTransferStatus.textContent = 'Підказки перенесено до поля принципів і першого управлінського сигналу.';
      caseTransferStatus.className = 'feedback is-correct';
      showPage(8, { focus: true, bypassScenarioCheckpoint: true });
    });
  }
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
      safeStorage.remove(SCENARIO_SKIP_KEY);
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
    climateChallenge: 'Головний кліматичний виклик із Заняття 01',
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

  function buildAiPrompt() {
    const data = formDataObject();
    const principles = [data.principle1, data.principle2, data.principle3].filter((value) => value && value.trim()).join('; ') || '[не заповнено]';
    const caseNotes = caseDataObject();
    return `Ви — AI-помічник UCAN для міського голови та управлінської команди.

Допоможіть покращити Картку кліматично нейтральної візії громади.

Працюйте лише з інформацією, яку я надаю. Не вигадуйте фактів, показників, проєктів або характеристик громади.

Перевірте:
1. Чи пов’язана візія з конкретним кліматичним або ресурсним викликом.
2. Чи зрозуміло описано бажаний стан громади.
3. Чи логічно використані кліматична стійкість, природоорієнтовані рішення та циркулярна економіка.
4. Чи можуть три принципи бути критеріями майбутніх рішень.
5. Чи є перший управлінський сигнал конкретним і зрозумілим для команди.

Спочатку поставте не більше трьох уточнювальних запитань. Після моїх відповідей:
- запропонуйте покращену версію візії;
- поясніть, що саме змінили;
- позначте твердження, які потребують даних або перевірки;
- не перетворюйте візію на повну стратегію чи план дій.

Моя картка:

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

Орієнтир із вивченого кейсу:
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
    aiPromptText.textContent = buildAiPrompt();
  }

  portfolioFields.forEach((field) => field.addEventListener('input', () => {
    savePortfolioSilently();
    aiPromptText.textContent = buildAiPrompt();
    if (!portfolioSummary.hidden) renderPortfolioSummary();
  }));

  caseFields.forEach((field) => {
    field.addEventListener('input', () => { aiPromptText.textContent = buildAiPrompt(); });
    field.addEventListener('change', () => { aiPromptText.textContent = buildAiPrompt(); });
  });

  portfolioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    savePortfolio();
    renderPortfolioSummary();
    portfolioSummary.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  });

  function printPortfolio() {
    renderPortfolioSummary();
    document.body.classList.add('print-portfolio');
    window.print();
  }

  printPortfolioButton.addEventListener('click', printPortfolio);
  summaryPrintButton.addEventListener('click', printPortfolio);
  editPortfolioButton.addEventListener('click', () => {
    portfolioForm.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    const firstField = portfolioForm.querySelector('input, textarea');
    if (firstField) firstField.focus({ preventScroll: true });
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('print-portfolio'));

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    const copied = document.execCommand('copy');
    temp.remove();
    if (!copied) throw new Error('copy failed');
  }

  copyAiPromptButton.addEventListener('click', async () => {
    const prompt = buildAiPrompt();
    aiPromptText.textContent = prompt;
    try {
      await copyText(prompt);
      aiPromptStatus.textContent = 'Промпт і відповіді скопійовано. Відкрийте AI-сервіс і вставте текст у новий чат.';
      aiPromptStatus.className = 'feedback is-correct';
    } catch (error) {
      aiPromptStatus.textContent = 'Автоматичне копіювання недоступне. Відкрийте попередній перегляд і скопіюйте текст вручну.';
      aiPromptStatus.className = 'feedback is-incorrect';
    }
  });

  clearPortfolioButton.addEventListener('click', () => {
    const confirmed = window.confirm('Очистити всі поля Картки кліматично нейтральної візії громади?');
    if (!confirmed) return;
    portfolioForm.reset();
    safeStorage.remove(FORM_KEY);
    portfolioSummary.hidden = true;
    printPortfolioButton.disabled = true;
    aiPromptText.textContent = buildAiPrompt();
    portfolioStatus.textContent = 'Форму очищено.';
    portfolioStatus.className = 'feedback';
  });

  restorePortfolio();
  aiPromptText.textContent = buildAiPrompt();
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

  updateTestGate();
  const initialPage = pageFromHash() || normalizePage(safeStorage.get(PAGE_KEY) || 1);
  showPage(initialPage, { replace: true, focus: false, allowLocked: testPassed, bypassScenarioCheckpoint: true });
})();
