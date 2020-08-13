import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageBus } from '../message-bus/types';
import { Demo } from './Demo';

interface Todo {
  id: string;
  text: string;
  complete: boolean;
}

function DemoApp(props: { bus: MessageBus }) {
  const { bus } = props;
  const [text, setText] = React.useState(() => {
    const message = bus.peek({ channel: 'todos', topic: 'text' })

    if (message !== undefined) {
      return (message as any).payload;
    }

    return '';
  });

  const [todos, setTodos] = React.useState<Todo[]>([]);

  function create(todo: Todo) {
    setTodos((todos) => todos.concat(todo));
  }

  function change(todo: Todo) {
    setTodos((todos) =>
      todos.map((t) => {
        if (t.id === todo.id) {
          return todo;
        }

        return t;
      }),
    );
  }

  React.useEffect(() => {
    const unsubs = [];

    unsubs.push(
      bus.subscribe<Todo>({ channel: 'todos', topic: 'create' }, ({ payload: todo }) => {
        create(todo);
      }),
    );

    unsubs.push(
      bus.subscribe<Todo>({ channel: 'todos', topic: 'change' }, ({ payload: todo }) => {
        change(todo);
      }),
    );

    unsubs.push(
      bus.subscribe<string>({ channel: 'todos', topic: 'text' }, ({ payload }) => {
        setText(payload);
      }),
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [bus]);

  return (
    <>
      <Demo
        text={text}
        todos={todos}
        onText={(value) => {
          setText(value);
          bus.send({
            channel: 'todos',
            topic: 'text',
            broadcast: true,
            payload: value,
          })
        }}
        onCreate={(todo) => {
          create(todo);
          bus.send({
            channel: 'todos',
            topic: 'create',
            payload: todo,
            broadcast: true,
          });
        }}
        onToggle={(todo) => {
          const changed = { ...todo, complete: !todo.complete };
          change(changed);
          bus.send({
            channel: 'todos',
            topic: 'change',
            payload: changed,
            broadcast: true,
          });
        }}
        onLogout={() => {
          bus.send({
            channel: 'auth',
            topic: 'logged-out',
            self: true,
          });
        }}
      />
    </>
  );
}

export class DemoFrontend {
  private element: HTMLElement;
  private bus: MessageBus;

  constructor(bus: MessageBus) {
    this.bus = bus;
    this.element = null;
  }

  mount(element: HTMLElement) {
    this.element = element;

    ReactDOM.render(<DemoApp bus={this.bus} />, this.element);
  }

  unmount() {
    ReactDOM.unmountComponentAtNode(this.element);
  }
}
