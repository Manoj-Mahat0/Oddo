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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <TesterSidebar />
      </div>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🐞 Tester Bugs</h1>

        {/* Selectors */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Project */}
          <div>
            <label className="block text-sm font-medium mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
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
          <div>
            <label className="block text-sm font-medium mb-2">Sprint</label>
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
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
          <div>
            <label className="block text-sm font-medium mb-2">Task</label>
            <select
              value={selectedTask}
              onChange={(e) => handleTaskSelect(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
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
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Bugs for Task {selectedTask}
            </h2>
            <ul className="space-y-2 mb-4">
              {bugs.map((bug) => (
                <li
                  key={bug.id}
                  className="flex justify-between items-center border rounded p-3"
                >
                  <div>
                    <p className="font-medium">{bug.description}</p>
                    <p className="text-sm text-gray-500">
                      Reported: {new Date(bug.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStatus(bug)}
                    className={`px-3 py-1 text-sm rounded ${
                      bug.status === "Open"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {bug.status}
                  </button>
                </li>
              ))}
              {bugs.length === 0 && (
                <p className="text-gray-500">No bugs found for this task</p>
              )}
            </ul>

            {/* Add Bug */}
            <form onSubmit={addBug} className="flex gap-2">
              <input
                type="text"
                placeholder="New bug description"
                value={newBug}
                onChange={(e) => setNewBug(e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                required
              />
              <button
                type="submit"
                className="bg-pink-600 text-white px-4 py-2 rounded-lg shadow hover:bg-pink-700"
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
