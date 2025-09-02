import React from "react";
import { Link } from "react-router-dom";

function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl flex w-[90%] max-w-5xl overflow-hidden">
        {/* Left Side - Form */}
        <div
          className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center"
          data-aos="fade-right"
        >
          <h2 className="text-3xl font-bold text-blue-600 mb-8">Oddo</h2>

          <h3 className="text-2xl font-semibold mb-2">Create an Account ✨</h3>
          <p className="text-sm text-gray-500 mb-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-medium">
              Log In
            </Link>
          </p>

          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" className="accent-blue-600" />
            I agree to the{" "}
            <a href="#" className="text-blue-600">
              Terms & Privacy
            </a>
          </label>

          <button className="w-full py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:scale-105 transition">
            Sign Up
          </button>
        </div>

        {/* Right Side - Animated Grid */}
        <div
          className="hidden md:grid md:w-1/2 grid-cols-2 gap-4 p-8 bg-gradient-to-br from-blue-50 to-blue-100"
          data-aos="fade-left"
        >
          <div className="bg-gray-900 text-white flex items-center justify-center rounded-xl p-6 hover:scale-105 transition">
            Manage
          </div>
          <div className="bg-blue-600 flex items-center justify-center rounded-xl p-6 text-white text-2xl hover:rotate-6 transition">
            ⏱
          </div>
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="user"
            className="rounded-xl object-cover w-full h-full hover:scale-105 transition"
          />
          <div className="bg-gray-800 text-white flex items-center justify-center rounded-xl p-6 hover:scale-105 transition">
            Communicate
          </div>
          <img
            src="https://randomuser.me/api/portraits/group/2.jpg"
            alt="team"
            className="rounded-xl object-cover w-full h-full hover:scale-105 transition"
          />
          <div className="bg-gray-900 text-white flex items-center justify-center rounded-xl p-6 hover:scale-105 transition">
            Task
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
