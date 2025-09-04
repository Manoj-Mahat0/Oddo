import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Projects", path: "/admin/projects", icon: "📂" },
    { name: "Tasks", path: "/admin/tasks", icon: "✅" },
    { name: "Backlogs", path: "/admin/backlogs", icon: "📈" },
    { name: "Course", path: "/admin/course", icon: "📚" },
  ];

  const handleLogout = () => {
    // ✅ clear auth token / session here
    localStorage.removeItem("token"); // example
    navigate("/login"); // redirect to login
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-xl flex flex-col">
      {/* Logo */}
      <div className="p-6 text-2xl font-extrabold tracking-wide">
        <span className="text-yellow-300">⚡ Oddo</span> Admin
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-yellow-300 text-blue-900 font-semibold shadow"
                  : "hover:bg-blue-600 hover:text-yellow-300"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 mb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg shadow hover:from-red-600 hover:to-red-700 transition"
        >
          🚪 Logout
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 text-xs text-center text-gray-300 border-t border-blue-600">
        © {new Date().getFullYear()} Oddo
      </div>
    </aside>
  );
}

export default Sidebar;
