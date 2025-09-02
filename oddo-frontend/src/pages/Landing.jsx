import React from "react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 fixed w-full top-0 z-50 backdrop-blur-lg bg-black/30 shadow-md">
        {/* Logo */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
          PMO
        </h1>

        {/* Navbar Buttons */}
        <div className="space-x-4 flex">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-300"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-1 text-center px-6 mt-24">
        {/* Heading with Gradient Text */}
        <h1
          className="text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          data-aos="fade-up"
        >
          A platform built for <br /> a new way of working
        </h1>

        {/* Description */}
        <p
          className="mt-6 text-gray-300 max-w-2xl text-lg"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Collaborate, manage, and grow together with your team. Oddo brings
          productivity, clarity, and harmony to your workplace.
        </p>

        {/* Buttons */}
        <div
          className="mt-10 flex flex-col sm:flex-row gap-5"
          data-aos="zoom-in"
          data-aos-delay="400"
        >
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300"
          >
            🚀 Get Started
          </button>
          <button className="px-10 py-4 border border-gray-500 text-gray-200 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all duration-300">
            🎥 Watch Demo
          </button>
        </div>

        {/* Footer Note */}
        <p
          className="mt-10 text-gray-400 text-sm"
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
