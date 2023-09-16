import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [token, setToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (token) {
      onLogin(token);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Please Enter Your Token</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Enter token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
