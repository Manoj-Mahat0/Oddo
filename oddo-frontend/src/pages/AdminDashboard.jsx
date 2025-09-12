import React from "react";
import Sidebar from "../components/Sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Briefcase,
  DollarSign,
  CheckSquare,
} from "lucide-react";

const lineData = [
  { name: "Jan", Users: 400, Projects: 240 },
  { name: "Feb", Users: 300, Projects: 139 },
  { name: "Mar", Users: 200, Projects: 980 },
  { name: "Apr", Users: 278, Projects: 390 },
  { name: "May", Users: 189, Projects: 480 },
  { name: "Jun", Users: 239, Projects: 380 },
];

const barData = [
  { name: "Q1", Revenue: 4000 },
  { name: "Q2", Revenue: 3000 },
  { name: "Q3", Revenue: 5000 },
  { name: "Q4", Revenue: 2780 },
];

const pieData = [
  { name: "Completed", value: 400 },
  { name: "Pending", value: 300 },
  { name: "Ongoing", value: 300 },
];

const COLORS = ["#22c55e", "#facc15", "#3b82f6"];

function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
            <div className="flex items-center space-x-4">
              <Users className="w-10 h-10 opacity-90" />
              <div>
                <h3 className="text-sm text-gray-200">Total Users</h3>
                <p className="text-2xl font-bold">12,345</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
            <div className="flex items-center space-x-4">
              <Briefcase className="w-10 h-10 opacity-90" />
              <div>
                <h3 className="text-sm text-gray-200">Active Projects</h3>
                <p className="text-2xl font-bold">245</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
            <div className="flex items-center space-x-4">
              <DollarSign className="w-10 h-10 opacity-90" />
              <div>
                <h3 className="text-sm text-gray-200">Revenue</h3>
                <p className="text-2xl font-bold">$89,500</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
            <div className="flex items-center space-x-4">
              <CheckSquare className="w-10 h-10 opacity-90" />
              <div>
                <h3 className="text-sm text-gray-200">Open Tasks</h3>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </div>
        </div>
        

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <div className="bg-white/10 backdrop-blur-lg border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transition">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Users & Projects Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff" }} />
                <Legend />
                <Line type="monotone" dataKey="Users" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Projects" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white/10 backdrop-blur-lg border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-purple-500/30 transition">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">Quarterly Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff" }} />
                <Bar dataKey="Revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white/10 backdrop-blur-lg border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-green-500/30 transition">
            <h3 className="text-lg font-semibold mb-4 text-green-400">Task Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-lg border border-gray-700 p-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transition">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Recent Activity</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-300 border-b border-gray-700">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700 hover:bg-white/5">
                  <td className="py-2">John Doe</td>
                  <td>Created project</td>
                  <td>2h ago</td>
                </tr>
                <tr className="border-b border-gray-700 hover:bg-white/5">
                  <td className="py-2">Jane Smith</td>
                  <td>Updated task</td>
                  <td>3h ago</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-2">Alice</td>
                  <td>Added new user</td>
                  <td>5h ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
