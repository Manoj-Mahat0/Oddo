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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0">
        <DeveloperSidebar />
      </div>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">🐞 My Bugs</h1>

        {/* Task Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Task</label>
          <select
            value={selectedTask?.id || ""}
            onChange={(e) => {
              const task = tasks.find((t) => t.id === Number(e.target.value));
              setSelectedTask(task);
              fetchBugs(task.id);
            }}
            className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.status})
              </option>
            ))}
          </select>
        </div>

        {/* Bug List */}
        {selectedTask && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Bugs for: {selectedTask.title}
            </h2>

            <ul className="space-y-2 mb-4">
              {bugs.map((bug) => (
                <li
                  key={bug.id}
                  className="flex justify-between items-center border rounded p-2"
                >
                  <span>{bug.description}</span>
                  <button
                    onClick={() => toggleStatus(bug)}
                    className={`px-2 py-1 text-xs rounded ${
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
                <p className="text-gray-500 text-sm">No bugs yet</p>
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
                className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700"
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
