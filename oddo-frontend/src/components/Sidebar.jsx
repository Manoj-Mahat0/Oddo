import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Projects", path: "/admin/projects", icon: "📂" },
    { name: "Sprints", path: "/admin/sprints", icon: "✅" },
    { name: "Backlogs", path: "/admin/backlogs", icon: "📈" },
    { name: "Course", path: "/admin/course", icon: "📚" },
    { name: "Attendance", path: "/admin/attendance", icon: "🕒" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950 backdrop-blur-lg border-r border-gray-800 text-white shadow-2xl flex flex-col">
      
      {/* Logo */}
      <div className="p-6 text-2xl font-extrabold tracking-wide">
        <span className="text-blue-400">E-Digital</span> <span className="text-gray-400 text-sm">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-blue-400 hover:bg-white/10"
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
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition"
        >
          🚪 Logout
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 text-xs text-center text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} E-Digital
      </div>
    </aside>
  );
}

export default Sidebar;
// new push