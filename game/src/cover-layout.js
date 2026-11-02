// Source rectangles preserve the supplied artwork; controls use its coordinates.
const controls = {
  zh: [[.08,.721,.405,.10],[.525,.721,.40,.10],[.143,.845,.21,.074],[.40,.845,.21,.074],[.65,.845,.21,.074]],
  en: [[34/695,798/1024,316/695,106/1024],[368/695,798/1024,295/695,106/1024],
    [96/695,925/1024,153/695,67/1024],[271/695,925/1024,162/695,67/1024],[454/695,925/1024,150/695,67/1024]]
};
export function coverLayout(language) {
  const english = language === 'en';
  return {
    image: english ? '/backgrounds/office-escape-en-reference.jpg' : '/backgrounds/moyu-office-cover-v2.png',
    sourceWidth: english ? 1536 : 941, sourceHeight: english ? 1024 : 1672,
    width: english ? 695 : 941, height: english ? 1024 : 1672,
    controls: controls[english ? 'en' : 'zh'],
    language: english ? [525/695,20/1024,157/695,55/1024] : [.75,.012,.23,.045]
  };
}
