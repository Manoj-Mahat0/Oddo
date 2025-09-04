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
                assigned_to: Number(localStorage.getItem("id")), // 👈 assign logged-in user
            });

            // Add task into sprint locally
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
                header: "bg-gray-100 text-gray-700",
                card: "bg-gray-50 border border-gray-200",
            },
            blue: {
                header: "bg-blue-100 text-blue-700",
                card: "bg-blue-50 border border-blue-200",
            },
            purple: {
                header: "bg-purple-100 text-purple-700",
                card: "bg-purple-50 border border-purple-200",
            },
            yellow: {
                header: "bg-yellow-100 text-yellow-700",
                card: "bg-yellow-50 border border-yellow-200",
            },
            orange: {
                header: "bg-orange-100 text-orange-700",
                card: "bg-orange-50 border border-orange-200",
            },
            green: {
                header: "bg-green-100 text-green-700",
                card: "bg-green-50 border border-green-200",
            },
        };
        return map[color][variant];
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">
            {/* Sidebar */}
            <div className="w-64 h-screen sticky top-0">
                <DeveloperSidebar />
            </div>

            {/* Main */}
            <main className="flex-1 h-screen overflow-y-auto p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                        👨‍💻 Developer Backlogs
                    </h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-2 shadow hover:scale-95 transition"
                    >
                        ➕ Add Task
                    </button>
                </div>

                {/* Project Info */}
                {projects.map((p) => (
                    <div key={p.project_id} className="mb-4">
                        <h2 className="text-xl font-semibold">{p.name}</h2>
                        <p className="text-gray-600">{p.description}</p>
                    </div>
                ))}

                {/* Sprint Tabs */}
                <div className="flex gap-3 border-b pb-2 overflow-x-auto">
                    {sprints.map((s) => (
                        <button
                            key={s.sprint_id}
                            onClick={() => setActiveSprint(s.sprint_id)}
                            className={`px-4 py-2 rounded-full font-medium ${activeSprint === s.sprint_id
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                                                className="w-72 bg-white rounded-xl shadow p-4 flex flex-col gap-4 min-h-[500px]"
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
                                                                            className={`rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-grab ${getColor(
                                                                                color,
                                                                                "card"
                                                                            )} ${snapshot.isDragging
                                                                                    ? "z-[99999] scale-105 shadow-xl fixed"
                                                                                    : ""
                                                                                }`}
                                                                            style={{
                                                                                ...provided.draggableProps.style,
                                                                                width: "250px", // ✅ compact width
                                                                                pointerEvents: "auto",
                                                                            }}
                                                                        >
                                                                            {/* Title + Status Badge */}
                                                                            <div className="flex justify-between items-center">
                                                                                <h4 className="font-semibold text-gray-800">
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

                                                                            {/* Description */}
                                                                            <p className="text-sm text-gray-700 mt-1">
                                                                                {t.description}
                                                                            </p>

                                                                            {/* Bugs */}
                                                                            {t.bugs?.filter((b) => b.status === "Open").length > 0 && (
                                                                                <div className="mt-3">
                                                                                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 font-medium">
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
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold mb-4">🆕 Add Task</h2>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                rows="3"
                                required
                            ></textarea>
                            <select
                                value={form.sprint_id}
                                onChange={(e) =>
                                    setForm({ ...form, sprint_id: e.target.value })
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                                >
                                    ❌ Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow hover:scale-95 transition"
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
