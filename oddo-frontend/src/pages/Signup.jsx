import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FlipCard from "../components/FlipCard";
import API from "../api/client";

function Signup() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }

    if (!role) {
      setError("Please select a role!");
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post("/invites/signup", {
        code,
        password,
        role,
      });

      setSuccess(data.message);

      // Save role/code if you want
      localStorage.setItem("role", data.role);
      localStorage.setItem("code", data.code);

      // Redirect to login after success
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl flex w-[95%] max-w-6xl overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-l-2xl border-r border-gray-700">
          <h2 className="text-3xl font-extrabold text-blue-400 mb-8">E-Digital</h2>

          <h3 className="text-3xl font-bold text-white mb-2">
            Create an Account ✨
          </h3>

          <p className="text-sm text-gray-400 mb-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 font-semibold">
              Log In
            </Link>
          </p>

          {error && <p className="text-red-500 mb-3">{error}</p>}
          {success && <p className="text-green-400 mb-3">{success}</p>}

          {/* Invite Code */}
          <input
            type="text"
            placeholder="Invite Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
            required
          />

          {/* Role Dropdown */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
            required
          >
            <option value="">Select Role</option>
            <option value="Developer">Developer</option>
            <option value="Tester">Tester</option>
            <option value="SEO">SEO</option>
            <option value="HR">HR</option>
            <option value="Accountant">Accountant</option>
            <option value="Student">Student</option>
            <option value="Staff">Staff</option>
            <option value="Intern">Intern</option>
          </select>

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
            required
          />

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
            required
          />

          {/* Terms Checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <input type="checkbox" className="accent-blue-600" required />
            I agree to the{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Terms & Privacy
            </a>
          </label>

          {/* Submit Button */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 
             text-white rounded-lg font-medium shadow-md 
             transform transition duration-300 ease-in-out 
             hover:scale-95 hover:shadow-lg active:scale-90 disabled:opacity-50"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </div>

        {/* Right Side - Responsive Grid */}
        <div className="w-full md:w-1/2 grid grid-cols-2 md:grid-cols-3 gap-5 p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          {[
            { img: "https://randomuser.me/api/portraits/men/11.jpg", title: "Collab", delay: "100", anim: "fade-up" },
            { img: "https://randomuser.me/api/portraits/women/12.jpg", title: "Grow", delay: "200", anim: "zoom-in" },
            { img: "https://randomuser.me/api/portraits/men/13.jpg", title: "Plan", delay: "300", anim: "flip-left" },
            { img: "https://randomuser.me/api/portraits/women/14.jpg", title: "Share", delay: "400", anim: "fade-right" },
            { img: "https://randomuser.me/api/portraits/group/1.jpg", title: "Teamwork", delay: "500", anim: "flip-right" },
            { img: "https://randomuser.me/api/portraits/men/15.jpg", title: "Secure", delay: "600", anim: "fade-left" },
            { img: "https://randomuser.me/api/portraits/women/16.jpg", title: "Learn", delay: "700", anim: "zoom-in" },
            { img: "https://randomuser.me/api/portraits/women/17.jpg", title: "Create", delay: "800", anim: "fade-up" },
            { img: "https://randomuser.me/api/portraits/group/2.jpg", title: "Success", delay: "900", anim: "flip-left" },
          ].map((card, i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-gray-700 
                shadow-lg hover:shadow-blue-500/30 transform transition-all duration-500 hover:-translate-y-2 hover:scale-105"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-lg transition duration-500"></div>
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

export default Signup;
