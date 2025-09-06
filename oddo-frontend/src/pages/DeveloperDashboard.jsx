import React from "react";
import DeveloperSidebar from "../components/DeveloperSidebar";

function DeveloperDashboard() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <DeveloperSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Page Title */}
        <h1 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          👨‍💻 Developer Dashboard
        </h1>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/60 backdrop-blur-xl border border-purple-800/30 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/30 transition">
            <h2 className="text-lg font-semibold mb-2 text-purple-300">
              📌 My Tasks
            </h2>
            <p className="text-gray-400">View and manage your assigned tasks.</p>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-purple-800/30 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/30 transition">
            <h2 className="text-lg font-semibold mb-2 text-purple-300">
              🚀 My Sprints
            </h2>
            <p className="text-gray-400">Track progress in ongoing sprints.</p>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-purple-800/30 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/30 transition">
            <h2 className="text-lg font-semibold mb-2 text-purple-300">
              📊 Reports
            </h2>
            <p className="text-gray-400">
              See performance and activity reports.
            </p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 rounded-2xl p-8 shadow-xl border border-purple-900/50">
          <h2 className="text-2xl font-bold">Welcome back, Developer! 🎉</h2>
          <p className="mt-2 text-gray-300">
            Stay focused on your work — manage tasks, check sprint status,
            and collaborate with your team.
          </p>
        </div>
      </main>
    </div>
  );
}

export default DeveloperDashboard;
