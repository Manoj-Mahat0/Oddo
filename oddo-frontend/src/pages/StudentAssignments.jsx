import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import API from "../api/client";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // form state
  const [optionalLink, setOptionalLink] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const studentId = localStorage.getItem("id");

  useEffect(() => {
    if (!studentId) return navigate("/login");
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function fetchAssignments() {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/assignments/student/${studentId}`);
      setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("role");
        localStorage.removeItem("id");
        navigate("/login");
      } else {
        setError("Failed to load assignments");
      }
    } finally {
      setLoading(false);
    }
  }

  function openSubmitModal(assignment) {
    setSelectedAssignment(assignment);
    setOptionalLink("");
    setComment("");
    setFile(null);
    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedAssignment(null);
  }

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    setMessage("");

    try {
      const form = new FormData();
      if (file) form.append("screenshot", file, file.name);
      form.append("optional_link", optionalLink || "");
      form.append("comment", comment || "");

      const url = `/assignments/${selectedAssignment.id}/submit`;
      const res = await API.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data?.message || "Submitted successfully");
      await fetchAssignments();
      setTimeout(() => closeModal(), 900);
    } catch (err) {
      console.error("submit error", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("role");
        localStorage.removeItem("id");
        navigate("/login");
      } else {
        setMessage("Failed to submit. Check console for details.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/login");
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900 text-white">
      <StudentSidebar onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Assignments</h1>
            <p className="text-sm text-gray-300 mt-1">Submit your work — upload screenshot or add link</p>
          </div>
        </header>

        {message && <div className="mb-4 p-3 rounded bg-white/10 text-sm">{message}</div>}

        {loading ? (
          <div className="text-gray-300">Loading assignments...</div>
        ) : error ? (
          <div className="text-red-300">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((a) => (
              <div key={a.id} className="bg-white/6 backdrop-blur rounded-lg p-4 border border-white/6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold">{a.title}</div>
                    <div className="text-sm text-gray-300 mt-2">{a.description}</div>
                    <div className="text-xs text-gray-400 mt-3">Due: {formatDate(a.due_date)}</div>
                  </div>

                  <div className="space-y-2 text-right">
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          a.status === "Submitted"
                            ? "bg-green-600 text-green-50"
                            : a.status === "Open"
                            ? "bg-yellow-500 text-yellow-900"
                            : "bg-gray-700 text-gray-200"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>

                    <div>
                      <button
                        onClick={() => openSubmitModal(a)}
                        className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {assignments.length === 0 && <div className="text-gray-300">No assignments found.</div>}
          </div>
        )}

        {/* Modal */}
        {modalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={closeModal} />

            <form
              onSubmit={handleSubmit}
              className="relative z-10 w-full max-w-xl bg-gray-900 rounded-lg border border-white/8 p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Submit: {selectedAssignment.title}</h3>
                <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-gray-300">Screenshot (optional)</label>

                {/* File input: styled so button and filename are visible */}
                <input
                  ref={fileInputRef}
                  onChange={onFileChange}
                  type="file"
                  accept="image/*,application/pdf"
                  className="w-full text-sm text-white bg-white/5 rounded px-3 py-2
                             file:bg-white/10 file:text-white file:rounded file:px-3 file:py-1
                             placeholder-gray-300"
                />

                {file && <div className="text-xs text-gray-200">Selected: {file.name}</div>}

                <label className="block text-sm text-gray-300">Optional Link</label>
                <input
                  value={optionalLink}
                  onChange={(e) => setOptionalLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full text-sm text-white placeholder-gray-400 bg-white/5 rounded px-3 py-2"
                />

                <label className="block text-sm text-gray-300">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Brief note about your submission"
                  className="w-full text-sm text-white placeholder-gray-400 bg-white/5 rounded px-3 py-2 resize-y"
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-400">You can upload an image/pdf or share a link.</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/8 text-sm"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>

                {message && <div className="mt-2 text-sm text-green-300">{message}</div>}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
