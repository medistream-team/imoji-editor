export function loadJs(url) {
  const _script = document.createElement('script');
  _script.setAttribute('type', 'text/javascript');
  _script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(_script);
}

export function loadCss(url) {
  const _link = document.createElement('link');
  _link.setAttribute('rel', 'stylesheet');
  _link.setAttribute('href', url);
  document.getElementsByTagName('head')[0].appendChild(_link);
}
