import React, { useState, useEffect } from "react";
import StudentSidebar from "../components/StudentSidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// StudentDashboard.jsx (minimal + card + simple chart)
// - Uses Tailwind for layout
// - Uses recharts for a simple line chart (mock data)
// - Replace mock data / toggle with real API later

export default function StudentDashboard() {
  const [active, setActive] = useState("classes");
  const [classes] = useState([{ id: 1, name: "10th - A" }]);
  const [assignments] = useState([{ id: 1, title: "Sample Assignment", due: "2025-09-12" }]);

  // mock chart data: weekly submissions / activity
  const data = [
    { name: "Mon", submissions: 4, pending: 2 },
    { name: "Tue", submissions: 7, pending: 3 },
    { name: "Wed", submissions: 3, pending: 1 },
    { name: "Thu", submissions: 6, pending: 2 },
    { name: "Fri", submissions: 8, pending: 0 },
    { name: "Sat", submissions: 2, pending: 1 },
    { name: "Sun", submissions: 5, pending: 2 },
  ];

  const handleLogout = () => {
    console.log("logout");
    // implement token clear + redirect in your app
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <StudentSidebar onLogout={handleLogout} />

      <main className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Student Dashboard</h1>
          <div className="text-sm text-gray-600">Welcome back 👋</div>
        </header>

        {/* Top cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Classes</div>
            <div className="text-2xl font-bold mt-2">{classes.length}</div>
            <div className="text-xs text-gray-400 mt-2">Active this term</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pending Assignments</div>
            <div className="text-2xl font-bold mt-2">{assignments.filter(a => a.due >= new Date().toISOString().slice(0,10)).length}</div>
            <div className="text-xs text-gray-400 mt-2">Due soon</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Profile</div>
            <div className="text-lg font-medium mt-2">Student Name</div>
            <div className="text-xs text-gray-400 mt-1">Roll: 23</div>
          </div>
        </section>

        {/* Chart + activity card */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Weekly Activity</h2>
              <div className="text-xs text-gray-500">Submissions vs Pending</div>
            </div>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="submissions" stroke="#4f46e5" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-2">Recent Assignments</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              {assignments.map((a) => (
                <li key={a.id} className="border rounded p-2">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500">Due: {a.due}</div>
                </li>
              ))}
              {assignments.length === 0 && <li className="text-gray-500">No recent assignments</li>}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
