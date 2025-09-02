import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FlipCard from "../components/FlipCard";
import API from "../api/client";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const { data } = await API.post("/auth/login", {
        email,
        password,
      });

      // Save token & role
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);

      // Redirect based on role
      if (data.role === "Admin") {
        navigate("/admin");
      } else if (data.role === "Developer") {
        navigate("/developer");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-gray-50">
      <div className="bg-white rounded-2xl shadow-xl flex w-[95%] max-w-6xl overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold text-blue-600 mb-8">Oddo</h2>

          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back <span className="inline-block animate-wave">👋</span>
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-semibold">
              Sign Up
            </Link>
          </p>

          {error && <p className="text-red-600 mb-3">{error}</p>}

          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 hover:scale-105 transition"
          >
            Log In
          </button>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-blue-600" />
              Keep me logged in
            </label>
            <a href="#" className="text-blue-600">
              Forgot password?
            </a>
          </div>
        </div>

        {/* Right Side - 3x3 Flip Cards */}
        <div className="hidden md:grid md:w-1/2 grid-cols-3 gap-3 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
          <FlipCard img="https://randomuser.me/api/portraits/men/32.jpg" title="Manage" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/men/45.jpg" title="Time" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/women/50.jpg" title="Team" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/women/52.jpg" title="Chat" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/group/3.jpg" title="Tasks" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/men/40.jpg" title="Files" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/men/60.jpg" title="Calendar" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/women/61.jpg" title="Notes" autoFlip />
          <FlipCard img="https://randomuser.me/api/portraits/group/4.jpg" title="Projects" autoFlip />
        </div>
      </div>
    </div>
  );
}

export default Login;
