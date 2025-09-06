import React, { useEffect, useState } from "react";
import TesterSidebar from "../components/TesterSidebar";
import API from "../api/client";

function TesterBugsPage() {
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedTask, setSelectedTask] = useState("");

  const [newBug, setNewBug] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchSprints();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get("/projects/");
      setProjects(data);
    } catch (err) {
      console.error("❌ Failed to fetch projects", err);
    }
  };

  const fetchSprints = async () => {
    try {
      const { data } = await API.get("/sprints/");
      setSprints(data);
    } catch (err) {
      console.error("❌ Failed to fetch sprints", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await API.get("/tasks/");
      setTasks(data);
    } catch (err) {
      console.error("❌ Failed to fetch tasks", err);
    }
  };

  const fetchBugs = async (taskId) => {
    try {
      const { data } = await API.get(`/bugs/${taskId}`);
      setBugs(data);
    } catch (err) {
      console.error("❌ Failed to fetch bugs", err);
    }
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTask(taskId);
    fetchBugs(taskId);
  };

  const addBug = async (e) => {
    e.preventDefault();
    if (!newBug.trim() || !selectedTask) return;
    try {
      const { data } = await API.post("/bugs/", {
        task_id: Number(selectedTask),
        description: newBug,
      });
      setBugs([...bugs, data]);
      setNewBug("");
    } catch (err) {
      console.error("❌ Failed to create bug", err);
    }
  };

  const toggleStatus = async (bug) => {
    const newStatus = bug.status === "Open" ? "Closed" : "Open";
    try {
      await API.put(`/bugs/${bug.id}/status`, { status: newStatus });
      setBugs(
        bugs.map((b) => (b.id === bug.id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error("❌ Failed to update bug status", err);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-[#0a0a0f] to-[#0f172a] text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <TesterSidebar />
      </div>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
          🐞 Tester Bugs
        </h1>

        {/* Selectors */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Project */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <label className="block text-sm font-medium mb-2 text-white/80">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/40 text-white border border-white/20 focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sprint */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <label className="block text-sm font-medium mb-2 text-white/80">
              Sprint
            </label>
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/40 text-white border border-white/20 focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="">Select Sprint</option>
              {sprints
                .filter((s) => !selectedProject || s.project_id === Number(selectedProject))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Task */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <label className="block text-sm font-medium mb-2 text-white/80">
              Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => handleTaskSelect(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/40 text-white border border-white/20 focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="">Select Task</option>
              {tasks
                .filter((t) => !selectedSprint || t.sprint_id === Number(selectedSprint))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Bug List */}
        {selectedTask && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-white/90">
              Bugs for Task {selectedTask}
            </h2>
            <ul className="space-y-2 mb-4">
              {bugs.map((bug) => (
                <li
                  key={bug.id}
                  className="flex justify-between items-center border border-white/10 rounded-xl p-3 bg-white/5 hover:bg-white/10 transition"
                >
                  <div>
                    <p className="font-medium">{bug.description}</p>
                    <p className="text-sm text-white/60">
                      Reported: {new Date(bug.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStatus(bug)}
                    className={`px-3 py-1 text-sm rounded-lg shadow transition ${
                      bug.status === "Open"
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    }`}
                  >
                    {bug.status}
                  </button>
                </li>
              ))}
              {bugs.length === 0 && (
                <p className="text-white/60">No bugs found for this task</p>
              )}
            </ul>

            {/* Add Bug */}
            <form onSubmit={addBug} className="flex gap-2">
              <input
                type="text"
                placeholder="New bug description"
                value={newBug}
                onChange={(e) => setNewBug(e.target.value)}
                className="flex-1 bg-black/40 text-white border border-white/20 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow hover:from-pink-600 hover:to-purple-700 transition"
              >
                ➕ Add
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default TesterBugsPage;
