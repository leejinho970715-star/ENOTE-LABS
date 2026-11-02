export function mountLegalDialogs() {
  const dialogs = [...document.querySelectorAll('.legal-dialog')];
  let opener = null;
  function open(id, button) {
    const dialog = dialogs.find(el => el.id === `legal-${id}`);
    if (!dialog) return;
    if (typeof dialog.showModal !== 'function') {
      location.assign(`/legal/${id}/`);
      return;
    }
    if (dialog.open) return;
    dialogs.forEach(other => { if (other.open) other.close(); });
    opener = button || document.activeElement;
    dialog.showModal();
    document.documentElement.classList.add('legal-modal-open');
    dialog.querySelector('.legal-scroll').scrollTop = 0;
    dialog.querySelector('[data-legal-close]').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-legal]').forEach(button =>
    button.addEventListener('click', () => open(button.dataset.legal, button)));
  dialogs.forEach(dialog => {
    dialog.querySelector('[data-legal-close]').addEventListener('click', () => dialog.close());
    // Keep tab order inside the document, rather than moving into browser chrome.
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const targets = [...dialog.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')];
      const first = targets[0], last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    // Native <dialog> provides Escape dismissal and makes the background inert.
    dialog.addEventListener('close', () => {
      if (!dialogs.some(el => el.open)) document.documentElement.classList.remove('legal-modal-open');
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({preventScroll:true});
    });
  });
}
