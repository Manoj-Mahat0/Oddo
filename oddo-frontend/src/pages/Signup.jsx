import React from "react";
import { Link } from "react-router-dom";
import FlipCard from "../components/FlipCard";

function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl flex w-[95%] max-w-6xl overflow-hidden">
        {/* Left Side - Form */}
        <div
          className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-l-2xl border-r border-gray-700"
          data-aos="fade-right"
        >
          <h2 className="text-3xl font-extrabold text-blue-400 mb-8">Oddo</h2>

          <h3
            className="text-3xl font-bold text-white mb-2"
            data-aos="fade-up"
          >
            Create an Account ✨
          </h3>

          <p
            className="text-sm text-gray-400 mb-6"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 font-semibold">
              Log In
            </Link>
          </p>

          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg mb-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:shadow-lg focus:shadow-blue-500/40 transition duration-300"
          />

          <label className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <input type="checkbox" className="accent-blue-600" />
            I agree to the{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Terms & Privacy
            </a>
          </label>

          <button
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 
             text-white rounded-lg font-medium shadow-md 
             transform transition duration-300 ease-in-out 
             hover:scale-95 hover:shadow-lg active:scale-90"
          >
            Sign Up
          </button>

        </div>

        {/* Right Side - Stylish 3x3 Grid */}
        <div className="hidden md:grid md:w-1/2 grid-cols-3 gap-5 p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
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

export default Signup;
