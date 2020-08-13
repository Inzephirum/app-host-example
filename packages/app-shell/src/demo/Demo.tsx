import * as React from 'react';

interface Todo {
  id: string;
  text: string;
  complete: boolean;
}

interface DemoProps {
  text: string;
  todos: Todo[];
  onText(text: string): void;
  onCreate(todo: Todo): void;
  onToggle(todo: Todo, checked: boolean): void;
  onLogout(): void;
}

const createID = () => Math.random().toString(16).substr(2, 8);

export function Demo(props: DemoProps) {
  const { text, onText } = props;;
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    props.onCreate({
      id: createID(),
      text,
      complete: false,
    });

    onText('');
  };

  return (
    <div>
      <header>
        <button type="button" onClick={props.onLogout}>
          logout
        </button>
      </header>
      <h1>Todos</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="todo-input">Create todo: </label>
        <input
          type="text"
          value={text}
          onChange={(event) => {
            onText(event.target.value);
          }}
        />
      </form>
      {props.todos.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.complete}
            onChange={(event) => {
              props.onToggle(todo, event.target.checked);
            }}
          />
          <label htmlFor={todo.id}>{todo.text}</label>
        </div>
      ))}
    </div>
  );
}
