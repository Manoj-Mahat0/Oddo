import React from "react";
import TesterSidebar from "../components/TesterSidebar";

function TesterDashboardPage() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-[#0a0a0f] to-[#0f172a] text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <TesterSidebar />
      </div>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          🧪 Tester Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Card: Total Bugs */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/10 hover:scale-105 transition">
            <h2 className="text-lg font-semibold text-white/90">🐞 Total Bugs</h2>
            <p className="text-3xl font-bold text-red-400 mt-2">12</p>
          </div>

          {/* Card: Open Bugs */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/10 hover:scale-105 transition">
            <h2 className="text-lg font-semibold text-white/90">📌 Open Bugs</h2>
            <p className="text-3xl font-bold text-yellow-400 mt-2">5</p>
          </div>

          {/* Card: Closed Bugs */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/10 hover:scale-105 transition">
            <h2 className="text-lg font-semibold text-white/90">✅ Closed Bugs</h2>
            <p className="text-3xl font-bold text-green-400 mt-2">7</p>
          </div>
        </div>

        {/* Recent Bugs Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white/90">
            Recent Bug Reports
          </h2>
          <ul className="space-y-2">
            <li className="border border-white/10 rounded-xl p-3 flex justify-between bg-white/5 hover:bg-white/10 transition">
              Navbar not responsive <span className="text-red-400">Open</span>
            </li>
            <li className="border border-white/10 rounded-xl p-3 flex justify-between bg-white/5 hover:bg-white/10 transition">
              Footer link broken <span className="text-green-400">Closed</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default TesterDashboardPage;
