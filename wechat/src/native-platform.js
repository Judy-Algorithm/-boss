// These are lexical adapters injected into Three.js at build time, not browser globals.
export const self = {URL: {}, requestAnimationFrame: cb => requestAnimationFrame(cb), cancelAnimationFrame: id => cancelAnimationFrame(id)};
export const document = {
  createElement: kind => {
    if (kind !== 'canvas') throw Error(`Unsupported native element: ${kind}`);
    const canvas = wx.createCanvas(); canvas.width = 16; canvas.height = 16; return canvas;
  },
  createElementNS: (ns, kind) => document.createElement(kind)
};
export class TextDecoder {
  decode(input = new Uint8Array()) {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    let encoded = '';
    for (let i = 0; i < bytes.length; i++) encoded += '%' + bytes[i].toString(16).padStart(2, '0');
    return decodeURIComponent(encoded);
  }
}
export class AbortController {
  constructor() {
    const listeners = new Set();
    this.signal = {aborted: false, reason: undefined,
      addEventListener: (type, callback) => { if (type === 'abort') listeners.add(callback); },
      removeEventListener: (type, callback) => listeners.delete(callback),
      throwIfAborted() { if (this.aborted) throw this.reason; }};
    this.abort = (reason = Error('Aborted')) => {
      if (this.signal.aborted) return;
      this.signal.aborted = true; this.signal.reason = reason;
      for (const callback of listeners) callback({type: 'abort', target: this.signal}); listeners.clear();
    };
  }
}
