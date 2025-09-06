import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/client";
import "aos/dist/aos.css";
import AOS from "aos";

function AdminSprintsPage() {
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    project_id: "",
    end_date: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchProjectsAndSprints = async () => {
    try {
      const { data } = await API.get("/projects/");
      const normalized = data.map((p) => ({
        ...p,
        id: p.project_id || p.id,
      }));
      setProjects(normalized);

      let allSprints = [];
      for (let project of normalized) {
        try {
          const { data: sprintData } = await API.get(`/sprints/${project.id}`);
          allSprints = [...allSprints, ...sprintData];
        } catch (err) {
          console.warn(`No sprints for project ${project.id}`);
        }
      }
      setSprints(allSprints);
    } catch (err) {
      setError("❌ Failed to fetch projects/sprints");
    }
  };

  useEffect(() => {
    fetchProjectsAndSprints();
  }, []);

  const handleAddSprint = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const project = projects.find((p) => p.id === Number(form.project_id));
    if (!project) {
      setError("❌ Please select a valid project");
      return;
    }

    if (new Date(form.end_date) > new Date(project.deadline)) {
      setError("⚠️ Sprint end date cannot exceed project deadline");
      return;
    }

    try {
      const { data } = await API.post("/sprints/", {
        name: form.name,
        project_id: Number(form.project_id),
        end_date: form.end_date,
      });
      setSprints([...sprints, data]);
      setForm({ name: "", project_id: "", end_date: "" });
      setShowModal(false);
      setSuccess("✅ Sprint created successfully");
    } catch (err) {
      setError("❌ Failed to create sprint");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 h-screen overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            🏃‍♂️ Sprints
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-2 shadow-lg hover:scale-95 hover:shadow-xl transition"
          >
            ➕ Create Sprint
          </button>
        </div>

        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}

        {/* Sprint Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((s) => {
            const project = projects.find((p) => p.id === s.project_id);
            return (
              <div
                key={s.id}
                data-aos="fade-up"
                className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-lg p-6 hover:bg-white/20 hover:shadow-2xl transition"
              >
                <h2 className="text-xl font-bold text-white mb-2">
                  {s.name} 🚀
                </h2>
                <p className="text-sm text-gray-300 mb-2">
                  📂 Project:{" "}
                  <span className="font-medium text-blue-300">
                    {project ? project.name : "N/A"}
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  🟢 Start:{" "}
                  {s.start_date
                    ? new Date(s.start_date).toLocaleDateString()
                    : "Auto"}
                </p>
                <p className="text-sm text-gray-400">
                  🔴 End: {new Date(s.end_date).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>

        {sprints.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            😔 No sprints created yet
          </p>
        )}
      </main>

      {/* Add Sprint Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div
            data-aos="zoom-in"
            className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-lg w-[90%] max-w-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-white">
              🆕 Create Sprint
            </h2>
            <form onSubmit={handleAddSprint} className="space-y-4">
              <input
                type="text"
                placeholder="Sprint Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <select
                value={form.project_id}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Deadline:{" "}
                    {new Date(p.deadline).toLocaleDateString()})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
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
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 transition"
                >
                  ✅ Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSprintsPage;
