import React from "react";
import { Link, useLocation } from "react-router-dom";

function StaffSidebar() {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/staff" },
    { name: "Classes", path: "/staff/classes" },
    { name: "Assignments", path: "/staff/assignments" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-6 flex flex-col shadow-xl">
      <h2 className="text-2xl font-bold mb-8">👩‍🏫 Staff Panel</h2>
      <nav className="space-y-3">
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
    </div>
  );
}

export default StaffSidebar;
