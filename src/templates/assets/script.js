(() => {
  const el = document.getElementById('paste-data');
  if (!el) return;
  const MD = JSON.parse(el.textContent);

  const $content = document.getElementById('content');
  const $raw = document.getElementById('raw');
  const $rawBtn = document.getElementById('raw-btn');
  const $copyBtn = document.getElementById('copy-all-btn');

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function hl(code, lang) {
    if (typeof hljs === 'undefined') return esc(code);
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
    return hljs.highlightAuto(code).value;
  }

  const renderer = new marked.Renderer();
  renderer.code = function({ text, lang }) {
    const label = lang || 'text';
    return '<pre><div class="code-header"><span class="code-lang">' + esc(label)
      + '</span><button class="copy-btn" aria-label="Copy code">Copy</button></div><code class="hljs">'
      + hl(text, lang) + '</code></pre>';
  };

  marked.setOptions({ gfm: true, breaks: true, renderer });
  $content.innerHTML = marked.parse(MD);
  $raw.textContent = MD;

  const copyIcon = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';

  function flashCopy(btn, isIcon) {
    const orig = isIcon ? null : btn.textContent;
    btn.innerHTML = isIcon ? checkIcon : '';
    if (!isIcon) btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      if (isIcon) btn.innerHTML = copyIcon;
      else btn.textContent = orig;
      btn.classList.remove('copied');
    }, 1500);
  }

  $content.addEventListener('click', e => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const code = btn.closest('pre').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => flashCopy(btn, false));
  });

  $copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(MD).then(() => flashCopy($copyBtn, true));
  });

  let rawVisible = false;
  $rawBtn.addEventListener('click', () => {
    rawVisible = !rawVisible;
    $raw.style.display = rawVisible ? 'block' : 'none';
    $content.style.display = rawVisible ? 'none' : '';
    $copyBtn.style.display = rawVisible ? 'inline-flex' : 'none';
    $rawBtn.textContent = rawVisible ? 'Rendered' : 'Raw';
  });
})();
