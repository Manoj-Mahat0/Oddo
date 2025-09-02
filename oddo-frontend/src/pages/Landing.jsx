import React from "react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-6 bg-transparent">
        <h1 className="text-2xl font-bold text-blue-700">Oddo</h1>
        <div className="space-x-6">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-blue-700 font-medium hover:text-blue-900 transition"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <h1
          className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight"
          data-aos="fade-up"
        >
          A platform built for <br /> a new way of working
        </h1>

        <p
          className="mt-6 text-gray-600 max-w-2xl"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Collaborate, manage, and grow together with your team. Oddo brings
          productivity, clarity, and harmony to your workplace.
        </p>

        <div
          className="mt-8 flex flex-col sm:flex-row gap-4"
          data-aos="zoom-in"
          data-aos-delay="400"
        >
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition"
          >
            Get Started →
          </button>
          <button className="px-8 py-3 border border-gray-300 rounded-full hover:bg-gray-100 hover:scale-105 transition">
            Watch Demo
          </button>
        </div>

        <p
          className="mt-10 text-gray-500 text-sm"
          data-aos="fade-in"
          data-aos-delay="600"
        >
          ✨ No credit card required · Unlimited users on free plan
        </p>
      </main>
    </div>
  );
}

export default Landing;
