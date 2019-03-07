import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import "oe-ui-forms/meta-polymer";

class testMeta extends PolymerElement {
    static get template() {
        return html`
		<style>
          :host{
              position:relative;
              display:block;
              box-sizing:border-box;
          }
        </style>
        <div class="component-container">
            <h2>Test Element</h2>
        </div>
		`;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fire('success-test', { 'name': 'test' });
        this.fire('meta-attached');
        this.is = "test-meta";
    }

    fire(type, detail, options) {
        options = options || {};
        detail = (detail === null || detail === undefined) ? {} : detail;
        let event = new Event(type, {
          bubbles: options.bubbles === undefined ? true : options.bubbles,
          cancelable: Boolean(options.cancelable),
          composed: options.composed === undefined ? true: options.composed
        });
        event.detail = detail;
        let node = options.node || this;
        node.dispatchEvent(event);
        return event;
      }
}

window.customElements.metadefine("test-meta", testMeta);