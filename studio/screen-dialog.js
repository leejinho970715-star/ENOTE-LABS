export function mountScreenDialog() {
  const dialog = document.querySelector('#screen-dialog');
  if (!dialog) return;
  const image = dialog.querySelector('img'), title = dialog.querySelector('h2');
  const error = dialog.querySelector('[data-screen-error]');
  let opener = null;
  const close = () => dialog.close();
  document.querySelectorAll('.screen-original,[data-screen-preview]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      opener = link;
      const panel = link.closest('[data-product-panel]');
      const label = panel?.querySelector('.product-label')?.textContent.split(' / ')[1] || 'Flownote · ERP';
      title.textContent = label + ' 화면';
      image.alt = label + ' 가상 샘플 화면 캡처. 이미지를 클릭하면 닫힙니다.';
      error.hidden = true;
      image.hidden = false;
      image.src = link.href;
      dialog.showModal();
      document.documentElement.classList.add('screen-modal-open');
      dialog.querySelector('[data-screen-close]').focus({preventScroll:true});
    });
  });
  image.addEventListener('error', () => { image.hidden = true; error.hidden = false; });
  dialog.querySelectorAll('[data-screen-close]').forEach(button => button.addEventListener('click', close));
  // A click on the native backdrop targets the dialog, outside its rectangle.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button')];
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('screen-modal-open');
    if (opener?.isConnected) opener.focus({preventScroll:true});
  });
}
