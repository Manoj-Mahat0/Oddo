import React from "react";
import DeveloperSidebar from "../components/DeveloperSidebar";

function DeveloperDashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <DeveloperSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">👨‍💻 Developer Dashboard</h1>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition">
            <h2 className="text-lg font-semibold mb-2">📌 My Tasks</h2>
            <p className="text-gray-600">View and manage your assigned tasks.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition">
            <h2 className="text-lg font-semibold mb-2">🚀 My Sprints</h2>
            <p className="text-gray-600">Track progress in ongoing sprints.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition">
            <h2 className="text-lg font-semibold mb-2">📊 Reports</h2>
            <p className="text-gray-600">See performance and activity reports.</p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <h2 className="text-2xl font-bold">Welcome back, Developer! 🎉</h2>
          <p className="mt-2 text-white/90">
            Stay focused on your work — manage tasks, check sprint status,
            and collaborate with your team.
          </p>
        </div>
      </main>
    </div>
  );
}

export default DeveloperDashboard;
