import React from "react";
import StaffSidebar from "../components/StaffSidebar";

function StaffDashboard() {
  // Static mock data
  const staff = [
    { id: 1, full_name: "Chinki", email: "c@gmail.com", role: "Staff" },
    { id: 2, full_name: "Manoj Mahato", email: "manoj@example.com", role: "Admin" },
    { id: 3, full_name: "Priya Sharma", email: "priya@example.com", role: "Tester" },
  ];

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
    </div>
  );
}

export default StaffDashboard;
