import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Projects", path: "/admin/projects" },
    { name: "Tasks", path: "/admin/tasks" },
    { name: "Reports", path: "/admin/reports" },
    { name: "Settings", path: "/admin/settings" },
  ];

  return (
    <aside className="w-64 bg-white shadow-xl p-6 flex flex-col">
      {/* Logo */}
      <h2 className="text-2xl font-extrabold text-blue-600 mb-10">Oddo Admin</h2>

      {/* Navigation */}
      <nav className="space-y-4">
        {menuItems.map((item, i) => (
          <Link
            key={i}
            to={item.path}
            className="block py-2 px-4 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
