import {getLanguage, setLanguage, translate, onLanguageChange} from './i18n.js';
import './language-ui.css';

// Keep source text separately so toggling languages never rewrites saved character data.
export function installLanguageUI() {
  let saved;
  try { saved = localStorage.getItem('moyu.language.v1'); } catch {}
  const param = new URLSearchParams(location.search).get('lang');
  setLanguage(param || saved || 'zh');
  const sources = new WeakMap();
  const brand = document.querySelector('.brand-row h1');
  if (brand) brand.dataset.noTranslate = 'true';
  const switcher = document.createElement('button');
  switcher.type = 'button'; switcher.className = 'language-switch'; switcher.dataset.noTranslate = 'true';
  switcher.setAttribute('aria-label', 'Choose language / 选择语言');
  document.getElementById('app').append(switcher);
  let scheduled = false;
  function original(object, field, current) {
    let fields = sources.get(object);
    if (!fields) { fields = new Map(); sources.set(object, fields); }
    const old = fields.get(field);
    const source = old && old.rendered === current ? old.source : current;
    const rendered = translate(source);
    fields.set(field, {source, rendered});
    return rendered;
  }
  function update() {
    scheduled = false;
    const lang = getLanguage(); document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    const switchLabel = lang === 'en' ? '中文' : 'English';
    if (switcher.textContent !== switchLabel) switcher.textContent = switchLabel;
    if (brand) {
      const first = lang === 'en' ? 'Office ' : '摸鱼', second = lang === 'en' ? 'Escape' : '事务所';
      if (brand.firstChild.nodeValue !== first) brand.firstChild.nodeValue = first;
      if (brand.querySelector('span').textContent !== second) brand.querySelector('span').textContent = second;
    }
    document.title = lang === 'en' ? 'Office Escape · Tap, Treat & Chat' : '摸鱼事务所 · 敲走怨气，喂点快乐';
    const walker = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('[data-no-translate],script,style,input,textarea,.from-player:not(.is-action)')) continue;
      const next = original(node, 'text', node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    for (const element of document.querySelectorAll('#app [aria-label],#app [placeholder],#app [title],#app [alt]')) {
      if (element.closest('[data-no-translate]')) continue;
      for (const attr of ['aria-label', 'placeholder', 'title', 'alt']) if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr), next = original(element, attr, value);
        if (value !== next) element.setAttribute(attr, next);
      }
    }
  }
  const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; queueMicrotask(update); } });
  observer.observe(document.getElementById('app'), {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'placeholder', 'title', 'alt']});
  switcher.onclick = () => {
    setLanguage(getLanguage() === 'en' ? 'zh' : 'en');
    try { localStorage.setItem('moyu.language.v1', getLanguage()); } catch {}
    const url = new URL(location.href); url.searchParams.set('lang', getLanguage()); history.replaceState(null, '', url);
  };
  onLanguageChange(update); update();
}
