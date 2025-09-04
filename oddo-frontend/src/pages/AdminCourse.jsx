import React, { useEffect, useState } from "react";
import API from "../api/client";
import Sidebar from "../components/Sidebar";

function Course() {
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classStaff, setClassStaff] = useState({}); // {classId: [staff list]}
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [newClassName, setNewClassName] = useState("");

  const [selectedClass, setSelectedClass] = useState(null); // for assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch all classes
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await API.get("/classes/");
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
    setLoading(false);
  };

  // Fetch all staff
  const fetchStaff = async () => {
    try {
      const res = await API.get("/staff/");
      setStaff(res.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  // Fetch staff for a given class
  const fetchClassStaff = async (classId) => {
    try {
      const res = await API.get(`/staff/class/${classId}`);
      setClassStaff((prev) => ({ ...prev, [classId]: res.data }));
    } catch (err) {
      console.error("Error fetching class staff:", err);
    }
  };

  // Add class
  const addClass = async () => {
    if (!newClassName.trim()) return;
    try {
      await API.post(`/classes/?name=${encodeURIComponent(newClassName)}`);
      setShowAddModal(false);
      setNewClassName("");
      fetchClasses();
    } catch (err) {
      console.error("Error adding class:", err);
    }
  };

  // Delete class
  const deleteClass = async (id) => {
    try {
      await API.delete(`/classes/${id}`);
      setShowDeleteModal(null);
      fetchClasses();
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  // Assign staff to class
  const assignStaff = async (staffId, classId) => {
    try {
      await API.post(`/staff/${staffId}/assign/${classId}`);
      fetchClassStaff(classId);
      setShowAssignModal(false);
    } catch (err) {
      console.error("Error assigning staff:", err);
    }
  };

  // Revoke staff from class
  const revokeStaff = async (staffId, classId) => {
    try {
      await API.delete(`/staff/${staffId}/revoke/${classId}`);
      fetchClassStaff(classId);
    } catch (err) {
      console.error("Error revoking staff:", err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStaff();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">📚 Classes</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl font-semibold"
          >
            + Add Class
          </button>
        </div>

        {loading && <p>Loading classes...</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div
              key={c.id}
              className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl shadow hover:scale-105 transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold">{c.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedClass(c.id);
                      fetchClassStaff(c.id);
                      setShowAssignModal(true);
                    }}
                    className="text-green-400 hover:text-green-600 font-bold text-lg"
                  >
                    ➕
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(c.id)}
                    className="text-red-400 hover:text-red-600 font-bold text-lg"
                  >
                    ✖
                  </button>
                </div>
              </div>

              {/* Assigned staff */}
              <div className="space-y-1">
                {(classStaff[c.id] || []).map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center bg-white/5 px-3 py-1 rounded"
                  >
                    <span>{s.name}</span>
                    <button
                      onClick={() => revokeStaff(s.id, c.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl w-96">
              <h2 className="text-xl font-semibold mb-4">Add New Class</h2>
              <input
                type="text"
                placeholder="Class Name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full p-2 mb-3 rounded bg-white/20 text-white placeholder-gray-300"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={addClass}
                  className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl w-96 text-center">
              <h2 className="text-xl font-semibold mb-4">
                Are you sure you want to delete this class?
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-600 rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteClass(showDeleteModal)}
                  className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedClass && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl w-96">
              <h2 className="text-xl font-semibold mb-4">Assign Staff</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {staff.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center bg-white/5 px-3 py-2 rounded"
                  >
                    <span>{s.full_name}</span>
                    <button
                      onClick={() => assignStaff(s.id, selectedClass)}
                      className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded-xl hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Course;
