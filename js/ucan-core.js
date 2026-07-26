(() => {
  'use strict';

  const dialogRegistry = new WeakMap();
  const notificationClasses = ['is-success', 'is-warning', 'is-info', 'is-error', 'is-loading'];
  const focusableSelector = [
    'a[href]', 'area[href]', 'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
    'textarea:not([disabled])', '[contenteditable="true"]', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const storage = {
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

  function sanitizeFilename(value) {
    const cleaned = String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    return cleaned || '';
  }

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

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('Clipboard copy failed');
    return true;
  }

  function notify(target, type, message, options = {}) {
    if (!target) return null;
    const normalizedType = ['success', 'warning', 'info', 'error', 'loading'].includes(type) ? type : 'info';
    target.classList.remove('feedback', 'is-correct', 'is-incorrect', ...notificationClasses);
    target.classList.add('ucan-notification', `is-${normalizedType}`);
    target.hidden = false;
    target.textContent = message;
    const urgent = normalizedType === 'error' || normalizedType === 'warning';
    target.setAttribute('role', urgent ? 'alert' : 'status');
    target.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
    target.setAttribute('aria-atomic', 'true');
    if (options.focus === true) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    if (Number.isFinite(options.timeout) && options.timeout > 0) {
      window.setTimeout(() => {
        if (target.textContent === message) {
          target.textContent = '';
          target.classList.remove(`is-${normalizedType}`);
          target.hidden = true;
        }
      }, options.timeout);
    }
    return target;
  }

  function announce(type, message, options = {}) {
    const region = document.getElementById('ucan-notification-region');
    if (!region) return null;
    const item = document.createElement('div');
    item.className = 'ucan-notification-toast';
    region.appendChild(item);
    notify(item, type, message, options);
    const timeout = Number.isFinite(options.timeout) ? options.timeout : 5000;
    if (timeout > 0) window.setTimeout(() => item.remove(), timeout + 50);
    return item;
  }

  function setActionState(button, state, labels = {}) {
    if (!button) return;
    const idleLabel = labels.idle || button.dataset.idleLabel || button.textContent;
    if (!button.dataset.idleLabel) button.dataset.idleLabel = idleLabel;
    const stateLabels = {
      idle: idleLabel,
      loading: labels.loading || 'Обробка…',
      success: labels.success || idleLabel,
      warning: labels.warning || idleLabel,
      error: labels.error || idleLabel
    };
    button.classList.remove('is-loading', 'is-success', 'is-warning', 'is-error');
    if (state !== 'idle') button.classList.add(`is-${state}`);
    button.disabled = state === 'loading';
    if (state === 'loading') button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
    button.textContent = stateLabels[state] || idleLabel;
  }

  function serializeForm(form) {
    if (!form) return {};
    const result = {};
    [...form.elements].forEach((field) => {
      if (!field.name || field.disabled) return;
      if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return;
      result[field.name] = field.value;
    });
    return result;
  }

  function restoreForm(form, data) {
    if (!form || !data || typeof data !== 'object') return 0;
    let restored = 0;
    [...form.elements].forEach((field) => {
      if (!field.name || typeof data[field.name] !== 'string') return;
      field.value = data[field.name];
      restored += 1;
    });
    return restored;
  }

  function formHasContent(form) {
    if (!form) return false;
    return [...form.elements].some((field) => {
      if (!field.name || field.disabled) return false;
      if (field.type === 'checkbox' || field.type === 'radio') return field.checked;
      return typeof field.value === 'string' && field.value.trim();
    });
  }

  function visibleFocusable(dialog) {
    return [...dialog.querySelectorAll(focusableSelector)].filter((element) => {
      const style = window.getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none' && !element.hasAttribute('hidden');
    });
  }

  function registerDialog(dialog, options = {}) {
    if (!dialog || dialogRegistry.has(dialog)) return dialog;
    const state = { invoker: null, options };
    dialogRegistry.set(dialog, state);

    dialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
      button.addEventListener('click', () => closeDialog(dialog, 'button'));
    });

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      if (options.closeOnEscape === false) return;
      closeDialog(dialog, 'escape');
    });

    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog || options.closeOnOverlay === false) return;
      closeDialog(dialog, 'overlay');
    });

    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || !dialog.open) return;
      const elements = visibleFocusable(dialog);
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    dialog.addEventListener('close', () => {
      const current = dialogRegistry.get(dialog);
      const returnTarget = current?.invoker || current?.options?.returnFocus;
      if (returnTarget && typeof returnTarget.focus === 'function' && returnTarget.isConnected) {
        returnTarget.focus({ preventScroll: true });
      }
      if (typeof current?.options?.onClose === 'function') current.options.onClose();
      if (current) current.invoker = null;
    });
    return dialog;
  }

  function openDialog(dialog, options = {}) {
    if (!dialog) return false;
    registerDialog(dialog, options.registration || {});
    const state = dialogRegistry.get(dialog);
    state.invoker = options.invoker || document.activeElement;
    if (!dialog.open) dialog.showModal();
    const initial = options.initialFocus || state.options.initialFocus || visibleFocusable(dialog)[0] || dialog;
    if (!dialog.hasAttribute('tabindex') && initial === dialog) dialog.setAttribute('tabindex', '-1');
    window.requestAnimationFrame(() => initial?.focus?.({ preventScroll: true }));
    return true;
  }

  function closeDialog(dialog, reason = 'programmatic') {
    if (!dialog?.open) return false;
    const state = dialogRegistry.get(dialog);
    if (typeof state?.options?.beforeClose === 'function' && state.options.beforeClose(reason) === false) return false;
    dialog.close(reason);
    return true;
  }

  function initImageViewer({ dialog, image, caption, closeButton, triggers }) {
    if (!dialog || !image || !caption) return null;
    registerDialog(dialog, { initialFocus: closeButton, closeOnOverlay: true, closeOnEscape: true });
    [...triggers].forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const sourceImage = trigger.querySelector('img');
        image.src = trigger.dataset.imageSrc || sourceImage?.src || '';
        image.alt = sourceImage?.alt || '';
        caption.textContent = trigger.dataset.imageCaption || sourceImage?.alt || '';
        openDialog(dialog, { invoker: trigger, initialFocus: closeButton });
      });
    });
    return dialog;
  }

  function createPortfolioPrintHtml({ title, label = 'Портфель мера', filename, fields, data, note }) {
    const documentTitle = String(filename || title || 'UCAN Portfolio').replace(/\.pdf$/i, '').trim() || 'UCAN Portfolio';
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
    @media screen { body { max-width: 210mm; margin: 0 auto; padding: 17mm; box-shadow: 0 0 18px rgba(0,0,0,.12); } }
    @media print { html, body { background: #ffffff; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
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

  async function printPortfolioHtml(html) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Підготовка локального PDF');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '1px', height: '1px', border: '0', opacity: '0', pointerEvents: 'none' });
    document.body.appendChild(iframe);
    const printWindow = iframe.contentWindow;
    const printDocument = iframe.contentDocument || printWindow?.document;
    if (!printWindow || !printDocument) {
      iframe.remove();
      throw new Error('Print document could not be created');
    }
    printDocument.open();
    printDocument.write(html);
    printDocument.close();
    if (printDocument.fonts?.ready) {
      try { await printDocument.fonts.ready; } catch (error) { /* Browser fallback is acceptable. */ }
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    let removed = false;
    const cleanup = () => { if (!removed) { removed = true; iframe.remove(); } };
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 60000);
    printWindow.focus();
    printWindow.print();
  }

  async function downloadPortfolioPdf({ button, status, title, label, filename, fields, data, note }) {
    if (!button) throw new Error('PDF button is required');
    const original = button.textContent;
    setActionState(button, 'loading', { idle: original, loading: 'Підготовка PDF…' });
    notify(status, 'info', 'У вікні браузера оберіть «Зберегти як PDF».');
    announce('info', 'У вікні браузера оберіть «Зберегти як PDF».');
    try {
      const html = createPortfolioPrintHtml({ title, label, filename, fields, data, note });
      await printPortfolioHtml(html);
      notify(status, 'success', 'Відкрито системний діалог. У вікні браузера оберіть «Зберегти як PDF». Дані залишаються у Вашому браузері.');
    } catch (error) {
      console.error('Portfolio PDF generation failed', error);
      notify(status, 'error', 'Не вдалося підготувати PDF. Перевірте налаштування друку браузера та спробуйте ще раз.');
      throw error;
    } finally {
      setActionState(button, 'idle', { idle: original });
    }
  }

  const Core = Object.freeze({
    version: '0.1-pilot', storage, sanitizeFilename, copyText, notify, announce,
    setActionState, serializeForm, restoreForm, formHasContent,
    registerDialog, openDialog, closeDialog, initImageViewer,
    createPortfolioPrintHtml, downloadPortfolioPdf
  });
  window.UCANCore = Core;
  window.UCANInterface = Core;
})();
