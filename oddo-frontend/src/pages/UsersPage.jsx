import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/client";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", code: "" });
  const [showModal, setShowModal] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/invites/");
      setUsers(data);
    } catch (err) {
      setError("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle new invite
  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const { data } = await API.post("/invites/", form);
      setSuccess(data.message);
      setForm({ full_name: "", email: "", code: "" });
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError("Failed to send invite");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            👥 Users
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-900/30 hover:scale-105 hover:shadow-purple-900/40 transition"
          >
            + Send Invite
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {success && <p className="text-green-400 mb-4">{success}</p>}

        {/* User Table */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold mb-4 text-blue-300">
            User Invitations
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="pb-2">ID</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/10 hover:bg-white/10 transition"
                >
                  <td className="py-2">{u.id}</td>
                  <td>{u.full_name}</td>
                  <td className="text-blue-300">{u.email}</td>
                  <td className="font-mono text-xs">{u.code}</td>
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.status === "Used"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">
                    No invites found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="backdrop-blur-md bg-gradient-to-br from-gray-900/80 to-gray-800/70 border border-white/10 rounded-2xl shadow-2xl w-[90%] max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">
              Send New Invite
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Invite Code (e.g. EMP002)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow hover:scale-105 hover:shadow-blue-900/40 transition"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
