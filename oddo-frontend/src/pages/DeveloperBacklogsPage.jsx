import React, { useEffect, useState } from "react";
import DeveloperSidebar from "../components/DeveloperSidebar";
import API from "../api/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";

function DragPortal({ children }) {
    if (typeof document === "undefined") return null;
    return createPortal(children, document.body);
}

function DeveloperBacklogsPage() {
    const [projects, setProjects] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [activeSprint, setActiveSprint] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", sprint_id: "" });

    const statuses = [
        { name: "Backlog", color: "gray" },
        { name: "In Progress", color: "blue" },
        { name: "Deployed", color: "purple" },
        { name: "Testing", color: "yellow" },
        { name: "Merged", color: "orange" },
        { name: "Done", color: "green" },
    ];

    useEffect(() => {
        fetchDeveloperData();
    }, []);

    const fetchDeveloperData = async () => {
        try {
            const { data } = await API.get("/me/projects/full");
            setProjects(data.projects);
            const sprintsData = data.projects[0]?.sprints || [];
            setSprints(sprintsData);
            setActiveSprint(sprintsData[0]?.sprint_id || null);
        } catch (e) {
            console.error("❌ Failed to fetch developer projects", e);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post("/tasks/", {
                title: form.title,
                description: form.description,
                sprint_id: Number(form.sprint_id),
                assigned_to: Number(localStorage.getItem("id")),
            });

            setSprints(
                sprints.map((s) =>
                    s.sprint_id === Number(form.sprint_id)
                        ? { ...s, tasks: [...s.tasks, data] }
                        : s
                )
            );

            setForm({ title: "", description: "", sprint_id: "" });
            setShowModal(false);
        } catch (err) {
            console.error("❌ Failed to create task", err);
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            await API.put(`/tasks/${taskId}/status`, { status: newStatus });
            setSprints(
                sprints.map((s) => ({
                    ...s,
                    tasks: s.tasks.map((t) =>
                        t.task_id === taskId ? { ...t, status: newStatus } : t
                    ),
                }))
            );
        } catch (e) {
            console.error("❌ Failed to update status", e);
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
                header: "bg-blue-700 text-blue-100",
                card: "bg-blue-800 border border-blue-600 text-blue-100",
            },
            purple: {
                header: "bg-purple-700 text-purple-100",
                card: "bg-purple-800 border border-purple-600 text-purple-100",
            },
            yellow: {
                header: "bg-yellow-600 text-yellow-50",
                card: "bg-yellow-700 border border-yellow-500 text-yellow-50",
            },
            orange: {
                header: "bg-orange-700 text-orange-100",
                card: "bg-orange-800 border border-orange-600 text-orange-100",
            },
            green: {
                header: "bg-green-700 text-green-100",
                card: "bg-green-800 border border-green-600 text-green-100",
            },
        };
        return map[color][variant];
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
            {/* Sidebar */}
            <div className="w-64 h-screen sticky top-0">
                <DeveloperSidebar />
            </div>

            {/* Main */}
            <main className="flex-1 h-screen overflow-y-auto p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        👨‍💻 Developer Backlogs
                    </h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-6 py-2 shadow hover:scale-95 transition"
                    >
                        ➕ Add Task
                    </button>
                </div>

                {/* Project Info */}
                {projects.map((p) => (
                    <div key={p.project_id} className="mb-4">
                        <h2 className="text-xl font-semibold text-purple-300">{p.name}</h2>
                        <p className="text-gray-400">{p.description}</p>
                    </div>
                ))}

                {/* Sprint Tabs */}
                <div className="flex gap-3 border-b border-gray-700 pb-2 overflow-x-auto">
                    {sprints.map((s) => (
                        <button
                            key={s.sprint_id}
                            onClick={() => setActiveSprint(s.sprint_id)}
                            className={`px-4 py-2 rounded-full font-medium transition ${activeSprint === s.sprint_id
                                    ? "bg-purple-700 text-white"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                }`}
                        >
                            {s.name}
                        </button>
                    ))}
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
                                                className="w-72 bg-black/50 backdrop-blur-xl rounded-xl shadow-lg p-4 flex flex-col gap-4 min-h-[500px] border border-gray-700"
                                            >
                                                {/* Column Header */}
                                                <h3
                                                    className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${getColor(
                                                        color,
                                                        "header"
                                                    )}`}
                                                >
                                                    {name}
                                                </h3>

                                                {/* Tasks */}
                                                <div className="flex-1 flex flex-col gap-4">
                                                    {sprints
                                                        .find((sp) => sp.sprint_id === activeSprint)
                                                        ?.tasks.filter((t) => t.status === name)
                                                        .map((t, index) => (
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
                                                                            className={`rounded-lg p-4 shadow-md hover:shadow-purple-500/20 transition cursor-grab ${getColor(
                                                                                color,
                                                                                "card"
                                                                            )} ${snapshot.isDragging
                                                                                    ? "z-[99999] scale-105 shadow-xl fixed"
                                                                                    : ""
                                                                                }`}
                                                                            style={{
                                                                                ...provided.draggableProps.style,
                                                                                width: "250px",
                                                                                pointerEvents: "auto",
                                                                            }}
                                                                        >
                                                                            <div className="flex justify-between items-center">
                                                                                <h4 className="font-semibold">
                                                                                    {t.title}
                                                                                </h4>
                                                                                <span
                                                                                    className={`px-2 py-1 text-xs rounded-full ${getColor(
                                                                                        color,
                                                                                        "header"
                                                                                    )}`}
                                                                                >
                                                                                    {t.status}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm mt-1">
                                                                                {t.description}
                                                                            </p>

                                                                            {t.bugs?.filter((b) => b.status === "Open").length > 0 && (
                                                                                <div className="mt-3">
                                                                                    <span className="text-xs px-2 py-1 rounded bg-red-700 text-red-100 font-medium">
                                                                                        🐞 {t.bugs.filter((b) => b.status === "Open").length} Open Bugs
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
                                                        ))}
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
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                    <div className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-xl w-[90%] max-w-md p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-purple-300 mb-4">🆕 Add Task</h2>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                                className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                rows="3"
                                required
                            ></textarea>
                            <select
                                value={form.sprint_id}
                                onChange={(e) =>
                                    setForm({ ...form, sprint_id: e.target.value })
                                }
                                className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="">Select Sprint</option>
                                {sprints.map((s) => (
                                    <option key={s.sprint_id} value={s.sprint_id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                                >
                                    ❌ Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow hover:scale-95 transition"
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

export default DeveloperBacklogsPage;
