import React, { useEffect, useState } from "react";
import API from "../api/client";
import StaffSidebar from "../components/StaffSidebar";

function StaffClasses() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Get staff ID from localStorage (set after login)
  const staffId = localStorage.getItem("id");

  // Fetch staff classes
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/staff/${staffId}/classes`);
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
    setLoading(false);
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Enroll student into a class
  const enrollStudent = async (studentId, classId) => {
    try {
      await API.post(`/students/${studentId}/enroll/${classId}`);
      alert(`Student enrolled successfully!`);
      setShowEnrollModal(false);
    } catch (err) {
      console.error("Error enrolling student:", err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">📚 My Classes</h1>

        {loading && <p>Loading classes...</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition"
            >
              <h3 className="text-lg font-bold">{cls.name}</h3>
              <button
                onClick={() => {
                  setSelectedClass(cls.id);
                  setShowEnrollModal(true);
                }}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                ➕ Enroll Student
              </button>
            </div>
          ))}
        </div>

        {/* Enroll Modal */}
        {showEnrollModal && selectedClass && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-96">
              <h2 className="text-xl font-semibold mb-4">Enroll Student</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center bg-white/5 px-3 py-2 rounded"
                  >
                    <span>{s.full_name}</span>
                    <button
                      onClick={() => enrollStudent(s.id, selectedClass)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
                    >
                      Enroll
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
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

export default StaffClasses;
