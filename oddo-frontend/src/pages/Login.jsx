import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FlipCard from "../components/FlipCard";
import API from "../api/client";

function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl flex w-[95%] max-w-6xl overflow-hidden">
                {/* Left Side - Form */}
                <div
                    className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-l-2xl border-r border-gray-700"
                    data-aos="fade-right"
                >
                    <h2 className="text-3xl font-extrabold text-blue-400 mb-8">Oddo</h2>
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
                    <h3
                        className="text-3xl font-bold text-white mb-2"
                        data-aos="fade-up"
                    >
                        Welcome Back <span className="inline-block animate-wave">👋</span>
                    </h3>

          <p className="text-sm text-gray-500 mb-6">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-semibold">
              Sign Up
            </Link>
          </p>

          {error && <p className="text-red-600 mb-3">{error}</p>}
                    <p
                        className="text-sm text-gray-400 mb-6"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Don’t have an account?{" "}
                        <Link to="/signup" className="text-blue-400 font-semibold">
                            Sign Up
                        </Link>
                    </p>

          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
                    <input
                        type="email"
                        placeholder="user@example.com"
                        className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4 
               focus:outline-none focus:ring-2 focus:ring-blue-500 
               focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
                    />

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4 
               focus:outline-none focus:ring-2 focus:ring-blue-500 
               focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
                    />


          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 hover:scale-105 transition"
          >
            Log In
          </button>
                    <button
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:scale-105 hover:shadow-xl transition"
                        data-aos="zoom-in"
                        data-aos-delay="400"
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
                    <div
                        className="flex justify-between items-center mt-4 text-sm text-gray-400"
                        data-aos="fade-up"
                        data-aos-delay="500"
                    >
                        <label className="flex items-center gap-2">
                            <input type="checkbox" className="accent-blue-600" />
                            Keep me logged in
                        </label>
                        <a href="#" className="text-blue-400 hover:underline">
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
              {/* Right Side - Stylish 3x3 Grid */}
<div className="hidden md:grid md:w-1/2 grid-cols-3 gap-5 p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
  {[
    { img: "https://randomuser.me/api/portraits/men/32.jpg", title: "Manage", delay: "100", anim: "fade-up" },
    { img: "https://randomuser.me/api/portraits/men/45.jpg", title: "Time", delay: "200", anim: "zoom-in" },
    { img: "https://randomuser.me/api/portraits/women/50.jpg", title: "Team", delay: "300", anim: "flip-left" },
    { img: "https://randomuser.me/api/portraits/women/52.jpg", title: "Chat", delay: "400", anim: "fade-right" },
    { img: "https://randomuser.me/api/portraits/group/3.jpg", title: "Tasks", delay: "500", anim: "flip-right" },
    { img: "https://randomuser.me/api/portraits/men/40.jpg", title: "Files", delay: "600", anim: "fade-left" },
    { img: "https://randomuser.me/api/portraits/men/60.jpg", title: "Calendar", delay: "700", anim: "zoom-in" },
    { img: "https://randomuser.me/api/portraits/women/61.jpg", title: "Notes", delay: "800", anim: "fade-up" },
    { img: "https://randomuser.me/api/portraits/group/4.jpg", title: "Projects", delay: "900", anim: "flip-left" },
  ].map((card, i) => (
    <div
      key={i}
      className="group relative rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-gray-700 
                 shadow-lg hover:shadow-blue-500/30 transform transition-all duration-500 hover:-translate-y-2 hover:scale-105"
    >
      {/* Gradient border ring on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-lg transition duration-500"></div>

      {/* Inner card */}
      <div className="relative z-10 p-2 flex items-center justify-center">
        <FlipCard
          img={card.img}
          title={card.title}
          delay={card.delay}
          animation={card.anim}
        />
      </div>
    </div>
  ))}
</div>

            </div>
        </div>
    );
}

export default Login;
