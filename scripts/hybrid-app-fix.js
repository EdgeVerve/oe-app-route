// iron-location is not raising event in case of mobile app as URL constructor does not return origin property properly.
// https://github.com/PolymerElements/iron-location/issues/59
var ilocation = window.customElements.get('iron-location');
import { DomApi } from "@polymer/polymer/lib/legacy/polymer.dom";

if (ilocation) {
  ilocation.constructor.prototype._getSameOriginLinkHref = function (event) {
    if (event.button !== 0) {
      return null;
    }
    if (event.metaKey || event.ctrlKey) {
      return null;
    }
    var eventPath = (new DomApi(event)).path;
    var anchor = null;
    for (var i = 0; i < eventPath.length; i++) {
      var element = eventPath[i];
      if (element.tagName === 'A' && element.href) {
        anchor = element;
        break;
      }
    }

    // If there's no link there's nothing to do.
    if (!anchor) {
      return null;
    }

    // Target blank is a new tab, don't intercept.
    if (anchor.target === '_blank') {
      return null;
    }
    // If the link is for an existing parent frame, don't intercept.
    if ((anchor.target === '_top' ||
        anchor.target === '_parent') &&
      window.top !== window) {
      return null;
    }

    var href = anchor.href;

    // It only makes sense for us to intercept same-origin navigations.
    // pushState/replaceState don't work with cross-origin links.
    var url;
    if (document.baseURI !== null) {

      /** @type {string} */
      url = new URL(href, (document.baseURI));
    } else {
      url = new URL(href);
    }

    var origin;

    // IE Polyfill
    if (window.location.origin) {
      origin = window.location.origin;
    } else {
      origin = window.location.protocol + '//' + window.location.hostname;

      if (window.location.port) {
        origin += ':' + window.location.port;
      }
    }

    if (url._scheme === 'file' && origin === 'file://') { // eslint-disable-line

    } else if (url.origin !== origin) {
      return null;
    }

    var normalizedHref = url.pathname + url.search + url.hash;

    // If we've been configured not to handle this url... don't handle it!
    if (this._urlSpaceRegExp &&
      !this._urlSpaceRegExp.test(normalizedHref)) {
      return null;
    }
    // Need to use a full URL in case the containing page has a base URI.
    var fullNormalizedHref = new URL(
      normalizedHref, window.location.href).href;
    return fullNormalizedHref;
  };
}
