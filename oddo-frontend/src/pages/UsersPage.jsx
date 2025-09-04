import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/client";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", code: "" }); // <-- added code
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
      const { data } = await API.post("/invites/", form); // now includes code
      setSuccess(data.message);
      setForm({ full_name: "", email: "", code: "" }); // reset form
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError("Failed to send invite");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">👥 Users</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 shadow hover:bg-blue-700 transition"
          >
            + Send Invite
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        {/* User List */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Invitations</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="pb-2">ID</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td className="font-mono text-xs">{u.code}</td>
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.status === "Used"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Send New Invite</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {/* NEW CODE FIELD */}
              <input
                type="text"
                placeholder="Invite Code (e.g. EMP002)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
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
