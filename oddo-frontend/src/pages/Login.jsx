import React from "react";
import { Link } from "react-router-dom";
import FlipCard from "../components/FlipCard";

function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-gray-50">
            <div className="bg-white rounded-2xl shadow-xl flex w-[95%] max-w-6xl overflow-hidden">
                {/* Left Side - Form */}
                <div
                    className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center"
                    data-aos="fade-right"
                >
                    <h2 className="text-3xl font-extrabold text-blue-600 mb-8">Oddo</h2>

                    <h3
                        className="text-3xl font-bold text-gray-900 mb-2"
                        data-aos="fade-up"
                    >
                        Welcome Back <span className="inline-block animate-wave">👋</span>
                    </h3>

                    <p
                        className="text-sm text-gray-500 mb-6"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Don’t have an account?{" "}
                        <Link to="/signup" className="text-blue-600 font-semibold">
                            Sign Up
                        </Link>
                    </p>

                    <input
                        type="email"
                        placeholder="user@example.com"
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        data-aos="fade-up"
                        data-aos-delay="200"
                    />

                    <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        data-aos="fade-up"
                        data-aos-delay="300"
                    />

                    <button
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 hover:scale-105 transition"
                        data-aos="zoom-in"
                        data-aos-delay="400"
                    >
                        Log In
                    </button>

                    <div
                        className="flex justify-between items-center mt-4 text-sm text-gray-600"
                        data-aos="fade-up"
                        data-aos-delay="500"
                    >
                        <label className="flex items-center gap-2">
                            <input type="checkbox" className="accent-blue-600" />
                            Keep me logged in
                        </label>
                        <a href="#" className="text-blue-600">
                            Forgot password?
                        </a>
                    </div>
                </div>

                {/* Right Side - Stylish 3x3 Grid */}
                <div className="hidden md:grid md:w-1/2 grid-cols-3 gap-3 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
                    <FlipCard img="https://randomuser.me/api/portraits/men/32.jpg" title="Manage" delay="100" animation="fade-up" />
                    <FlipCard img="https://randomuser.me/api/portraits/men/45.jpg" title="Time" delay="200" animation="zoom-in" />
                    <FlipCard img="https://randomuser.me/api/portraits/women/50.jpg" title="Team" delay="300" animation="flip-left" />
                    <FlipCard img="https://randomuser.me/api/portraits/women/52.jpg" title="Chat" delay="400" animation="fade-right" />
                    <FlipCard img="https://randomuser.me/api/portraits/group/3.jpg" title="Tasks" delay="500" animation="flip-right" />
                    <FlipCard img="https://randomuser.me/api/portraits/men/40.jpg" title="Files" delay="600" animation="fade-left" />
                    <FlipCard img="https://randomuser.me/api/portraits/men/60.jpg" title="Calendar" delay="700" animation="zoom-in" />
                    <FlipCard img="https://randomuser.me/api/portraits/women/61.jpg" title="Notes" delay="800" animation="fade-up" />
                    <FlipCard img="https://randomuser.me/api/portraits/group/4.jpg" title="Projects" delay="900" animation="flip-left" />
                </div>
            </div>
        </div>
    );
}

export default Login;
