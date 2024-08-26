import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-button-group')
export class MyButtonGroup extends LitElement {
    @property({ type: Array })
    buttons: string[];

    constructor() {
        super();
        this.buttons = [];
    }

    static styles = css`
        ::slotted(button) {
            background-color: #28a745;
            color: white;
            font-size: 16px;
            font-weight: bold;
            padding: 12px 36px;
            border: none;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
            cursor: pointer;
            margin: 0 8px;
        }

        ::slotted(button:hover) {
            background-color: #34d399;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        ::slotted(button:active) {
            background-color: #28a745;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transform: scale(0.98);
        }

        .button-group {
            display: flex;
            align-items: center;
            gap: 0.5em;
        }
    `;

    override render() {
        return html`<div part="base" class="button-group">
            ${this.buttons.map((button, idx) => html`<my-button exportparts=${`base:my-button__base-${idx + 1}`}>${button}</my-button>`)}
        </div>`;
    }
}
