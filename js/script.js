(() => {
  'use strict';

  const CONFIG = Object.freeze({
    totalPages: 10,
    assessmentPage: 9,
    finalPage: 10,
    interactivePage: 6,
    namespace: 'ucan_l02_v1_0',
    chatgptUrl: 'https://chatgpt.com/',
    geminiUrl: 'https://gemini.google.com/app'
  });

  const KEYS = Object.freeze({
    navigation: `${CONFIG.namespace}:navigation`,
    interactive: `${CONFIG.namespace}:interactive`,
    test: `${CONFIG.namespace}:test`,
    portfolio: `${CONFIG.namespace}:portfolio`,
    completed: `${CONFIG.namespace}:completed`
  });

  const pages = [...document.querySelectorAll('.lesson-page')];
  const pageLabel = document.getElementById('page-label');
  const progressTrack = document.getElementById('progress-track');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent');
  const bottomPageCount = document.getElementById('bottom-page-count');
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const globalStatus = document.getElementById('global-status');
  const resetProgressButton = document.getElementById('reset-progress');

  const state = {
    page: 1,
    maxVisited: 1,
    interactiveComplete: false,
    testComplete: false,
    completed: false
  };

  function safeParse(value, fallback) {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function readStorage(key, fallback) {
    try { return safeParse(localStorage.getItem(key), fallback); } catch (_) { return fallback; }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
  }

  function removeStorage(key) {
    try { localStorage.removeItem(key); } catch (_) { /* no-op */ }
  }

  function clampPage(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.min(CONFIG.totalPages, Math.max(1, Math.trunc(n)));
  }

  function announce(message) {
    globalStatus.textContent = message;
    window.clearTimeout(announce.timer);
    announce.timer = window.setTimeout(() => { globalStatus.textContent = ''; }, 4500);
  }

  function restoreState() {
    const nav = readStorage(KEYS.navigation, {});
    const interactive = readStorage(KEYS.interactive, {});
    const test = readStorage(KEYS.test, {});
    const hashPage = /^#page-(\d+)$/.exec(window.location.hash)?.[1];
    state.page = clampPage(hashPage || nav.page || 1);
    state.maxVisited = clampPage(Math.max(nav.maxVisited || 1, state.page));
    state.interactiveComplete = Boolean(interactive.complete);
    state.testComplete = Boolean(test.complete);
    state.completed = Boolean(readStorage(KEYS.completed, false));

    if (state.page > CONFIG.interactivePage && !state.interactiveComplete) state.page = CONFIG.interactivePage;
    if (state.page > CONFIG.assessmentPage && !state.testComplete) state.page = CONFIG.assessmentPage;
  }

  function saveNavigation() {
    writeStorage(KEYS.navigation, { page: state.page, maxVisited: state.maxVisited });
  }

  function isNextAllowed() {
    if (state.page === CONFIG.interactivePage && !state.interactiveComplete) return false;
    if (state.page === CONFIG.assessmentPage && !state.testComplete) return false;
    return state.page < CONFIG.finalPage;
  }

  function updateNavigation() {
    const activePage = pages.find((page) => Number(page.dataset.page) === state.page);
    pages.forEach((page) => page.classList.toggle('is-active', page === activePage));

    const title = activePage?.dataset.title || '';
    pageLabel.textContent = title;
    bottomPageCount.textContent = `${state.page} / ${CONFIG.totalPages}`;

    const progressBase = state.completed ? CONFIG.totalPages : Math.max(state.maxVisited, state.page);
    const percent = Math.round((progressBase / CONFIG.totalPages) * 100);
    progressBar.style.width = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', String(percent));
    progressText.textContent = state.completed ? 'Заняття завершено' : `Розділ ${state.page} із ${CONFIG.totalPages}`;
    progressPercent.textContent = `${percent}%`;

    prevButton.disabled = state.page === 1;
    nextButton.disabled = !isNextAllowed();
    nextButton.textContent = state.page === CONFIG.finalPage ? 'Заняття завершено' : 'Наступний розділ ➡️';

    const newHash = `#page-${state.page}`;
    if (window.location.hash !== newHash) history.replaceState(null, '', newHash);
    saveNavigation();
  }

  function goToPage(page, { focus = true, announcePage = true } = {}) {
    const target = clampPage(page);
    if (target > CONFIG.interactivePage && !state.interactiveComplete) {
      state.page = CONFIG.interactivePage;
      announce('Спочатку правильно завершіть завдання з трьома ситуаціями.');
    } else if (target > CONFIG.assessmentPage && !state.testComplete) {
      state.page = CONFIG.assessmentPage;
      announce('Спочатку правильно завершіть підсумковий тест.');
    } else {
      state.page = target;
    }
    state.maxVisited = Math.max(state.maxVisited, state.page);
    if (state.page === CONFIG.finalPage && state.testComplete) {
      state.completed = true;
      writeStorage(KEYS.completed, true);
    }
    updateNavigation();
    if (focus) {
      const active = document.querySelector('.lesson-page.is-active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => active?.focus({ preventScroll: true }), 120);
    }
    if (announcePage) announce(`Відкрито розділ: ${pageLabel.textContent}.`);
  }

  prevButton.addEventListener('click', () => goToPage(state.page - 1));
  nextButton.addEventListener('click', () => {
    if (state.page === CONFIG.finalPage) return;
    if (!isNextAllowed()) {
      announce(state.page === CONFIG.interactivePage ? 'Завершіть завдання перед переходом.' : 'Завершіть підсумковий тест перед переходом.');
      return;
    }
    goToPage(state.page + 1);
  });

  window.addEventListener('hashchange', () => {
    const match = /^#page-(\d+)$/.exec(window.location.hash);
    if (match) goToPage(Number(match[1]), { focus: false, announcePage: false });
  });

  resetProgressButton.addEventListener('click', () => {
    const approved = window.confirm('Почати заняття спочатку? Буде очищено прогрес, відповіді у завданні та підсумковому тесті. Картка кліматично нейтральної візії громади залишиться збереженою.');
    if (!approved) return;
    [KEYS.navigation, KEYS.interactive, KEYS.test, KEYS.completed].forEach(removeStorage);
    state.page = 1;
    state.maxVisited = 1;
    state.interactiveComplete = false;
    state.testComplete = false;
    state.completed = false;
    resetInteractiveUI();
    resetTestUI();
    goToPage(1, { announcePage: false });
    announce('Прогрес і відповіді очищено. Картку збережено.');
  });

  // Interactive component
  const interactivePanels = [...document.querySelectorAll('.interactive-panel')];
  const interactiveGateNote = document.getElementById('interactive-gate-note');
  const interactiveAnswers = { 1: 'B', 2: 'C', 3: 'D' };
  const interactiveFeedback = {
    1: 'Основна концепція — NBS. Кліматична стійкість підтримує логіку цього рішення.',
    2: 'Основна концепція — циркулярна економіка: рішення змінює ресурсну та життєву логіку закупівель.',
    3: 'Основна концепція — city vision: рішення задає напрям і критерії майбутніх дій.'
  };

  function showInteractivePanel(id) {
    interactivePanels.forEach((panel) => panel.classList.toggle('is-visible', panel.id === id));
    const visible = document.getElementById(id);
    visible?.querySelector('button, input')?.focus();
  }

  function persistInteractive() {
    const answers = {};
    [1,2,3].forEach((n) => {
      answers[n] = document.querySelector(`input[name="scenario-${n}"]:checked`)?.value || '';
    });
    writeStorage(KEYS.interactive, { answers, complete: state.interactiveComplete });
  }

  function restoreInteractive() {
    const stored = readStorage(KEYS.interactive, { answers: {}, complete: false });
    state.interactiveComplete = Boolean(stored.complete);
    Object.entries(stored.answers || {}).forEach(([n, value]) => {
      const input = document.querySelector(`input[name="scenario-${n}"][value="${value}"]`);
      if (input) input.checked = true;
    });
    if (state.interactiveComplete) {
      [1,2,3].forEach((n) => {
        const feedback = document.getElementById(`scenario-feedback-${n}`);
        const next = document.querySelector(`.scenario-next[data-next="${n === 3 ? 'summary' : n + 1}"]`);
        feedback.textContent = interactiveFeedback[n];
        feedback.className = 'feedback is-success';
        if (next) next.hidden = false;
      });
      interactiveGateNote.textContent = 'Завдання завершено. Перехід до наступного розділу відкрито.';
      interactiveGateNote.classList.add('is-complete');
    }
  }

  function resetInteractiveUI() {
    document.querySelectorAll('#interactive input[type="radio"]').forEach((input) => { input.checked = false; });
    document.querySelectorAll('#interactive .feedback').forEach((node) => { node.textContent = ''; node.className = 'feedback'; });
    document.querySelectorAll('#interactive .scenario-next').forEach((button) => { button.hidden = true; });
    showInteractivePanel('interactive-start');
    interactiveGateNote.textContent = 'Щоб перейти далі, правильно завершіть усі три ситуації.';
    interactiveGateNote.classList.remove('is-complete');
    nextButton.disabled = state.page === CONFIG.interactivePage;
  }

  document.getElementById('interactive-start-button').addEventListener('click', () => showInteractivePanel('scenario-step-1'));
  document.querySelectorAll('.scenario-check').forEach((button) => {
    button.addEventListener('click', () => {
      const n = Number(button.dataset.scenario);
      const selected = document.querySelector(`input[name="scenario-${n}"]:checked`)?.value;
      const feedback = document.getElementById(`scenario-feedback-${n}`);
      const next = button.parentElement.querySelector('.scenario-next');
      if (!selected) {
        feedback.textContent = 'Оберіть одну концепцію.';
        feedback.className = 'feedback is-error';
        return;
      }
      if (selected === interactiveAnswers[n]) {
        feedback.textContent = interactiveFeedback[n];
        feedback.className = 'feedback is-success';
        next.hidden = false;
        if (n === 3) {
          state.interactiveComplete = true;
          interactiveGateNote.textContent = 'Завдання завершено. Перехід до наступного розділу відкрито.';
          interactiveGateNote.classList.add('is-complete');
          updateNavigation();
        }
      } else {
        feedback.textContent = n === 1 && selected === 'A'
          ? 'Кліматична стійкість підтримує рішення, але основна концепція тут — NBS. Спробуйте ще раз.'
          : 'Ця концепція не є основною для описаного рішення. Перегляньте управлінську логіку і спробуйте ще раз.';
        feedback.className = 'feedback is-error';
        next.hidden = true;
      }
      persistInteractive();
    });
  });
  document.querySelectorAll('.scenario-next').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.next;
      showInteractivePanel(target === 'summary' ? 'interactive-summary' : `scenario-step-${target}`);
    });
  });
  document.getElementById('interactive-reset').addEventListener('click', () => {
    state.interactiveComplete = false;
    removeStorage(KEYS.interactive);
    resetInteractiveUI();
    updateNavigation();
  });

  // Portfolio and learner persistence
  const portfolioForm = document.getElementById('portfolio-form');
  const portfolioStatus = document.getElementById('portfolio-status');
  const portfolioFieldNames = ['communityName','mainChallenge','desiredState','resilienceRole','nbsRole','circularLoss','principles','firstSignal'];
  const portfolioLabels = {
    communityName: 'Назва громади',
    mainChallenge: 'Головний кліматичний виклик із попереднього заняття',
    desiredState: 'Якою громадою ми хочемо стати?',
    resilienceRole: 'Що означає кліматична стійкість для цієї візії?',
    nbsRole: 'Яку роль можуть відіграти природоорієнтовані рішення?',
    circularLoss: 'Яку ресурсну втрату має зменшити циркулярна економіка?',
    principles: 'Які 3 принципи мають пройти через майбутні рішення?',
    firstSignal: 'Який перший управлінський сигнал можна дати команді?'
  };

  function getPortfolioData() {
    return Object.fromEntries(portfolioFieldNames.map((name) => [name, portfolioForm.elements[name].value.trim()]));
  }

  function savePortfolio({ announceResult = true } = {}) {
    const data = getPortfolioData();
    const ok = writeStorage(KEYS.portfolio, data);
    if (announceResult) {
      portfolioStatus.textContent = ok ? 'Картку збережено у цьому браузері.' : 'Не вдалося зберегти картку у браузері. Завантажте PDF або скопіюйте відповіді.';
      portfolioStatus.className = ok ? 'form-status is-success' : 'form-status is-error';
    }
    return data;
  }

  function restorePortfolio() {
    const data = readStorage(KEYS.portfolio, {});
    portfolioFieldNames.forEach((name) => {
      if (typeof data[name] === 'string') portfolioForm.elements[name].value = data[name];
    });
  }

  portfolioForm.addEventListener('input', () => savePortfolio({ announceResult: false }));
  portfolioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    savePortfolio();
  });

  document.getElementById('clear-portfolio').addEventListener('click', () => {
    const approved = window.confirm('Очистити всі вісім полів Картки кліматично нейтральної візії громади? Цю дію не можна скасувати.');
    if (!approved) return;
    portfolioForm.reset();
    removeStorage(KEYS.portfolio);
    portfolioStatus.textContent = 'Картку очищено.';
    portfolioStatus.className = 'form-status is-success';
  });

  // Direct local PDF generation using browser canvas rendering and an embedded-image PDF container.
  function wrapText(ctx, text, maxWidth) {
    const paragraphs = String(text || '').split(/\n+/);
    const lines = [];
    paragraphs.forEach((paragraph, pIndex) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) { lines.push(''); return; }
      let line = words.shift();
      words.forEach((word) => {
        const test = `${line} ${word}`;
        if (ctx.measureText(test).width <= maxWidth) line = test;
        else { lines.push(line); line = word; }
      });
      lines.push(line);
      if (pIndex < paragraphs.length - 1) lines.push('');
    });
    return lines;
  }

  function createCanvasPage(pageNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b2d4d';
    ctx.font = '700 28px Arial, sans-serif';
    ctx.fillText('UCAN · Портфель мера', 90, 78);
    ctx.fillStyle = '#52616e';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Сторінка ${pageNumber}`, 1150, 78);
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#d7dee5';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(90, 102); ctx.lineTo(1150, 102); ctx.stroke();
    return { canvas, ctx, y: 150 };
  }

  function renderPortfolioCanvases(data) {
    const pagesOut = [];
    let page = createCanvasPage(1);
    const marginX = 90;
    const maxWidth = 1060;
    const bottom = 1660;

    function finishPage() {
      pagesOut.push(page.canvas);
      page = createCanvasPage(pagesOut.length + 1);
    }

    function drawLines(lines, lineHeight, font, color, gapAfter = 0) {
      page.ctx.font = font;
      page.ctx.fillStyle = color;
      for (const line of lines) {
        if (page.y + lineHeight > bottom) finishPage();
        page.ctx.fillText(line, marginX, page.y);
        page.y += lineHeight;
      }
      page.y += gapAfter;
    }

    page.ctx.fillStyle = '#0b2d4d';
    page.ctx.font = '700 42px Arial, sans-serif';
    const titleLines = wrapText(page.ctx, 'Картка кліматично нейтральної візії громади', maxWidth);
    drawLines(titleLines, 54, '700 42px Arial, sans-serif', '#0b2d4d', 18);
    drawLines(['Це перша чернетка бачення, а не стратегія або план дій.'], 38, '26px Arial, sans-serif', '#52616e', 26);

    for (const name of portfolioFieldNames) {
      page.ctx.font = '700 27px Arial, sans-serif';
      const labelLines = wrapText(page.ctx, portfolioLabels[name], maxWidth);
      const value = data[name] || 'Не заповнено';
      page.ctx.font = '27px Arial, sans-serif';
      const valueLines = wrapText(page.ctx, value, maxWidth - 28);
      const needed = labelLines.length * 38 + valueLines.length * 39 + 54;
      if (page.y + needed > bottom) finishPage();
      drawLines(labelLines, 38, '700 27px Arial, sans-serif', '#0b2d4d', 8);
      page.ctx.fillStyle = '#f5f7f9';
      const boxTop = page.y - 8;
      const boxHeight = Math.max(64, valueLines.length * 39 + 24);
      page.ctx.fillRect(marginX, boxTop, maxWidth, boxHeight);
      page.ctx.strokeStyle = '#d7dee5';
      page.ctx.strokeRect(marginX, boxTop, maxWidth, boxHeight);
      page.y += 18;
      drawLines(valueLines, 39, '27px Arial, sans-serif', '#18232d', 22);
    }
    pagesOut.push(page.canvas);
    return pagesOut;
  }

  function dataUrlToBytes(dataUrl) {
    const binary = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function concatBytes(chunks) {
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((chunk) => { result.set(chunk, offset); offset += chunk.length; });
    return result;
  }

  function buildImagePdf(canvases) {
    const enc = new TextEncoder();
    const images = canvases.map((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      bytes: dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.92))
    }));
    const objectCount = 2 + images.length * 3;
    const offsets = new Array(objectCount + 1).fill(0);
    const chunks = [];
    let length = 0;
    const push = (value) => { const bytes = typeof value === 'string' ? enc.encode(value) : value; chunks.push(bytes); length += bytes.length; };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const addObject = (n, bodyParts) => {
      offsets[n] = length;
      push(`${n} 0 obj\n`);
      bodyParts.forEach(push);
      push('\nendobj\n');
    };
    addObject(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    const kids = images.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    addObject(2, [`<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>`]);
    images.forEach((image, i) => {
      const pageObj = 3 + i * 3;
      const contentObj = pageObj + 1;
      const imageObj = pageObj + 2;
      addObject(pageObj, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageObj} 0 R >> >> /Contents ${contentObj} 0 R >>`]);
      const content = enc.encode('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n');
      addObject(contentObj, [`<< /Length ${content.length} >>\nstream\n`, content, '\nendstream']);
      addObject(imageObj, [`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`, image.bytes, '\nendstream']);
    });
    const xrefOffset = length;
    push(`xref\n0 ${objectCount + 1}\n`);
    push('0000000000 65535 f \n');
    for (let i = 1; i <= objectCount; i += 1) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    return new Blob([concatBytes(chunks)], { type: 'application/pdf' });
  }

  function sanitizedFilenamePart(value) {
    const cleaned = String(value || '').trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'Hromada';
  }

  document.getElementById('download-pdf').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Готуємо PDF…';
    portfolioStatus.textContent = 'Формуємо PDF локально у Вашому браузері.';
    portfolioStatus.className = 'form-status';
    try {
      const data = savePortfolio({ announceResult: false });
      const canvases = renderPortfolioCanvases(data);
      const pdf = buildImagePdf(canvases);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = `UCAN_Kartka_klimatychno_neitralnoi_vizii_${sanitizedFilenamePart(data.communityName)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      portfolioStatus.textContent = 'PDF завантажено. Дані не передавалися назовні.';
      portfolioStatus.className = 'form-status is-success';
    } catch (error) {
      console.error(error);
      portfolioStatus.textContent = 'Не вдалося сформувати PDF. Збережіть картку і повторіть дію у сучасному браузері.';
      portfolioStatus.className = 'form-status is-error';
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });

  // AI prompt UX
  const promptDialog = document.getElementById('prompt-dialog');
  const promptPreview = document.getElementById('prompt-preview');
  const copyStatus = document.getElementById('copy-status');
  const dialogCopyStatus = document.getElementById('dialog-copy-status');
  let promptInvoker = null;

  function buildPrompt() {
    const data = savePortfolio({ announceResult: false });
    const lines = [
      'Допоможіть управлінській команді громади перевірити чернетку кліматично нейтральної візії.',
      'Не вигадуйте фактів про громаду і не переписуйте роботу замість учасника.',
      'Проаналізуйте повноту, сильні сторони, слабкі місця та відсутні зв’язки між викликом, кліматичною стійкістю, природоорієнтованими рішеннями і циркулярною економікою.',
      'Дайте структурований feedback простою управлінською мовою.',
      ''
    ];
    portfolioFieldNames.forEach((name) => lines.push(`${portfolioLabels[name]}: ${data[name] || '[не заповнено]'}`));
    return lines.join('\n');
  }

  async function copyText(text, statusNode) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        if (!ok) throw new Error('copy failed');
      }
      statusNode.textContent = 'Скопійовано';
      statusNode.className = 'form-status is-success';
      return true;
    } catch (_) {
      statusNode.textContent = 'Не вдалося скопіювати автоматично. Відкрийте перегляд і скопіюйте текст вручну.';
      statusNode.className = 'form-status is-error';
      return false;
    }
  }

  document.getElementById('preview-prompt').addEventListener('click', (event) => {
    promptInvoker = event.currentTarget;
    promptPreview.value = buildPrompt();
    dialogCopyStatus.textContent = '';
    dialogCopyStatus.className = 'form-status';
    if (typeof promptDialog.showModal === 'function') promptDialog.showModal();
    else {
      promptDialog.setAttribute('open', '');
      promptDialog.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.setTimeout(() => promptPreview.focus(), 50);
  });
  promptDialog.addEventListener('close', () => promptInvoker?.focus());
  document.getElementById('copy-prompt').addEventListener('click', () => copyText(buildPrompt(), copyStatus));
  document.getElementById('copy-from-dialog').addEventListener('click', () => copyText(promptPreview.value, dialogCopyStatus));

  // Final test
  const testForm = document.getElementById('final-test');
  const testResult = document.getElementById('test-result');
  const testGateNote = document.getElementById('test-gate-note');
  const testAnswers = { q1: 'B', q2: 'C', q3: 'B', q4: 'C', q5: 'C' };
  const explanations = {
    q1: 'Стійкість означає здатність громади підтримувати послуги й якість життя попри ризики, а не лише реагувати після аварій.',
    q2: 'NBS мають управлінську цінність тоді, коли працюють як частина інфраструктури та зменшують ризики.',
    q3: 'Циркулярність пов’язує ресурси, витрати, відновлення, закупівлі та місцеву економіку.',
    q4: 'Візія має допомагати приймати рішення, а не бути лише лозунгом або списком проєктів.',
    q5: 'Мер має перевірити управлінську логіку рішення: проблема, вплив, відповідальність, бюджет і зв’язок із візією.'
  };

  function getTestSelections() {
    return Object.fromEntries(Object.keys(testAnswers).map((name) => [name, testForm.elements[name].value || '']));
  }

  function persistTest() {
    writeStorage(KEYS.test, { selections: getTestSelections(), complete: state.testComplete });
  }

  function restoreTest() {
    const stored = readStorage(KEYS.test, { selections: {}, complete: false });
    state.testComplete = Boolean(stored.complete);
    Object.entries(stored.selections || {}).forEach(([name, value]) => {
      const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    });
    if (state.testComplete) {
      testResult.textContent = 'Усі відповіді правильні. Підсумковий розділ відкрито.';
      testResult.className = 'test-result is-success';
      testGateNote.textContent = 'Підсумковий тест завершено. Перехід до підсумку відкрито.';
      testGateNote.classList.add('is-complete');
      Object.keys(testAnswers).forEach((name) => {
        const feedback = document.getElementById(`${name}-feedback`);
        feedback.textContent = explanations[name];
        feedback.className = 'question-feedback is-success';
      });
    }
  }

  function resetTestUI() {
    testForm.reset();
    document.querySelectorAll('.question-feedback').forEach((node) => { node.textContent = ''; node.className = 'question-feedback'; });
    testResult.textContent = '';
    testResult.className = 'test-result';
    testGateNote.textContent = 'Щоб перейти до підсумку, правильно дайте відповідь на всі п’ять запитань.';
    testGateNote.classList.remove('is-complete');
  }

  testForm.addEventListener('change', persistTest);
  testForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const selections = getTestSelections();
    const missing = Object.values(selections).filter((value) => !value).length;
    if (missing) {
      testResult.textContent = `Дайте відповідь на всі запитання. Залишилося: ${missing}.`;
      testResult.className = 'test-result is-error';
      return;
    }
    let correct = 0;
    Object.keys(testAnswers).forEach((name) => {
      const isCorrect = selections[name] === testAnswers[name];
      if (isCorrect) correct += 1;
      const feedback = document.getElementById(`${name}-feedback`);
      feedback.textContent = explanations[name];
      feedback.className = isCorrect ? 'question-feedback is-success' : 'question-feedback is-error';
    });
    state.testComplete = correct === Object.keys(testAnswers).length;
    if (state.testComplete) {
      testResult.textContent = 'Усі відповіді правильні. Підсумковий розділ відкрито.';
      testResult.className = 'test-result is-success';
      testGateNote.textContent = 'Підсумковий тест завершено. Перехід до підсумку відкрито.';
      testGateNote.classList.add('is-complete');
      announce('Підсумковий тест завершено.');
    } else {
      testResult.textContent = `Правильних відповідей: ${correct} із 5. Перегляньте пояснення і спробуйте ще раз.`;
      testResult.className = 'test-result is-error';
      testGateNote.textContent = 'Щоб перейти до підсумку, правильно дайте відповідь на всі п’ять запитань.';
      testGateNote.classList.remove('is-complete');
    }
    persistTest();
    updateNavigation();
  });

  // Initialization order preserves learner work before AI prompt generation.
  restoreState();
  restorePortfolio();
  restoreInteractive();
  restoreTest();
  updateNavigation();
  goToPage(state.page, { focus: false, announcePage: false });
})();
