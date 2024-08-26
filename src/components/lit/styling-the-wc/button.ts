import { LitElement, css, html, type CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('my-button')
export class MyButton extends LitElement {
    static styles?: CSSResultGroup | undefined = [
        css`
            :host {
                --gradient-color-start: #ff6b6b;
                --gradient-color-end: #f06595;
            }

            :host([disabled]) {
                opacity: 0.5;
                pointer-events: none;
            }

            :host-context(.dark-mode) button {
                color: var(--gradient-color-start);
                background: transparent;
                border: 2px solid var(--gradient-color-end);
            }

            ::slotted(a)::after {
                color: white;
                content: '>';
                padding: 0 0 0 0.5em;
                font-size: 1.25em;
            }

            button {
                background: linear-gradient(135deg, var(--gradient-color-start), var(--gradient-color-end));
                color: white;
                font-size: 16px;
                font-weight: bold;
                padding: 12px 24px;
                border: none;
                border-radius: 30px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            button:hover {
                background: linear-gradient(135deg, var(--gradient-color-end), var(--gradient-color-start));
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                transform: translateY(-3px);
            }

            button:active {
                transform: translateY(0);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
        `
    ];

    override render() {
        return html`<button part="base"><slot></slot></button>`;
    }
}
