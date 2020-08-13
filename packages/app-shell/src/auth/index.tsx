import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageBus } from '../message-bus/types';
import { AuthForm } from './AuthForm';

export class AuthFrontend {
  private element: HTMLElement;
  private bus: MessageBus;

  constructor(bus: MessageBus) {
    this.bus = bus;
    this.element = null;
  }

  mount(element: HTMLElement) {
    this.element = element;

    ReactDOM.render(
      React.createElement(AuthForm, {
        onLogin: (id) => {
          this.bus.setClientId(id);
          this.bus.send({
            channel: 'auth',
            topic: 'logged-in',
            payload: id,
            self: true,
          });
        },
      }),
      this.element,
    );
  }

  unmount() {
    ReactDOM.unmountComponentAtNode(this.element);
  }
}
