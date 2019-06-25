/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */

import { html, PolymerElement } from "@polymer/polymer/polymer-element.js";
import { DomApi, flush } from "@polymer/polymer/lib/legacy/polymer.dom.js";
import { OECommonMixin } from "oe-mixins/oe-common-mixin.js";
import "@polymer/iron-location/iron-location.js";
import "oe-ajax/oe-ajax.js";
import "oe-utils/oe-utils.js";
import "./scripts/pathtoregexp.js";
import "./scripts/navigation-utils.js";
import "./scripts/hybrid-app-fix.js";

var OEUtils = window.OEUtils || {};
/**
 * # oe-app-route
 * The `oe-app-route` element can be used to auto configure, application level client side routing.
 * 
 * ```html
 *         <app-location route="{{route}}"></app-location>
 *         <oe-app-route route="{{route}}" config-url="/data/UIRoutes.json">
 *             <iron-pages route-target>
 *             </iron-pages>
 *         </oe-app-route>
 * ```
 * OR
 * ```html
 *         <app-location route="{{route}}"></app-location>
 *         <oe-app-route route="{{route}}" config-url="/api/UIRoutes">
 *         </oe-app-route>
 *         <iron-pages route-target>
 *         </iron-pages>
 * ```
 * 
 * ### Route Configuration
 * 
 * config-url should return array of routes, each route object can have following properties
 * 
 * Property |              Description      | Default
 * ---------|-------------------------------|----------
 * `name`   | route name                    |
 * `path`   | relative url along with placeholders e.g. /customer/:id |
 * `type`   | refer section on [type and import Properties](#type-and-import-properties)        |
 * `import` | refer section on [type and import Properties](#type-and-import-properties)              |
 * 
 * e.g.
 * 
 *     [{
 *         "type": "page",
 *         "name": "receipts",
 *         "path": "/receipts",
 *         "import": "receipts-partial.html"
 *     },
 *     {
 *         "type": "elem",
 *         "name": "cfe-loan-details",
 *         "path": "/loan",
 *         "import": "../business/cfe-loan-details.js"
 *     }]
 * 
 * #### *type* and *import* Properties
 * 
 * > The *type* property can have following values:
 * >
 * > - **page** : When route type is specified as page, the html data from *import* is fetched and added as innerHtml of target element.
 * >  - If the *path* argument has any placeholders (e.g. execute/:modelName/:action) or actual URL has any query-string then the actual values can be referred in the imported html partial directly.
 * > ``` html
 * > <h2>Performing {{action}} on {{modelName}}</h2>
 * > ```
 * > - **elem** type of route places element specified by *name* property on hhe target. *import* property points to the location of element definition file.
 * >  - If element is not registered yet, *import* is href-imported and *name* element is added.
 * >  - Placeholders and query parameters are set on the element using `this.set` call. (**id** in path or query-parameters is added as **modelId** attribute)
 * > ``` html
 * > <owesome-element action="..." model-name="..."></owesome-element>
 * > ```
 * >  - The element-name can be made dynamic by introducing **elmentName** as path parameter. e.g. /show/:elementName
 * >  - **meta** : route types are not supported anymore.
 * > Use `model-ui-generator` as a mediator element for replacing old `meta` type of routes.
 * 
 * 
 * #### Sharing data between SPA routes,
 * 
 *##### Through URL placeholders
 *
 *Consider two UI Routes having following URL patterns
 *
 *```
 * {
 *   path: '/view-orders',
 * 	type: 'elem',
 * 	name:'order-list'
 * }
 * 
 * {
 *   path: '/view-order/:orderId',
 * 	type: 'elem',
 * 	name: 'order-details'
 * }
 * ```
 * **order-details** component has a property _orderId_.
 * 
 * (a) Place an ```<a href="/view-order/123">``` on order-list component (through a dom-repeat sort). When user clicks on this link SPA navigation will take user to <order-details> and orderId property will be set to "123" automatically.
 * 
 * (b) Programatically call ```oe_navigate_to("/view-order/123")``` and this will have same effect as above.
 * 
 * ##### Passing entire object data
 * Sometimes you may want to pass entire javascript object and passing it through URL may not be possible.
 * Consider two UI Routes having following URL patterns
 * 
 * ```
 * {
 *   path: '/view-orders',
 * 	type: 'elem',
 * 	name:'order-list'
 * }
 * 
 * {
 *   path: '/view-order/:orderId',
 *   type: 'elem',
 *   name: 'order-details'
 * }
 * ```
 * 
 * **<order-details>** component has a property _order_ which should be set directly.
 * 
 * Programatically call ```oe_navigate_to("/view-order/123", {order:my_order_object});```
 * 
 * This will navigate user to "/view-order/123", show **<order-details>** component and
 * set order property to passed in my_oder_object.
 *  
 * @customElement
 * @appliesMixin OECommonMixin
 * @polymer
 */
class OeAppRoute extends OECommonMixin(PolymerElement) {
  static get template() {
    return html`
      <oe-ajax id="ajax" params='{}' headers='{}' handle-as="json" on-response="_routesFetched" on-error="_routesFetchError" debounce-duration="300"></oe-ajax>
      <oe-ajax id="htmlFetcher" method="get" params='{}' headers='{}' handle-as="text"></oe-ajax>
      <slot></slot>
    `;
  }

  static get is() {
    return "oe-app-route";
  }

  static get properties() {
    return {

      /**
       * Route object obtained from app-location containing
       * path,query parameter etc.
       */
      route: {
        type: Object,
        notify: true
      },

      /**
       * Url from which the UIRoutes needs to be fetched , 
       * defaults to api call to UIRoutes model.
       */
      configUrl: {
        type: String,
        value: function () {
          var restApiRoot = (window.OEUtils && window.OEUtils.restApiRoot) ? window.OEUtils.restApiRoot : '/api';
          return restApiRoot + '/UIRoutes';
        }
      },

      noMatch: {
        type: String
      },

      /**
       * 'group' query parameter for fetching UIRoutes
       */
      group: {
        type: String,
        value: ""
      },

      /**
       * List of routes fetched.
       */
      routesList: {
        type: Array
      },
      tail: {
        type: Object,
        notify: true
      },

      /**
       * Active route
       */
      activeRoute: {
        type: Object,
        notify: true,
        readOnly: true,
        value: function () {
          return {};
        }
      },

      /**
       * Selected group name
       */
      activeGroup: {
        type: String,
        value: "",
        notify: true,
        readOnly: true
      },

      /**
       * Ignore group property and fetch all Routes
       */
      fetchAllGroups: {
        type: Boolean,
        value: false
      }


      /**
       * Fired on the element that is displayed after route change.
       *
       * @event oe-route-change
       */

      /**
       * Fired to notify the resetting of app-drawer .
       *
       * @event app-drawer-reset-layout
       */

    };
  }

  static get observers() {
    return [
      "handleRouteChange(route.path)",
      "handleRoutesListChange(routesList)"
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this._pages = {};
    this._target = this.querySelector('[route-target]');
    this._target = this._target || this.querySelector('iron-pages');
    if (!this._target) {
      console.error('no route target or iron page found');
      return;
    }
    this._target.attrForSelected = 'route-path';

    var filter = {};
    if (!this.fetchAllGroups) {
      filter.where = {};
      if (this.group)
        filter.where.group = this.group;
    }

    if (!this.routesList) {
      if (this.configUrl) {
        this.$.ajax.url = OEUtils.geturl(this.configUrl) + '?filter=' + JSON.stringify(filter);
        this.$.ajax.generateRequest();
      }
    }

    if (this._target.firstElementChild) {
      this._target.firstElementChild.setAttribute('route-path', '/');
    }

  }


  processInitialRoute() { }

  /**
   * Processess the routeList for regexp and sort them with scores.
   * Calls 'handleRouteChange' if there is a pending route change
   * @param {Array} newData 
   */
  handleRoutesListChange(newData) { //eslint-disable-line no-unused-vars
    this.routesList.forEach(function (route) {
      route.keys = [];
      route.regexp = OEUtils.pathtoregexp(route.path, route.keys, false, false);
    });
    this.routesList.sort(function (l, r) {
      var lscore = 0;
      var rscore = 0;
      lscore += 4 * (l.path.match(/\*/g) || []).length;
      lscore += 2 * (l.path.match(/\?/g) || []).length;
      lscore += 1 * (l.path.match(/\:/g) || []).length; //eslint-disable-line no-useless-escape

      rscore += 4 * (r.path.match(/\*/g) || []).length;
      rscore += 2 * (r.path.match(/\?/g) || []).length; 
      rscore += 1 * (r.path.match(/\:/g) || []).length; //eslint-disable-line no-useless-escape
      return lscore - rscore;
    });
    if (this.pendingRouteChange) {
      this.handleRouteChange();
    }
  }

  /**
   * Refeshes the routeslist by fetching from the configUrl
   */
  refresh() {
    var filter = {
      where: {
      }
    };
    if (this.group) {
      filter.where.group = this.group;
    }
    if (this.configUrl) {
      this.$.ajax.url = OEUtils.geturl(this.configUrl) + '?filter=' + JSON.stringify(filter);
      this.$.ajax.generateRequest();
    }
  }

  /**
   * Sets the fetched routes into 'routesList'
   * @param {Event} e 
   */
  _routesFetched(e) {
    this.set('routesList', e.detail.response);
  }

  /**
   * Logs the error while fetching the routes list.
   * @param {Event} e 
   */
  _routesFetchError(e) {
    console.error(this.is, ': unable to fetch route details from ', this.configUrl, '[' + e.detail.request.statusText +
      ']');
  }

  __resetProperties() {
    this._matched = null;
  }

  /**
   * Checks if the given route object matches the path based on regexp,
   * If the regex matches populates the params object with matches created by regexp. 
   * @param {string} path Path string to match
   * @param {Object} route Route object containing the regexp
   * @param {Object} params Params object that stores the matched parameters
   * @return {boolean} flag if the route matches the path
   */
  __match(path, route, params) {
    var qsIndex = path.indexOf('?');
    var pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
    var m = route.regexp.exec(decodeURIComponent(pathname));
    if (!m) {
      return false;
    }
    this.match = m;
    for (var i = 1, len = m.length; i < len; ++i) {
      var key = route.keys[i - 1];
      var val = window.decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }
    var queryString = window.location.search;
    queryString = queryString.substring(1);
    var queries, temp, l;
    // Split into key/value pairs
    queries = queryString.split('&');
    // Convert the array of strings into an object
    for (i = 0, l = queries.length; i < l; i++) {
      temp = queries[i].split('=');
      params[temp[0]] = temp[1];
    }
    return true;
  }

  /**
   * Sets the parameters on the element.
   * @param {HTMLElement} el Element to set the parameters on.
   * @param {Object} params Object of params to set on the element
   * @param {Object} route Route object with arguments to set on the element
   */
  __setParamsOnElement(el, params, route) {
    var m = this.match;
    var state = window.history.state;
    var self = this;
    var hasState = state ? (Object.keys(state).length > 0 ? true : false) : false;
    if (el.set) {
      if (route.args) {
        route.args && Object.keys(route.args).forEach(function (key) {
          el.set(key, route.args[key]);
        });
      }

      el.set('disableAutoFetch', hasState);
      if (state) {
        state && Object.keys(state).forEach(function (key) {
          el.set(key, state[key]);
        });
      }
      params && Object.keys(params).forEach(function (key) {
        var t = key === 'id' ? 'modelId' : key;
        el.set(t, params[key]);
      });

      if (m && m.length > 1) {
        var tail = {
          path: m[1],
          __queryParams: route.__queryParams
        };
        self.set('tail', tail);
        route.tail = tail;
      } else {
        route.tail = null;
      }
      if(el.fire){
        el.fire('oe-route-change', route);
      }
    }
    self.fire('app-drawer-reset-layout');
  }

  /**
   * Merges pre and post url to return a merged url
   * @param {string} pre 
   * @param {string} post 
   * @return {string} Merged Url
   */
  _joinUrlSegments(pre, post) {
    pre = pre || '';
    post = post || '';
    if (pre.endsWith('/') && post.startsWith('/')) {
      return pre + post.substr(1);
    } else if (!pre.endsWith('/') && !post.startsWith('/')) {
      return pre + '/' + post;
    } else {
      return pre + post;
    }
  }

  /**
   * On route change matches the current path with the list of routes fetched to find the matching route.
   * Then creates and appends the element (if not already created) and selects the element within the target component.
   * Additionally data sent in the query parameter or saved on the state is set on the element. 
   */
  handleRouteChange() {

    if (!this.route) {
      return;
    }

    if (!this.routesList) {
      this.pendingRouteChange = true;
      return;
    }

    var path = this.route.path || '/';
    if (this.route && this.route.__queryParams && this.route.__queryParams.redirectTo) {
      path = decodeURIComponent(this.route.__queryParams.redirectTo);
      var subPath=window.OEUtils.subPath ||'';
      var newPath = subPath+path;
      history.replaceState(history.state, document.title, newPath);
    }

    if (!this._target) {
      console.warn(this.id, 'No route target container found.');
      return;
    }

    if (this._oldPath && this._oldPath === path) {
      return;
    }

    this._oldPath = path;

    var self = this;

    for (var j = 0; j < this.routesList.length; j++) {
      var route = this.routesList[j];
      var params = {};
      if (self.__match(path, route, params)) {
        this._setActiveGroup(route.group);
        this._setActiveRoute(route);
        var selector = '*[route-path="' + route.path + '"]';
        var oldElement = (new DomApi(self._target)).querySelector(selector);
        if (oldElement && route.retainInstance) {
          route.element = oldElement;
          this._target.set('selected', route.path);
          self.__setParamsOnElement(oldElement, params, route);
        } else {
          if (oldElement) {
            (new DomApi(self._target)).removeChild(oldElement);
            this._target.set('selected', null);
          }
          var url = route.import;
          if (url) {
            params && Object.keys(params).forEach(function (key) { // eslint-disable-line no-loop-func
              url = url.replace(':' + key, params[key]);
            });
          }
          self._currentRoute = route;
          var appendElement = function () { // eslint-disable-line no-loop-func

            if (route.transitions) {
              route.transitions.forEach(function (transition) {
                if (transition.event && transition.route) {
                  route.element.addEventListener(transition.event, function (e) {
                    var path = transition.route;
                    //extract
                    var chunks = path.match(/{{[\w+\.]*}}/g);   //eslint-disable-line no-useless-escape
                    chunks && chunks.forEach(function (chunk) {
                      var placeholder = chunk.substr(2, chunk.length - 4);
                      var value = self._deepValue(e.detail, placeholder);
                      if (value === undefined) {
                        value = self._deepValue(e.currentTarget, placeholder);
                      }
                      path = path.replace(chunk, value);
                    });
                    window.oe_navigate_to(path, e.detail);
                  });
                }
              });
            }

            if(typeof route.element.set !== "function"){
              route.element.addEventListener("meta-attached",function(){
                self.__setParamsOnElement(route.element, params, route);
              });
            }
            (new DomApi(self._target)).appendChild(route.element);
            flush();
            self._target._updateItems();
            // attribute should be set before setting selected value so that iron page will select the page correctly
            route.element.setAttribute('route-path', route.path);
            self._target.set('selected', route.path);
            self.__setParamsOnElement(route.element, params, route);
          };

          var elementName = route.name;
          params && Object.keys(params).forEach(function (key) { // eslint-disable-line no-loop-func
            elementName = elementName.replace(':' + key, params[key]);
          });
          if (elementName && elementName[0] === '!') {
            elementName = elementName.substr(1);
          }

          if (route.type === 'elem' && url) {
            var isElementLoaded = window.customElements.get(elementName);
            if (isElementLoaded) {
              route.elementName = elementName;
              route.element = document.createElement(route.elementName);
              appendElement();
            } else {
              if (OEUtils.uibaseroute) {
                url = self._joinUrlSegments(OEUtils.uibaseroute, url);
              }
              import(url).then(function(e) { 
                route.elementName = elementName;
                route.element = document.createElement(route.elementName);
                appendElement();
              });
            }
          } else if (route.type === 'page' && url) {
            var ajax = this.$.htmlFetcher;
            if (OEUtils.uibaseroute) {
              url = self._joinUrlSegments(OEUtils.uibaseroute, url);
            }
            ajax.url = url;
            ajax.addEventListener('response', function (e) {
              route.retainInstance = true;
              route.element = document.createElement('div');
              var temp = document.createElement('template');
              temp.innerHTML = e.detail.response;

              while (temp.content.childNodes.length > 0) {
                route.element.appendChild(temp.content.childNodes[0]);
              }
              while (temp.content.querySelectorAll('style[scoped]').length > 0) {
                route.element.appendChild(temp.content.querySelectorAll('style[scoped]')[0]);
              }
              OEUtils.scopeStyles && OEUtils.scopeStyles(route.element);
              appendElement();
            });
            ajax.addEventListener('error', function (e) {
              self.fire('oe-show-error', 'Error importing element');
            });
            ajax.generateRequest();
          } else {
            route.elementName = elementName;
            route.element = document.createElement(route.elementName);
            appendElement();
          }
        }
        return;
      }
    }


    if (path === '/') {
      this._target.set('selected', '/');
      return;
    }

    // for cordova hybrid app
    if (location.protocol === 'file:' && document.baseURI === location.href) {
      this._target.set('selected', '/');
      return;
    }

    this._setActiveGroup('');
    this._setActiveRoute({});

    if (this.noMatch === 'redirect') {
      var redirectTo = window.location.origin + path;
      window.location.assign(redirectTo);
    } else {
      this._target.set('selected', path);
      // iron pages may have fallback selection
      // so set route on it
      // helpful when using nested oe-app-routes
      if (this._target.selectedItem && this._target.selectedItem.set) {
        this._target.selectedItem.set('route', this.route);
        this.fire('app-drawer-reset-layout');
      }
    }
  }
}

window.customElements.define(OeAppRoute.is, OeAppRoute);
