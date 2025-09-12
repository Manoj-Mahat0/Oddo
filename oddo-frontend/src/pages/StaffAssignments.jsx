// src/pages/StaffAssignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import StaffSidebar from "../components/StaffSidebar";
import API from "../api/client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * StaffAssignments (updated)
 * - Lists assignments created by staff (/assignments/my)
 * - Click assignment -> load submissions (/assignments/{id}/submissions)
 * - Grade a submission -> POST /assignments/submission/{submission_id}/grade (form-urlencoded)
 * - Dark modern UI with gradient
 */

export default function StaffAssignments() {
  const staffId = localStorage.getItem("id");

  // data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);

  // selection
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // ui state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  // form (create assignment)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [assignToIndividual, setAssignToIndividual] = useState(false);
  const [assignedStudentId, setAssignedStudentId] = useState("");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // grade form state (per-submission local state stored in map)
  const [grading, setGrading] = useState({}); // { [submissionId]: { is_accepted, grade_comment, loading } }

  // Fetch classes & students & assignments
  const fetchClasses = async () => {
    try {
      const res = await API.get("/classes/");
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchClasses error", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchStudents error", err);
    }
  };

  const fetchMyAssignments = async () => {
    setLoading(true);
    try {
      const res = await API.get("/assignments/my");
      setMyAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchMyAssignments error", err);
      setError("Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
    fetchMyAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  // When an assignment is selected, fetch its submissions
  const openAssignment = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissions([]);
    setLoadingSubmissions(true);
    try {
      const res = await API.get(`/assignments/${assignment.id}/submissions`);
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchSubmissions error", err);
      setToast({ type: "error", text: "Failed to load submissions." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // grade a submission
  const gradeSubmission = async (submissionId) => {
    const entry = grading[submissionId] || {};
    const is_accepted = entry.is_accepted === true; // boolean
    const grade_comment = entry.grade_comment || "";

    // very small validation
    if (entry.loading) return;
    setGrading((g) => ({ ...g, [submissionId]: { ...entry, loading: true } }));

    try {
      const payload = new URLSearchParams();
      payload.append("is_accepted", String(is_accepted));
      payload.append("grade_comment", grade_comment);

      const res = await API.post(`/assignments/submission/${submissionId}/grade`, payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setToast({ type: "success", text: res?.data?.message || "Submission graded" });
      // refresh submissions (to show graded state)
      if (selectedAssignment) {
        await openAssignment(selectedAssignment); // will re-fetch and update
      } else {
        fetchMyAssignments();
      }
    } catch (err) {
      console.error("grade error", err);
      setToast({ type: "error", text: "Failed to grade submission." });
    } finally {
      setGrading((g) => ({ ...g, [submissionId]: { ...(g[submissionId] || {}), loading: false } }));
      setTimeout(() => setToast(null), 3000);
    }
  };

  // helper: build full URL for screenshot (backend may return relative path)
  const screenshotUrl = (path) => {
    if (!path) return null;
    // normalize backslashes
    const p = path.replace(/\\\\/g, "/").replace(/\\/g, "/").replace(/^\\/g, "");
    // if it's already an absolute URL, return
    if (/^https?:\/\//.test(p)) return p;
    // otherwise prefix with baseURL from API config (no trailing slash issues)
    const base = API.defaults.baseURL?.replace(/\/$/, "");
    return `${base}/${p}`;
  };

  // create assignment (existing code, kept minimal)
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim() || !classId) {
      setError("Please fill required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const assigned_to_student = assignToIndividual ? assignedStudentId || null : 0;
      const payload = new URLSearchParams();
      payload.append("title", title);
      payload.append("description", description);
      payload.append("class_id", String(classId));
      payload.append("assigned_to_student", String(assigned_to_student));
      payload.append("due_date", (dueDate instanceof Date ? dueDate : new Date(dueDate)).toISOString());

      const res = await API.post("/assignments/create", payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setToast({ type: "success", text: res?.data?.message || "Assignment created" });
      setTitle("");
      setDescription("");
      setAssignToIndividual(false);
      setAssignedStudentId("");
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      await fetchMyAssignments();
    } catch (err) {
      console.error("create assignment error", err);
      setToast({ type: "error", text: "Failed to create assignment." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // UI helpers
  const studentsForSelectedClass = useMemo(() => {
    const c = classes.find((x) => `${x.id}` === `${classId}`);
    return c && Array.isArray(c.students) ? c.students : [];
  }, [classes, classId]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900 text-slate-100">
      <StaffSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold">📎 Assignments</h1>
              <p className="text-sm text-slate-300 mt-1">Create assignments and grade student submissions.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  fetchMyAssignments();
                  setToast({ type: "success", text: "Refreshed." });
                  setTimeout(() => setToast(null), 1200);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow"
              >
                Refresh
              </button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6">
            {/* Left: my assignments */}
            <aside className="col-span-4 bg-[#071226] rounded-2xl p-4 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">My Assignments</h2>
                <div className="text-sm text-slate-400">{loading ? "..." : `${myAssignments.length}`}</div>
              </div>

              <div className="space-y-3 max-h-[68vh] overflow-auto pr-2">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#081028] animate-pulse h-16" />
                    ))
                  : myAssignments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => openAssignment(a)}
                        className={`p-3 rounded-lg cursor-pointer transition ${
                          selectedAssignment && selectedAssignment.id === a.id
                            ? "ring-1 ring-indigo-500 bg-indigo-900/20"
                            : "hover:bg-white/2"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{a.title}</div>
                            <div className="text-xs text-slate-400 mt-1">Due: {new Date(a.due_date).toLocaleString()}</div>
                          </div>
                          <div className="text-xs text-slate-300">{a.status}</div>
                        </div>
                      </div>
                    ))}
              </div>
            </aside>

            {/* Right: create form + submissions */}
            <section className="col-span-8 bg-[#061025] rounded-2xl p-6 shadow-lg">
              {/* Create assignment (compact) */}
              <form onSubmit={handleCreate} className="space-y-4 mb-6">
                {error && <div className="text-sm text-red-400">{error}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full px-4 py-2 rounded-lg bg-[#0b1220] focus:outline-none"
                  />
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#0b1220] focus:outline-none"
                  >
                    <option value="">-- choose class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description..."
                  className="w-full px-4 py-3 rounded-lg bg-[#0b1220] focus:outline-none"
                />

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assignToIndividual}
                      onChange={(e) => setAssignToIndividual(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Assign to individual</span>
                  </label>

                  {assignToIndividual && (
                    <select
                      value={assignedStudentId}
                      onChange={(e) => setAssignedStudentId(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#0b1220]"
                    >
                      <option value="">-- choose student --</option>
                      {classId && studentsForSelectedClass.length > 0
                        ? studentsForSelectedClass.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name} — {s.email}
                            </option>
                          ))
                        : students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name} — {s.email}
                            </option>
                          ))}
                    </select>
                  )}

                  <div className="flex-1">
                    <DatePicker
                      selected={dueDate}
                      onChange={(date) => setDueDate(date)}
                      showTimeSelect
                      timeIntervals={15}
                      dateFormat="Pp"
                      className="w-full px-4 py-2 rounded-lg bg-[#0b1220] focus:outline-none"
                      minDate={new Date()}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2 rounded-lg ${
                      submitting ? "bg-slate-600" : "bg-gradient-to-br from-indigo-600 to-violet-600"
                    }`}
                  >
                    {submitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>

              {/* Submissions area */}
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-3">Submissions</h3>

                {selectedAssignment ? (
                  <div>
                    <div className="mb-3 text-sm text-slate-300">
                      Showing submissions for: <span className="font-medium">{selectedAssignment.title}</span>
                    </div>

                    {loadingSubmissions ? (
                      <div className="text-slate-300">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                      <div className="text-slate-300">No submissions yet.</div>
                    ) : (
                      <div className="space-y-4 max-h-[48vh] overflow-auto pr-2">
                        {submissions.map((s) => (
                          <div key={s.id} className="bg-[#071226] p-4 rounded-lg border border-white/6 flex gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium">{s.student_name}</div>
                                  <div className="text-xs text-slate-400">Submitted: {new Date(s.submitted_at).toLocaleString()}</div>
                                </div>

                                <div className="text-xs">
                                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-100 text-xs">
                                    {s.is_accepted ? "Accepted" : "Pending"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 text-sm text-slate-300">{s.comment}</div>

                              { s.optional_link && (
  <div className="mt-2">
    <a
  href={`http://${s.optional_link}`}
  target="_blank"
  rel="noreferrer"
  className="text-indigo-300 underline text-sm"
>
  Open link
</a>

  </div>
)}


                              {s.screenshot_path && (
                                <div className="mt-3">
                                  <img
                                    src={screenshotUrl(s.screenshot_path)}
                                    alt="submission"
                                    className="max-w-xs rounded-md border"
                                  />
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!(grading[s.id] && grading[s.id].is_accepted)}
                                    onChange={(e) =>
                                      setGrading((g) => ({ ...g, [s.id]: { ...(g[s.id] || {}), is_accepted: e.target.checked } }))
                                    }
                                    className="h-4 w-4"
                                  />
                                  Accept
                                </label>

                                <input
                                  value={(grading[s.id] && grading[s.id].grade_comment) || ""}
                                  onChange={(e) =>
                                    setGrading((g) => ({ ...g, [s.id]: { ...(g[s.id] || {}), grade_comment: e.target.value } }))
                                  }
                                  placeholder="Grade comment (optional)"
                                  className="px-3 py-2 rounded-md bg-[#0b1220] text-sm w-72"
                                />

                                <button
                                  onClick={() => gradeSubmission(s.id)}
                                  disabled={grading[s.id] && grading[s.id].loading}
                                  className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-sm"
                                >
                                  {grading[s.id] && grading[s.id].loading ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400">Select an assignment on the left to view submissions.</div>
                )}
              </div>
            </section>
          </div>

          {/* toast */}
          {toast && (
            <div
              className={`fixed right-6 bottom-6 px-4 py-2 rounded-lg ${
                toast.type === "success" ? "bg-green-600" : "bg-red-600"
              } shadow-lg`}
            >
              <div className="text-sm">{toast.text}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
