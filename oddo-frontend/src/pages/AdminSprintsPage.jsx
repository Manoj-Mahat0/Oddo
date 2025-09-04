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

  // Init AOS animations
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  // Fetch projects & sprints
  const fetchProjectsAndSprints = async () => {
    try {
      const { data } = await API.get("/projects/");
      const normalized = data.map((p) => ({
        ...p,
        id: p.project_id || p.id,
      }));
      setProjects(normalized);

      // fetch sprints per project
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

  // Add Sprint
  const handleAddSprint = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const project = projects.find((p) => p.id === Number(form.project_id));
    if (!project) {
      setError("❌ Please select a valid project");
      return;
    }

    // Validate sprint end date ≤ project deadline
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar fixed */}
      <div className="w-64 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Main content scrollable */}
      <main className="flex-1 h-screen overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🏃‍♂️ Sprints</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-2 shadow hover:scale-95 transition"
          >
            ➕ Create Sprint
          </button>
        </div>

        {error && <p className="text-red-500 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">{success}</p>}

        {/* Sprint Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((s) => {
            const project = projects.find((p) => p.id === s.project_id);
            return (
              <div
                key={s.id}
                data-aos="fade-up"
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {s.name} 🚀
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  📂 Project:{" "}
                  <span className="font-medium text-gray-700">
                    {project ? project.name : "N/A"}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  🟢 Start:{" "}
                  {s.start_date
                    ? new Date(s.start_date).toLocaleDateString()
                    : "Auto"}
                </p>
                <p className="text-sm text-gray-500 mb-2">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div
            data-aos="zoom-in"
            className="bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4">🆕 Create Sprint</h2>
            <form onSubmit={handleAddSprint} className="space-y-4">
              <input
                type="text"
                placeholder="Sprint Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <select
                value={form.project_id}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
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
