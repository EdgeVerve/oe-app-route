import './oe-app-route.js';

var OeAppRoute = window.customElements.get('oe-app-route');

class OeAppRouteWp extends OeAppRoute {
  static get is() {
    return 'oe-app-route-wp';
  }

  importScreen(url) {
    if (typeof __webpack_require__ === 'undefined') {
      /* Perform normal import when running non-webpack build */
      return super.importScreen(url);
    } else {
      if (url.startsWith('/srcgen/')) {
        url = url.replace('/srcgen/', '');
        return import(
          /* webpackInclude: /\.js$/ */
          /* webpackChunkName: "dynamic-screens" */
          /* webpackMode: "eager" */
          '../../srcgen/' + url);
      } else if (url.startsWith('/src/')) {
        url = url.replace('/src/', '');
        return import(
          /* webpackInclude: /\.js$/ */
          /* webpackChunkName: "static-screens" */
          /* webpackMode: "eager" */
          '../../src/' + url);
      }
    }
  }
}

window.customElements.define('oe-app-route-wp', OeAppRouteWp);