// src/pages/StaffDashboard.jsx
import React, { useState } from "react";
import StaffSidebar from "../components/StaffSidebar";
import PunchInModal from "../components/PunchInModal"; // make sure this exists

function StaffDashboard() {
  // Static mock data (kept as-is)
  const staff = [
    { id: 1, full_name: "Chinki", email: "c@gmail.com", role: "Staff" },
    { id: 2, full_name: "Manoj Mahato", email: "manoj@example.com", role: "Admin" },
    { id: 3, full_name: "Priya Sharma", email: "priya@example.com", role: "Tester" },
  ];

  // control punch-in modal (FAB)
  const [punchOpen, setPunchOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">👩‍🏫 Staff Dashboard</h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition-transform"
            >
              <h3 className="text-lg font-bold">{s.full_name}</h3>
              <p className="text-gray-400">{s.email}</p>
              <p className="text-sm text-indigo-400">{s.role}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button (FAB) for Attendance */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-center">
        <button
          onClick={() => setPunchOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl flex items-center justify-center text-white transform hover:-translate-y-1 transition"
          aria-label="Punch In"
          title="Punch In"
        >
          {/* plus icon (simple) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
          </svg>
        </button>

        <div className="mt-2 text-xs text-gray-200">Punch In</div>
      </div>

      {/* PunchInModal controlled by local state */}
      <PunchInModal initialOpen={punchOpen} onClose={() => setPunchOpen(false)} ssidPrefill="" />
    </div>
  );
}

export default StaffDashboard;
