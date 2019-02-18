

window.oe_navigate_to = function (path, state) {
    var subPath = window.OEUtils.subPath || '';
    var newPath = path;
    if (subPath && newPath.startsWith('/')) {
        newPath = subPath + newPath;
    }
    window.history.pushState(state, undefined, newPath);
    function fire(type, detail, options) {
        options = options || {};
        detail = (detail === null || detail === undefined) ? {} : detail;
        let event = new Event(type, {
            bubbles: options.bubbles === undefined ? true : options.bubbles,
            cancelable: Boolean(options.cancelable),
            composed: options.composed === undefined ? true : options.composed
        });
        event.detail = detail;
        let node = options.node || this;
        node.dispatchEvent(event);
        return event;
    }
    fire('location-changed', state, {
        node: window
    });
};

/*
 * Elements caling pagejs' page(url) function to navigate
 * should continue to work as it is.
 */
window.page = function (path) {
    console.warn('page(...) call is depricated. Please use oe_navigate_to(...) instead.');
    window.oe_navigate_to(path);
};

window.decodeURLEncodedURIComponent = function (val) {
    if (typeof val !== 'string') {
        return val;
    }
    return window.decodeURIComponent(val.replace(/\+/g, ' '));
};

