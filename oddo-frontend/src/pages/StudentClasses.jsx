import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import API from "../api/client";

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 👇 get studentId from localStorage (saved at login)
  const studentId = localStorage.getItem("id");

  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        setError("");

        const res = await API.get(`/students/${studentId}/classes`);
        setClasses(res.data);
      } catch (err) {
        console.error("fetchClasses error:", err);

        if (err.response && err.response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("role");
          localStorage.removeItem("id");
          navigate("/login");
        } else {
          setError("Failed to load classes");
        }
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchClasses();
    } else {
      // id missing → force login
      navigate("/login");
    }
  }, [navigate, studentId]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <StudentSidebar onLogout={handleLogout} />

      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6">📚 My Classes</h1>

        {loading && <p className="text-gray-500">Loading classes...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow p-4">
            {classes.length === 0 ? (
              <p className="text-gray-500">No classes found.</p>
            ) : (
              <ul className="divide-y">
                {classes.map((c) => (
                  <li key={c.id} className="py-3">
                    <div className="font-medium">{c.name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
