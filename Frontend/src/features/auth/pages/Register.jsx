import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");

  const { loading, handleRegister } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    await handleRegister({
      username,
      email,
      password,
    });

    setSuccess("Account created successfully!");

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  // if (loading) {
  //   return (
  //     <main className="auth-page">
  //       <h1>Loading...</h1>
  //     </main>
  //   );
  // }

  return (
    <main className="auth-page">
      <div className="form-container">
        <div className="form-header">
          <h1>Create Account ✨</h1>
          <p>Join us and start your journey today.</p>
        </div>

        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Create a password"
              required
            />
          </div>

          <button
            type="submit"
            className="button register-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?
          <Link to="/login"> Sign In</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
