import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('my-button')
export class MyButton extends LitElement {
    @state() name = 'my-button';

    override render() {
        return html`<p>Hello world! From ${this.name}</p>`;
    }
}
