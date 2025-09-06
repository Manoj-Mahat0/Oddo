import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/client";

// ✅ Updated Toast Component
function Toast({ title, message, type = "success", onClose, actions = [] }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg =
    type === "success"
      ? "bg-gray-800 border-green-500"
      : type === "error"
      ? "bg-gray-800 border-red-500"
      : "bg-gray-800 border-blue-500";

  const icon =
    type === "success" ? "✔️" : type === "error" ? "❌" : "ℹ️";

  return (
    <div
      className={`fixed bottom-4 right-4 w-[300px] border-l-4 ${bg} text-white px-4 py-3 rounded-lg shadow-lg flex flex-col gap-2 animate-fade-in`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-400 font-bold"
        >
          ✕
        </button>
      </div>
      <div className="text-sm">{message}</div>
      {actions.length > 0 && (
        <div className="flex justify-end gap-2 pt-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ full_name: "", email: "", code: "" });
  const [showModal, setShowModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    actions: [],
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/invites/");
      setUsers(data);
    } catch (err) {
      setToast({
        show: true,
        title: "Error",
        message: "Failed to fetch users",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/invites/", form);
      setToast({
        show: true,
        title: `"${form.full_name}" details updated`,
        message: data.message || "Details have been successfully updated.",
        type: "success",
        actions: [
          { label: "Undo", onClick: () => alert("Undo clicked") },
          { label: "View profile", onClick: () => alert("View profile clicked") },
        ],
      });
      setForm({ full_name: "", email: "", code: "" });
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setToast({
        show: true,
        title: "Error",
        message: "Failed to send invite",
        type: "error",
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

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
              {currentUsers.map((u) => (
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

          {/* Pagination Buttons */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
                disabled={currentPage === 1}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === idx + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
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
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Invite Code (e.g. EMP002)"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
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

      {/* Toast Render */}
      {toast.show && (
        <Toast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          actions={toast.actions}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

export default UsersPage;
