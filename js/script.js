(() => {
  'use strict';

  const TOTAL_PAGES = 10;
  const PAGE_KEY = 'ucan_l02_progress_v1';
  const FORM_KEY = 'ucan_l02_portfolio_v1';
  const TEST_KEY = 'ucan_l02_test_v1';

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
  const progressBar = document.getElementById('progress-bar');
  const progressTrack = document.querySelector('.progress-track');
  const tocToggle = document.querySelector('.toc-toggle');
  const tocList = document.getElementById('toc-list');
  let currentPage = 1;
  let testPassed = safeStorage.get(TEST_KEY) === 'passed';

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

  function showPage(pageNumber, options = {}) {
    const requested = normalizePage(pageNumber);
    if (requested === 10 && !testPassed && options.allowLocked !== true) {
      showPage(9, { replace: true, focus: true, allowLocked: true });
      const testStatus = document.getElementById('test-status');
      if (testStatus) {
        testStatus.textContent = 'Щоб перейти до підсумку, правильно виконайте всі п’ять питань.';
        testStatus.className = 'feedback is-incorrect';
      }
      return;
    }

    currentPage = requested;
    pages.forEach((page) => page.classList.toggle('is-active', Number(page.dataset.page) === currentPage));
    pageLinks.forEach((link) => {
      const active = Number(link.dataset.pageLink) === currentPage;
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });

    progressText.textContent = `Сторінка ${currentPage} з ${TOTAL_PAGES}`;
    progressBar.style.width = `${(currentPage / TOTAL_PAGES) * 100}%`;
    progressTrack.setAttribute('aria-valuenow', String(currentPage));
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === TOTAL_PAGES || (currentPage === 9 && !testPassed);
    nextPageButton.textContent = currentPage === 9 && !testPassed ? 'Спочатку виконайте тест' : 'Далі';

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
        activeHeading.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
    tocList.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
  }

  pageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.dataset.requiresTest === 'true' && !testPassed) {
        showPage(9, { focus: true });
        return;
      }
      showPage(link.dataset.pageLink, { focus: true });
    });
  });

  prevPageButton.addEventListener('click', () => showPage(currentPage - 1, { focus: true }));
  nextPageButton.addEventListener('click', () => showPage(currentPage + 1, { focus: true }));
  tocToggle.addEventListener('click', () => {
    const open = tocList.classList.toggle('is-open');
    tocToggle.setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('popstate', () => showPage(pageFromHash() || 1, { replace: true, focus: false }));

  // Interactive concept matching
  const scenarios = [...document.querySelectorAll('.scenario')];
  const scenarioProgress = document.getElementById('scenario-progress');
  const scenarioFeedback = document.getElementById('scenario-feedback');
  const scenarioPrev = document.getElementById('scenario-prev');
  const scenarioNext = document.getElementById('scenario-next');
  const scenarioCheck = document.getElementById('scenario-check');
  let scenarioIndex = 0;
  const scenarioAnswers = ['B', 'C', 'D'];
  const scenarioMessages = [
    'Правильно. Основна концепція — природоорієнтовані рішення. Кліматична стійкість також підтримує логіку цього рішення.',
    'Правильно. Це циркулярна економіка: рішення змінює ресурсну та життєциклову логіку закупівель.',
    'Правильно. Це city vision: рішення задає напрям і критерії для майбутніх дій.'
  ];

  function renderScenario() {
    scenarios.forEach((scenario, index) => scenario.classList.toggle('is-current', index === scenarioIndex));
    scenarioProgress.textContent = `Ситуація ${scenarioIndex + 1} з ${scenarios.length}`;
    scenarioPrev.disabled = scenarioIndex === 0;
    scenarioNext.disabled = scenarioIndex === scenarios.length - 1;
    scenarioFeedback.textContent = '';
    scenarioFeedback.className = 'feedback';
  }

  scenarioPrev.addEventListener('click', () => { scenarioIndex = Math.max(0, scenarioIndex - 1); renderScenario(); });
  scenarioNext.addEventListener('click', () => { scenarioIndex = Math.min(scenarios.length - 1, scenarioIndex + 1); renderScenario(); });
  scenarioCheck.addEventListener('click', () => {
    const selected = document.querySelector(`input[name="scenario-${scenarioIndex + 1}"]:checked`);
    if (!selected) {
      scenarioFeedback.textContent = 'Оберіть одну концепцію, а потім натисніть “Відповісти”.';
      scenarioFeedback.className = 'feedback is-incorrect';
      return;
    }
    const correct = selected.value === scenarioAnswers[scenarioIndex];
    scenarioFeedback.textContent = correct ? scenarioMessages[scenarioIndex] : 'Ця відповідь звучить правдоподібно, але не є основною концепцією для цієї ситуації. Перегляньте управлінську логіку й спробуйте ще раз.';
    scenarioFeedback.className = `feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
  });
  renderScenario();

  // Portfolio form
  const portfolioForm = document.getElementById('portfolio-form');
  const portfolioStatus = document.getElementById('portfolio-status');
  const portfolioSummary = document.getElementById('portfolio-summary');
  const portfolioSummaryList = document.getElementById('portfolio-summary-list');
  const printPortfolioButton = document.getElementById('print-portfolio');
  const clearPortfolioButton = document.getElementById('clear-portfolio');
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
    const data = Object.fromEntries(portfolioFields.map((field) => [field.name, field.value]));
    return data;
  }

  function savePortfolio() {
    const saved = safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
    portfolioStatus.textContent = saved ? 'Відповіді збережено у цьому браузері.' : 'Відповіді залишаються у формі, але браузер не дозволив локальне збереження.';
    portfolioStatus.className = 'feedback is-correct';
  }

  function restorePortfolio() {
    const raw = safeStorage.get(FORM_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      portfolioFields.forEach((field) => { if (typeof data[field.name] === 'string') field.value = data[field.name]; });
    } catch (error) { safeStorage.remove(FORM_KEY); }
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
    portfolioSummary.hidden = false;
    printPortfolioButton.disabled = false;
  }

  portfolioFields.forEach((field) => field.addEventListener('input', () => {
    safeStorage.set(FORM_KEY, JSON.stringify(formDataObject()));
  }));

  portfolioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    savePortfolio();
    renderPortfolioSummary();
    portfolioSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  printPortfolioButton.addEventListener('click', () => {
    renderPortfolioSummary();
    document.body.classList.add('print-portfolio');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('print-portfolio'));

  clearPortfolioButton.addEventListener('click', () => {
    const confirmed = window.confirm('Очистити всі поля Картки кліматично нейтральної візії громади?');
    if (!confirmed) return;
    portfolioForm.reset();
    safeStorage.remove(FORM_KEY);
    portfolioSummary.hidden = true;
    printPortfolioButton.disabled = true;
    portfolioStatus.textContent = 'Форму очищено.';
    portfolioStatus.className = 'feedback';
  });
  restorePortfolio();

  // Final test
  const finalTest = document.getElementById('final-test');
  const testStatus = document.getElementById('test-status');
  const correctAnswers = { q1: 'B', q2: 'C', q3: 'B', q4: 'C', q5: 'C' };
  const explanations = {
    q1: 'Стійкість означає здатність громади підтримувати послуги й якість життя попри ризики, а не лише реагувати після аварій.',
    q2: 'NBS мають управлінську цінність тоді, коли працюють як частина інфраструктури та зменшують ризики.',
    q3: 'Циркулярність пов’язує ресурси, витрати, відновлення, закупівлі та місцеву економіку.',
    q4: 'Візія має допомагати приймати рішення, а не бути лише лозунгом або списком проєктів.',
    q5: 'Мер має перевірити управлінську логіку рішення: проблема, вплив, відповідальність, бюджет і зв’язок із візією.'
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
  showPage(initialPage, { replace: true, focus: false, allowLocked: testPassed });
})();
