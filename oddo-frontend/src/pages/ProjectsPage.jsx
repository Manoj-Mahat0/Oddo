import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/client";
import "aos/dist/aos.css";
import AOS from "aos";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [form, setForm] = useState({ name: "", description: "", deadline: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get("/projects/");
      const normalized = data.map((p) => ({
        ...p,
        id: p.project_id || p.id,
      }));
      setProjects(normalized);
    } catch (err) {
      setError("❌ Failed to fetch projects");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users/");
      setUsers(data);
    } catch (err) {
      setError("❌ Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const handleAddProject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true); // disable button
    try {
      const { data } = await API.post("/projects/", form);
      const newProj = { ...data, id: data.project_id || data.id };
      setProjects([...projects, newProj]);
      setForm({ name: "", description: "", deadline: "" });
      setShowModal(false);
      toast.success("✅ Project added successfully");
    } catch (err) {
      toast.error("❌ Failed to add project");
    } finally {
      setLoading(false); // enable button again
    }
  };


  const handleAddMember = async (userId) => {
    if (!selectedProject) return;
    try {
      const { data } = await API.post(
        `/projects/${selectedProject.id}/add-member/${userId}`
      );
      setSuccess(data.message);
      fetchProjects();
      setShowMemberModal(false);
    } catch (err) {
      setError("❌ Failed to add member");
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    try {
      const { data } = await API.delete(
        `/projects/${projectId}/remove-member/${userId}`
      );
      setSuccess(data.message);
      fetchProjects();
    } catch (err) {
      setError("❌ Failed to remove member");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-8 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            📂 Projects
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-2 shadow-lg hover:scale-95 hover:shadow-xl transition"
          >
            ➕ Add Project
          </button>
        </div>

        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}

        {/* Projects */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              data-aos="fade-up"
              className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-lg p-6 hover:bg-white/20 hover:shadow-2xl transition"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                {p.name} 🚀
              </h2>
              <p className="text-gray-300 mb-3">{p.description}</p>
              <p className="text-sm text-gray-400">
                ⏰ Deadline:{" "}
                <span className="font-medium text-blue-300">
                  {p.deadline
                    ? new Date(p.deadline).toLocaleDateString()
                    : "N/A"}
                </span>
              </p>
              <p className="text-sm text-gray-400 mb-4">
                📅 Created:{" "}
                {p.created_at
                  ? new Date(p.created_at).toLocaleDateString()
                  : "N/A"}
              </p>

              <div className="mb-3">
                <h3 className="font-semibold text-white mb-1">👥 Members:</h3>
                {p.members && p.members.length > 0 ? (
                  <ul className="space-y-1">
                    {p.members.map((m) => (
                      <li
                        key={m.id}
                        className="flex justify-between items-center bg-white/10 px-3 py-1 rounded-lg text-sm"
                      >
                        <span>
                          {m.code} ({m.role})
                        </span>
                        <button
                          onClick={() => handleRemoveMember(p.id, m.id)}
                          className="text-xs text-red-400 hover:text-red-500"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No members yet</p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedProject(p);
                  setShowMemberModal(true);
                }}
                className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:opacity-90 transition"
              >
                ➕ Add Member
              </button>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="text-center text-gray-400 mt-10">
            😔 No projects found
          </p>
        )}
      </main>

      {/* Add Project Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div
            data-aos="zoom-in"
            className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-lg w-[90%] max-w-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-white">
              🆕 Add Project
            </h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <input
                type="text"
                placeholder="Project Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Project Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              ></textarea>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 transition ${loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {loading ? "⏳ Adding..." : "✅ Add"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div
            data-aos="zoom-in"
            className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-lg w-[90%] max-w-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-white">
              ➕ Add Member to {selectedProject.name}
            </h2>

            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {users
                .filter(
                  (u) => !selectedProject.members.some((m) => m.id === u.id)
                )
                .map((u) => (
                  <li
                    key={u.id}
                    className="flex justify-between items-center bg-white/10 px-3 py-2 rounded-lg text-white"
                  >
                    <span>
                      {u.full_name} ({u.role})
                    </span>
                    <button
                      onClick={() => handleAddMember(u.id)}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      ✅ Add
                    </button>
                  </li>
                ))}

              {users.filter(
                (u) => !selectedProject.members.some((m) => m.id === u.id)
              ).length === 0 && (
                  <li className="text-center text-gray-400 text-sm py-3">
                    🙌 All users are already in this project
                  </li>
                )}
            </ul>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={5000} />

    </div>
  );
}

export default ProjectsPage;
