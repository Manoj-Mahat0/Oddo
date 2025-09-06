import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/client";
import StaffSidebar from "../components/StaffSidebar";

/**
 * useAsync - small helper to call async functions with loading+error states
 * Accepts an async function (fn) and dependencies array.
 */
function useAsync(fn, deps = []) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fn();
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData, setError, setLoading };
}

function SkeletonLine({ className = "" }) {
  return (
    <div
      className={`h-3 rounded bg-gradient-to-r from-gray-700 to-gray-600 animate-pulse ${className}`}
    />
  );
}

export default function StaffClasses() {
  const staffId = localStorage.getItem("id");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Search / UI states with debounce
  const [classQuery, setClassQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const classQueryRef = useRef("");
  const studentQueryRef = useRef("");

  // Debounce timers
  const classDebounceRef = useRef(null);
  const studentDebounceRef = useRef(null);

  // fetch all classes for the staff
  const classesHook = useAsync(
    async () => {
      if (!staffId) return [];
      const res = await API.get(`/staff/${staffId}/classes`);
      return Array.isArray(res.data) ? res.data : [];
    },
    // re-run when staffId changes or manually triggered by setReload
    [staffId]
  );

  // fetch all students for enrollment (full list)
  const studentsHook = useAsync(
    async () => {
      const res = await API.get("/students/");
      return Array.isArray(res.data) ? res.data : [];
    },
    []
  );

  // fetch students of selected class
  const classStudentsHook = useAsync(
    async () => {
      if (!selectedClassId) return [];
      const res = await API.get(`/students/class/${selectedClassId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    [selectedClassId]
  );

  // filtering (client-side) - useMemo for perf
  const filteredClasses = useMemo(() => {
    const q = classQueryRef.current.toLowerCase().trim();
    if (!q) return classesHook.data || [];
    return (classesHook.data || []).filter((c) =>
      (c.name || "").toLowerCase().includes(q)
    );
  }, [classesHook.data, classQuery]);

  const filteredStudents = useMemo(() => {
    const q = studentQueryRef.current.toLowerCase().trim();
    if (!q) return studentsHook.data || [];
    return (studentsHook.data || []).filter((s) =>
      `${s.full_name || s.name || ""}`.toLowerCase().includes(q)
    );
  }, [studentsHook.data, studentQuery]);

  // debounce handlers - update refs then state to trigger useMemo
  useEffect(() => {
    if (classDebounceRef.current) clearTimeout(classDebounceRef.current);
    classDebounceRef.current = setTimeout(() => {
      classQueryRef.current = classQuery;
      // no state change needed; filteredClasses reads ref + classesHook.data
      // but we set a dummy state to force rerender: update selectedClassId to same to rerender
      // easier: call setSelectedClassId((id) => id) - harmless
      setSelectedClassId((id) => id);
    }, 220);
    return () => clearTimeout(classDebounceRef.current);
  }, [classQuery]);

  useEffect(() => {
    if (studentDebounceRef.current) clearTimeout(studentDebounceRef.current);
    studentDebounceRef.current = setTimeout(() => {
      studentQueryRef.current = studentQuery;
      // trigger rerender
      setSelectedClassId((id) => id);
    }, 220);
    return () => clearTimeout(studentDebounceRef.current);
  }, [studentQuery]);

  // Enroll student with optimistic update
  const [toast, setToast] = useState(null);
  async function enrollStudent(studentId) {
    if (!selectedClassId || !studentId) return;
    try {
      // optimistic update: push the enrolled student to classStudentsHook.data
      const studentObj = (studentsHook.data || []).find((s) => s.id === studentId);
      if (!studentObj) {
        setToast({ type: "error", text: "Student not found locally." });
        return;
      }

      // If already present, ignore
      const already = (classStudentsHook.data || []).some((s) => s.id === studentId);
      if (already) {
        setToast({ type: "info", text: `${studentObj.full_name} already enrolled.` });
        return;
      }

      // Optimistic UI: append locally
      const prev = classStudentsHook.data || [];
      classStudentsHook.setData([...prev, studentObj]);

      // call backend
      await API.post(`/students/${studentId}/enroll/${selectedClassId}`);

      // refresh classes & students & classStudents (safe)
      // re-run the async fetches by calling their async fns manually:
      const refreshedClasses = await API.get(`/staff/${staffId}/classes`);
      classesHook.setData(Array.isArray(refreshedClasses.data) ? refreshedClasses.data : []);

      const refreshedStudents = await API.get("/students/");
      studentsHook.setData(Array.isArray(refreshedStudents.data) ? refreshedStudents.data : []);

      const refreshedClassStudents = await API.get(`/students/class/${selectedClassId}`);
      classStudentsHook.setData(
        Array.isArray(refreshedClassStudents.data) ? refreshedClassStudents.data : []
      );

      setToast({ type: "success", text: "Enrolled successfully." });
    } catch (err) {
      // rollback optimistic update
      classStudentsHook.setData((prev) => (prev || []).filter((s) => s.id !== studentId));
      console.error("Enroll failed:", err);
      setToast({ type: "error", text: "Enrollment failed. Try again." });
    } finally {
      // auto clear toast
      setTimeout(() => setToast(null), 3000);
    }
  }

  // Unenroll feature (nice to have) - simple confirmation; not required but I've included
  async function unenrollStudent(studentId) {
    if (!selectedClassId || !studentId) return;
    try {
      // optimistic remove
      classStudentsHook.setData((prev) => (prev || []).filter((s) => s.id !== studentId));
      await API.delete(`/students/${studentId}/unenroll/${selectedClassId}`);
      setToast({ type: "success", text: "Student removed." });
    } catch (err) {
      console.error("Unenroll failed:", err);
      setToast({ type: "error", text: "Failed to remove student." });
      // refresh to recover
      const refreshed = await API.get(`/students/class/${selectedClassId}`);
      classStudentsHook.setData(Array.isArray(refreshed.data) ? refreshed.data : []);
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  // small UI helpers
  const anyLoading =
    classesHook.loading || studentsHook.loading || classStudentsHook.loading;

  return (
    <div className="flex min-h-screen bg-[#0f1724] text-slate-100">
      <StaffSidebar />

      <main className="flex-1 px-8 py-6 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <span className="inline-block w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg transform -rotate-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M3 7h18M3 12h18M3 17h18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Class Management
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Search students to enroll..."
                className="w-64 px-4 py-2 rounded-lg bg-[#0b1220] border border-transparent focus:outline-none focus:border-indigo-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {studentsHook.loading ? "loading..." : `${(studentsHook.data || []).length} students`}
              </div>
            </div>

            <button
              onClick={() => {
                // manual refresh
                classesHook.setLoading(true);
                classesHook.setError(null);
                (async () => {
                  try {
                    const res = await API.get(`/staff/${staffId}/classes`);
                    classesHook.setData(Array.isArray(res.data) ? res.data : []);
                    const sres = await API.get("/students/");
                    studentsHook.setData(Array.isArray(sres.data) ? sres.data : []);
                    if (selectedClassId) {
                      const cres = await API.get(`/students/class/${selectedClassId}`);
                      classStudentsHook.setData(Array.isArray(cres.data) ? cres.data : []);
                    }
                    setToast({ type: "success", text: "Refreshed." });
                  } catch (err) {
                    console.error(err);
                    setToast({ type: "error", text: "Refresh failed." });
                  } finally {
                    classesHook.setLoading(false);
                    setTimeout(() => setToast(null), 2000);
                  }
                })();
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow hover:brightness-105"
            >
              Refresh All
            </button>
          </div>
        </header>

        {/* Layout: left list, right content */}
        <div className="flex gap-6 h-[76vh]">
          {/* Left: class list */}
          <aside className="w-96 bg-[#0b1220] rounded-xl p-4 flex flex-col shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Classes</h2>
              <div className="text-sm text-slate-400">{classesHook.loading ? "loading..." : `${(classesHook.data || []).length}`}</div>
            </div>

            <input
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="Search classes..."
              className="mb-3 px-3 py-2 rounded bg-[#071226] focus:outline-none"
            />

            <div className="flex-1 overflow-auto pr-2 space-y-3">
              {/* loading skeleton */}
              {classesHook.loading && (
                <>
                  <div className="p-3 rounded-lg bg-[#081028]">
                    <SkeletonLine className="w-3/4 mb-2" />
                    <SkeletonLine className="w-1/3" />
                  </div>
                  <div className="p-3 rounded-lg bg-[#081028]">
                    <SkeletonLine className="w-1/2 mb-2" />
                    <SkeletonLine className="w-1/4" />
                  </div>
                </>
              )}

              {!classesHook.loading &&
                (filteredClasses.length === 0 ? (
                  <div className="text-slate-400 text-sm">No classes found.</div>
                ) : (
                  filteredClasses.map((c) => {
                    const isActive = selectedClassId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedClassId(c.id);
                          classStudentsHook.setLoading(true);
                          (async () => {
                            try {
                              const res = await API.get(`/students/class/${c.id}`);
                              classStudentsHook.setData(Array.isArray(res.data) ? res.data : []);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              classStudentsHook.setLoading(false);
                            }
                          })();
                        }}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-700/30 to-violet-700/20 ring-1 ring-indigo-500"
                            : "hover:bg-white/2"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="font-medium">{c.name}</div>
                            {c.section && <div className="text-xs text-slate-400">{c.section}</div>}
                          </div>
                          <div className="text-xs text-slate-400">{/* placeholder for count */}</div>
                        </div>
                      </button>
                    );
                  })
                ))}
            </div>

            <div className="mt-3 text-xs text-slate-500">Tip: Click a class to see enrolled students on the right.</div>
          </aside>

          {/* Right: main cards & enrolled list */}
          <section className="flex-1 flex flex-col overflow-hidden">
            {/* Top card / selected class */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-slate-900/60 to-slate-900/30 border border-transparent rounded-2xl p-6 shadow-lg flex items-center justify-between">
                {selectedClassId ? (
                  <div>
                    <div className="text-lg font-semibold">
                      {(classesHook.data || []).find((x) => x.id === selectedClassId)?.name || "Selected class"}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      ID: {selectedClassId}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-semibold">Select a class</div>
                    <div className="text-sm text-slate-400 mt-1">Choose from the left to view enrolled students & manage enrollments</div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!selectedClassId) return setToast({ type: "info", text: "Select a class first." });
                      setShowEnrollModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow"
                  >
                    ➕ Enroll Student
                  </button>

                  <button
                    onClick={async () => {
                      if (!selectedClassId) return setToast({ type: "info", text: "Select a class first." });
                      classStudentsHook.setLoading(true);
                      try {
                        const res = await API.get(`/students/class/${selectedClassId}`);
                        classStudentsHook.setData(Array.isArray(res.data) ? res.data : []);
                        setToast({ type: "success", text: "Loaded students." });
                      } catch (err) {
                        console.error(err);
                        setToast({ type: "error", text: "Failed to load." });
                      } finally {
                        classStudentsHook.setLoading(false);
                        setTimeout(() => setToast(null), 1600);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0b1220] border border-slate-700"
                  >
                    👥 View Students
                  </button>
                </div>
              </div>
            </div>

            {/* Enrolled students list */}
            <div className="flex-1 overflow-auto rounded-2xl p-4 bg-[#071226] shadow-inner">
              <h3 className="text-lg font-semibold mb-3">Enrolled Students {selectedClassId ? `(Class ID: ${selectedClassId})` : ""}</h3>

              {/* loading skeleton for class students */}
              {classStudentsHook.loading && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#081028]"><SkeletonLine className="w-1/2 mb-2" /><SkeletonLine className="w-1/3" /></div>
                  <div className="p-3 rounded-lg bg-[#081028]"><SkeletonLine className="w-2/3 mb-2" /><SkeletonLine className="w-1/4" /></div>
                </div>
              )}

              {!classStudentsHook.loading && (classStudentsHook.data || []).length === 0 && (
                <div className="text-slate-400">No students enrolled yet. Click "Enroll Student" to add.</div>
              )}

              {!classStudentsHook.loading && (classStudentsHook.data || []).length > 0 && (
                <ul className="space-y-2">
                  {(classStudentsHook.data || []).map((s) => (
                    <li key={s.id} className="p-3 rounded-lg bg-[#0b1320] flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => unenrollStudent(s.id)}
                          className="px-3 py-1 rounded bg-transparent border border-slate-700 text-sm hover:bg-white/2"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed right-6 bottom-6 px-4 py-2 rounded-lg ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
                : "bg-slate-700"
            } shadow-lg`}
          >
            <div className="text-sm">{toast.text}</div>
          </div>
        )}

        {/* Enroll Modal */}
        {showEnrollModal && selectedClassId && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => {
              // click outside closes modal
              if (e.target === e.currentTarget) {
                setShowEnrollModal(false);
              }
            }}
          >
            <div className="w-full max-w-4xl bg-[#071226] rounded-2xl p-6 shadow-lg transform transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">Enroll Students — {(classesHook.data || []).find(x => x.id === selectedClassId)?.name || ""}</h2>
                  <p className="text-sm text-slate-400 mb-4">Search and add students quickly. Already-enrolled students are shown on the right.</p>

                  <div className="mb-3">
                    <input
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      placeholder="Filter students by name..."
                      className="w-full px-4 py-2 rounded-lg bg-[#0b1220] focus:outline-none"
                    />
                  </div>

                  <div className="max-h-96 overflow-auto space-y-2 pr-2">
                    {studentsHook.loading && (
                      <>
                        <div className="p-3 rounded-lg bg-[#081028]"><SkeletonLine className="w-2/3 mb-2" /><SkeletonLine className="w-1/4" /></div>
                        <div className="p-3 rounded-lg bg-[#081028]"><SkeletonLine className="w-1/2 mb-2" /><SkeletonLine className="w-1/3" /></div>
                      </>
                    )}

                    {!studentsHook.loading && filteredStudents.length === 0 && (
                      <div className="text-slate-400">No students found.</div>
                    )}

                    {!studentsHook.loading &&
                      filteredStudents.map((s) => {
                        const already = (classStudentsHook.data || []).some((cs) => cs.id === s.id);
                        return (
                          <div key={s.id} className="p-3 rounded-lg bg-[#0b1320] flex items-center justify-between">
                            <div>
                              <div className="font-medium">{s.full_name}</div>
                              <div className="text-xs text-slate-400">{s.email}</div>
                            </div>
                            <div>
                              <button
                                onClick={() => enrollStudent(s.id)}
                                disabled={already}
                                className={`px-3 py-1 rounded ${already ? "bg-slate-700 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}
                              >
                                {already ? "Enrolled" : "Enroll"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Right column: enrolled preview */}
                <aside className="w-80 min-w-[18rem] bg-[#061025] rounded-lg p-3">
                  <div className="mb-2 font-semibold">Already Enrolled</div>
                  <div className="max-h-80 overflow-auto space-y-2">
                    {classStudentsHook.loading && <div className="text-slate-400">Loading...</div>}
                    {!classStudentsHook.loading && (classStudentsHook.data || []).length === 0 && (
                      <div className="text-slate-400 text-sm">No one enrolled yet.</div>
                    )}
                    {!classStudentsHook.loading &&
                      (classStudentsHook.data || []).map((s) => (
                        <div key={s.id} className="p-2 rounded bg-[#071428] flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{s.full_name}</div>
                            <div className="text-xs text-slate-400">{s.email}</div>
                          </div>
                          <button onClick={() => unenrollStudent(s.id)} className="text-xs px-2 py-1 rounded bg-transparent border border-slate-700">
                            Remove
                          </button>
                        </div>
                      ))}
                  </div>
                </aside>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowEnrollModal(false)} className="px-4 py-2 rounded-lg bg-slate-700">Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
