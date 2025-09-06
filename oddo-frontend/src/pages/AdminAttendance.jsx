// src/pages/AdminAttendance.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api/client";
import "react-datepicker/dist/react-datepicker.css";

// FullCalendar (we rely on Tailwind for styling)
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

/**
 * AdminAttendance.jsx
 * - Calendar shows only punch-in/out counts per day (badges).
 * - Event text (times) hidden via eventContent={() => null}.
 * - Modal will show user entries but will NOT display punch-in / punch-out timestamps.
 *
 * Required: API client (`src/api/client.js`) should attach Authorization header automatically.
 */

function toYMD(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminAttendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // attendance data
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [limit] = useState(1000); // keep large so we can build counts for calendar
  const [offset] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState("");

  // UI state
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDateRecords, setSelectedDateRecords] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // blocked users
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // build simple calendar events array (we hide eventContent later)
    const events = records.map((r) => {
      const start = r.punch_in_time || r.created_at;
      return {
        id: r.id,
        title: "", // empty because we'll hide eventContent
        start,
        extendedProps: r,
      };
    });
    setCalendarEvents(events);
  }, [records]);

  // counts map: YYYY-MM-DD -> { in: n, out: m }
  const countsMap = useMemo(() => {
    const m = {};
    records.forEach((r) => {
      if (r.punch_in_time) {
        const k = toYMD(r.punch_in_time);
        m[k] = m[k] || { in: 0, out: 0 };
        m[k].in += 1;
      }
      if (r.punch_out_time) {
        const k2 = toYMD(r.punch_out_time);
        m[k2] = m[k2] || { in: 0, out: 0 };
        m[k2].out += 1;
      }
    });
    return m;
  }, [records]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/login");
  };

  const handleApi401 = (err) => {
    if (err?.response && err.response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("id");
      navigate("/login");
      return true;
    }
    return false;
  };

  const formatDate = (d) => {
    try {
      return d ? new Date(d).toLocaleString() : "-";
    } catch {
      return d;
    }
  };

  async function fetchAttendance(params = {}) {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/attendance/admin/all`, { params: { limit, offset, ...params } });
      const d = res.data || {};
      setRecords(d.records || []);
      setTotal(d.total || 0);
      setCount(d.count || 0);
      setTotalWorkTime(d.total_work_time || "");
    } catch (err) {
      console.error("fetchAttendance", err);
      if (!handleApi401(err)) setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  // Blocked users endpoint (display and unblock)
  async function fetchBlockedUsers(params = { limit: 1000, offset: 0 }) {
    try {
      setBlockedLoading(true);
      setBlockedMessage("");
      const res = await API.get(`/attendance/admin/blocked`, { params });
      const d = res.data || {};
      setBlockedUsers(d.users || []);
    } catch (err) {
      console.error("fetchBlockedUsers", err);
      if (!handleApi401(err)) setBlockedMessage("Failed to load blocked users");
    } finally {
      setBlockedLoading(false);
    }
  }

  async function unblockUser(userId) {
    if (!userId) return;
    try {
      setBlockedMessage("");
      await API.post(`/attendance/admin/unblock/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      setBlockedMessage("User unblocked successfully.");
    } catch (err) {
      console.error("unblockUser", err);
      if (!handleApi401(err)) setBlockedMessage("Failed to unblock user");
    }
  }

  function openDetailModal(items) {
    // Strip punch_in_time / punch_out_time from items shown in modal (as user requested)
    const sanitized = items.map((r) => {
      const { punch_in_time, punch_out_time, ...rest } = r;
      return rest;
    });
    setSelectedDateRecords(sanitized);
    setDetailModalOpen(true);
  }

  function handleDateClick(arg) {
    const day = new Date(arg.date);
    const isoDayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
    const isoDayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).toISOString();

    const items = records.filter((r) => {
      const t = r.punch_in_time || r.created_at;
      return t >= isoDayStart && t <= isoDayEnd;
    });

    openDetailModal(items);
  }

  function handleEventClick(info) {
    const r = info.event.extendedProps;
    openDetailModal([r]);
  }

  // CSV export (safe timestamp)
  function exportCSV(items) {
    if (!items || items.length === 0) return;
    const headers = ["id", "user_id", "duration", "ssid", "note", "created_at"];
    const rows = items.map((r) => headers.map((h) => (r[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    a.download = `attendance_export_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Render small badges in each day cell — only counts, no times.
  function dayCellContent(arg) {
    const dateKey = toYMD(arg.date);
    const counts = countsMap[dateKey] || { in: 0, out: 0 };

    return {
      html: `
        <div class="fc-daycell-inner" style="display:flex;flex-direction:column;height:100%;">
          <div class="fc-daynum" style="display:flex;justify-content:flex-end;padding:4px 6px 0 0;font-size:13px;color:inherit;">
            ${arg.dayNumberText}
          </div>
          <div style="flex:1;"></div>
          <div style="display:flex;flex-direction:column;gap:6px;padding:6px;">
            ${counts.in > 0 ? `<div class="badge-in text-xs font-medium">${counts.in} in</div>` : ""}
            ${counts.out > 0 ? `<div class="badge-out text-xs font-medium">${counts.out} out</div>` : ""}
          </div>
        </div>
      `,
    };
  }

  // Sunday highlight
  function dayCellClassNames(arg) {
    const dt = arg.date;
    const day = dt.getDay(); // 0 = Sunday
    return day === 0 ? ["fc-sunday"] : [];
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900 text-white">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="text-sm text-gray-300 mt-1">Calendar with punch-in / punch-out counts (times hidden)</p>
            {error && <div className="mt-2 text-red-300">{error}</div>}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => exportCSV(records)} className="px-3 py-2 rounded bg-white/6 hover:bg-white/8 text-sm">
              Export
            </button>
            <button onClick={() => fetchAttendance()} className="px-3 py-2 rounded bg-white/6 hover:bg-white/8 text-sm">
              Refresh
            </button>
            <button
              onClick={() => {
                setBlockedModalOpen(true);
                fetchBlockedUsers();
              }}
              className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-sm"
            >
              Blocked
            </button>
            <div className="text-sm text-gray-300">Total records: {total} — Showing: {count}</div>
          </div>
        </header>

        <div className="bg-white/5 rounded-lg p-4 border border-white/6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
            events={calendarEvents}
            height={750}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            selectable={true}
            selectMirror={true}
            dayCellContent={dayCellContent}
            dayCellClassNames={dayCellClassNames}
            eventContent={() => null} // hide default event text (no times shown)
          />
        </div>

        {/* Detail Modal (shows user entries but no timestamps) */}
        {detailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDetailModalOpen(false)} />

            <div className="relative z-10 w-full max-w-3xl bg-gradient-to-br from-gray-900 to-slate-900 rounded-lg border border-white/8 p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Entries ({selectedDateRecords.length})</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { exportCSV(selectedDateRecords); }} className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm">
                    Export CSV
                  </button>
                  <button onClick={() => setDetailModalOpen(false)} className="px-3 py-2 rounded bg-white/6 hover:bg-white/8 text-sm">
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {selectedDateRecords.map((r) => (
                  <div key={r.id} className="p-3 bg-white/4 rounded flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{r.full_name ? r.full_name : `User ${r.user_id}`}{r.email ? <span className="text-xs text-gray-400"> • {r.email}</span> : null}</div>
                      <div className="text-xs text-gray-300">Role: {r.role || "-"}</div>
                      {/* Duration shown if present */}
                      {r.duration ? <div className="text-xs text-gray-300">Duration: {r.duration}</div> : null}
                      <div className="text-xs text-gray-300">Note: {r.note || "-"}</div>
                    </div>

                    <div className="text-xs text-gray-400">ID: {r.id}</div>
                  </div>
                ))}
                {selectedDateRecords.length === 0 && <div className="text-gray-400">No entries to show.</div>}
              </div>
            </div>
          </div>
        )}

        {/* Blocked Users Modal */}
        {blockedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setBlockedModalOpen(false)} />

            <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-gray-900 to-slate-900 rounded-lg border border-white/8 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Blocked Users ({blockedUsers.length})</h3>
                <button onClick={() => setBlockedModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {blockedLoading && <div className="text-gray-400">Loading...</div>}
                {!blockedLoading && blockedUsers.length === 0 && <div className="text-gray-400">No blocked users</div>}

                {blockedUsers.map((b) => (
                  <div key={b.id} className="p-3 bg-white/4 rounded flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{b.full_name} <span className="text-xs text-gray-400">• ID {b.id}</span></div>
                      <div className="text-xs text-gray-300">{b.email}</div>
                      <div className="text-xs text-gray-300">Role: {b.role}</div>
                      <div className="text-xs text-gray-300">Attempts: {b.failed_attendance_attempts ?? 0}</div>
                      <div className="text-xs text-gray-300">Blocked: {b.is_blocked ? "Yes" : "No"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => unblockUser(b.id)} className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm">Unblock</button>
                    </div>
                  </div>
                ))}

                {blockedMessage && <div className="mt-3 text-sm text-green-300">{blockedMessage}</div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
