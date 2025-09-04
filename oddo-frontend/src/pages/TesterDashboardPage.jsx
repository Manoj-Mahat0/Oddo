import React from "react";
import TesterSidebar from "../components/TesterSidebar";

function TesterDashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <TesterSidebar />
      </div>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800">🧪 Tester Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Card: Total Bugs */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold">🐞 Total Bugs</h2>
            <p className="text-2xl font-bold text-red-600 mt-2">12</p>
          </div>

          {/* Card: Open Bugs */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold">📌 Open Bugs</h2>
            <p className="text-2xl font-bold text-yellow-600 mt-2">5</p>
          </div>

          {/* Card: Closed Bugs */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold">✅ Closed Bugs</h2>
            <p className="text-2xl font-bold text-green-600 mt-2">7</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bug Reports</h2>
          <ul className="space-y-2">
            <li className="border rounded p-2 flex justify-between">
              Navbar not responsive <span className="text-red-500">Open</span>
            </li>
            <li className="border rounded p-2 flex justify-between">
              Footer link broken <span className="text-green-500">Closed</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default TesterDashboardPage;
