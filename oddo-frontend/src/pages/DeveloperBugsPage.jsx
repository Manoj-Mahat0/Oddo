import React, { useEffect, useState } from "react";
import DeveloperSidebar from "../components/DeveloperSidebar";
import API from "../api/client";

function DeveloperBugsPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [newBug, setNewBug] = useState("");

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const { data } = await API.get("/tasks/my");
      setTasks(data);
      if (data.length > 0) {
        setSelectedTask(data[0]);
        fetchBugs(data[0].id);
      }
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

  const addBug = async (e) => {
    e.preventDefault();
    if (!newBug.trim() || !selectedTask) return;
    try {
      const { data } = await API.post("/bugs/", {
        task_id: selectedTask.id,
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
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <DeveloperSidebar />
      </div>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">🐞 My Bugs</h1>

        {/* Task Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-white/80">
            Select Task
          </label>
          <select
            value={selectedTask?.id || ""}
            onChange={(e) => {
              const task = tasks.find((t) => t.id === Number(e.target.value));
              setSelectedTask(task);
              fetchBugs(task.id);
            }}
            className="w-full md:w-1/2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-gray-900 text-white">
                {t.title} ({t.status})
              </option>
            ))}
          </select>
        </div>

        {/* Bug List */}
        {selectedTask && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">
              Bugs for: {selectedTask.title}
            </h2>

            <ul className="space-y-2 mb-4">
              {bugs.map((bug) => (
                <li
                  key={bug.id}
                  className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-2 border border-white/10"
                >
                  <span>{bug.description}</span>
                  <button
                    onClick={() => toggleStatus(bug)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                      bug.status === "Open"
                        ? "bg-red-500/30 text-red-300 hover:bg-red-500/50"
                        : "bg-green-500/30 text-green-300 hover:bg-green-500/50"
                    }`}
                  >
                    {bug.status}
                  </button>
                </li>
              ))}
              {bugs.length === 0 && (
                <p className="text-white/60 text-sm">No bugs yet</p>
              )}
            </ul>

            {/* Add Bug */}
            <form onSubmit={addBug} className="flex gap-2">
              <input
                type="text"
                placeholder="New bug description"
                value={newBug}
                onChange={(e) => setNewBug(e.target.value)}
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
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

export default DeveloperBugsPage;
