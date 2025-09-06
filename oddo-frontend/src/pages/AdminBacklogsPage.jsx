import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/client";
import AOS from "aos";
import "aos/dist/aos.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";

function DragPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function AdminBacklogsPage() {
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sprint_id: "",
    assigned_to: "",
  });

  const statuses = [
    { name: "Backlog", color: "gray" },
    { name: "In Progress", color: "blue" },
    { name: "Deployed", color: "purple" },
    { name: "Testing", color: "yellow" },
    { name: "Merged", color: "orange" },
    { name: "Done", color: "green" },
  ];

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: "ease-in-out" });
    fetchSprints();
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchSprints = async () => {
    try {
      const { data } = await API.get("/sprints/");
      setSprints(data);
      if (data.length > 0) setActiveSprint(data[0].id);
    } catch {
      setError("❌ Failed to fetch sprints");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users/");
      setUsers(data);
    } catch {
      setError("❌ Failed to fetch users");
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await API.get("/tasks/full");
      setTasks(data);
    } catch {
      setError("❌ Failed to fetch tasks");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/tasks/", {
        title: form.title,
        description: form.description,
        sprint_id: Number(form.sprint_id),
        assigned_to: Number(form.assigned_to),
      });
      setTasks([...tasks, data]);
      setForm({ title: "", description: "", sprint_id: "", assigned_to: "" });
      setShowModal(false);
      setSuccess("✅ Task created successfully");
    } catch {
      setError("❌ Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(
        tasks.map((t) =>
          t.task_id === taskId ? { ...t, status: newStatus } : t
        )
      );
    } catch {
      setError("❌ Failed to update task status");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const taskId = Number(result.draggableId);
    const newStatus = result.destination.droppableId;
    updateTaskStatus(taskId, newStatus);
  };

  const getColor = (color, variant = "header") => {
    const map = {
      gray: {
        header: "bg-gray-700 text-gray-100",
        card: "bg-gray-800 border border-gray-600 text-gray-100",
      },
      blue: {
        header: "bg-blue-700 text-white",
        card: "bg-blue-900/60 border border-blue-500 text-blue-100",
      },
      purple: {
        header: "bg-purple-700 text-white",
        card: "bg-purple-900/60 border border-purple-500 text-purple-100",
      },
      yellow: {
        header: "bg-yellow-600 text-black",
        card: "bg-yellow-800/60 border border-yellow-500 text-yellow-100",
      },
      orange: {
        header: "bg-orange-700 text-white",
        card: "bg-orange-900/60 border border-orange-500 text-orange-100",
      },
      green: {
        header: "bg-green-700 text-white",
        card: "bg-green-900/60 border border-green-500 text-green-100",
      },
    };
    return map[color][variant];
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 h-screen sticky top-0 border-r border-white/10 bg-black/40 backdrop-blur-xl shadow-lg">
        <Sidebar />
      </div>

      {/* Main */}
      <main className="flex-1 h-screen overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2 drop-shadow-lg">
            📌 Backlogs
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-2 shadow-lg hover:scale-95 transition"
          >
            ➕ Add Task
          </button>
        </div>

        {error && <p className="text-red-400 font-medium">{error}</p>}
        {success && <p className="text-green-400 font-medium">{success}</p>}

        {/* Sprint Tabs */}
        <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md py-3">
          <div className="flex gap-3 border-b border-white/10 pb-3 overflow-x-auto">
            {sprints.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSprint(s.id)}
                className={`px-5 py-2 rounded-full font-semibold transition-all ${
                  activeSprint === s.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        {activeSprint && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max mt-6">
                {statuses.map(({ name, color }) => (
                  <Droppable key={name} droppableId={name}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="w-72 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-4 shadow-lg min-h-[500px] flex flex-col gap-4"
                        data-aos="fade-up"
                      >
                        {/* Column Header */}
                        <h3
                          className={`text-sm font-bold mb-2 px-3 py-1 rounded-full inline-block ${getColor(
                            color,
                            "header"
                          )}`}
                        >
                          {name}
                        </h3>

                        {/* Tasks */}
                        <div className="flex-1 flex flex-col gap-4">
                          {tasks
                            .filter(
                              (t) =>
                                t.status === name &&
                                t.sprint_id === activeSprint
                            )
                            .map((t, index) => {
                              const user = users.find(
                                (u) => u.id === t.assigned_to
                              );
                              return (
                                <Draggable
                                  key={t.task_id}
                                  draggableId={String(t.task_id)}
                                  index={index}
                                >
                                  {(provided, snapshot) => {
                                    const card = (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`rounded-xl p-4 shadow-md hover:shadow-xl transition-all cursor-grab ${getColor(
                                          color,
                                          "card"
                                        )} ${
                                          snapshot.isDragging
                                            ? "z-[99999] scale-105 shadow-2xl"
                                            : ""
                                        }`}
                                        style={{
                                          ...provided.draggableProps.style,
                                          width: snapshot.isDragging
                                            ? "280px"
                                            : "100%",
                                        }}
                                      >
                                        <div className="flex justify-between items-start">
                                          <h4 className="font-semibold">
                                            {t.title}
                                          </h4>
                                          <span className="px-2 py-1 text-xs rounded-full bg-white/20 border border-white/20">
                                            {t.status}
                                          </span>
                                        </div>

                                        <p className="text-sm opacity-80 mt-1">
                                          {t.description}
                                        </p>

                                        {user && (
                                          <div className="flex items-center mt-3 gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs">
                                              {user.full_name.charAt(0)}
                                            </div>
                                            <span className="text-xs opacity-80 font-medium">
                                              {user.full_name}
                                            </span>
                                          </div>
                                        )}

                                        {t.bugs?.length > 0 && (
                                          <div className="mt-3">
                                            <span className="text-xs px-2 py-1 rounded bg-red-500/30 text-red-300 font-medium">
                                              🐞 {t.bugs.length} Bugs
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                    return snapshot.isDragging ? (
                                      <DragPortal>{card}</DragPortal>
                                    ) : (
                                      card
                                    );
                                  }}
                                </Draggable>
                              );
                            })}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl shadow-2xl w-[90%] max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">🆕 Add Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
                required
              ></textarea>
              <select
                value={form.sprint_id}
                onChange={(e) =>
                  setForm({ ...form, sprint_id: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Select Sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={form.assigned_to}
                onChange={(e) =>
                  setForm({ ...form, assigned_to: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Assign User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
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
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition"
                >
                  ✅ Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBacklogsPage;
