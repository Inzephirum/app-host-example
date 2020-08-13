import { BrowserMessageBus } from './message-bus';
import { AuthFrontend } from './auth';
import { DemoFrontend } from './demo';

const bus = BrowserMessageBus.create({
  ws: 'http://localhost:3000',
});

const auth = new AuthFrontend(bus);
const demo = new DemoFrontend(bus);
const node = document.getElementById('root');

bus.subscribe<string>({ channel: 'auth', topic: 'logged-in' }, (message) => {
  const id = message.payload;
  localStorage.setItem('userId', JSON.stringify(id));
  auth.unmount();
  demo.mount(node);
});

bus.subscribe({ channel: 'auth', topic: 'logged-out' }, () => {
  localStorage.removeItem('userId');
  demo.unmount();
  auth.mount(node);
});

let userId;

try {
  userId = JSON.parse(localStorage.getItem('userId'));
} catch (error) {
  userId = undefined;
}

if (userId === null || userId === undefined) {
  auth.mount(node);
} else {
  bus.setClientId(userId);
  demo.mount(node);
}
