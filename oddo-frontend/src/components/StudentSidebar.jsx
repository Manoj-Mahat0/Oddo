import React from "react";
import { Link, useLocation } from "react-router-dom";

function StudentSidebar({ onLogout }) {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/student" },
    { name: "My Class", path: "/student/classes" },
    { name: "My Assignment", path: "/student/assignments" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-6 flex flex-col shadow-xl">
      <h2 className="text-2xl font-bold mb-8">🎓 Student Panel</h2>
      <nav className="space-y-3 flex-1">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-2 rounded-lg transition ${
              location.pathname === link.path
                ? "bg-indigo-600"
                : "hover:bg-gray-700"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="mt-6 w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default StudentSidebar;
