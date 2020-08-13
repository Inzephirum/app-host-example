import * as React from 'react';

interface AuthFormProps {
  onLogin(id: string): void;
}

export function AuthForm(props: AuthFormProps) {
  const [id, setId] = React.useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (id.trim() === '') {
      return;
    }

    props.onLogin(id);
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label htmlFor="user-id">User ID</label>
        <input
          id="user-id"
          type="text"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
          }}
        />
      </p>
      <button type="submit">Login</button>
    </form>
  );
}
