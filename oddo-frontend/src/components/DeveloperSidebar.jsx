import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function DeveloperSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/developer" },
    { name: "Backlogs", path: "/developer/backlogs" },
    { name: "Bugs", path: "/developer/bugs" },
    // { name: "Settings", path: "/developer/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen bg-black/80 backdrop-blur-xl border-r border-purple-900/40 text-white flex flex-col justify-between shadow-[0_0_25px_rgba(168,85,247,0.3)]">
      <div>
        {/* Logo */}
        <h2 className="text-2xl font-extrabold px-6 py-6 text-purple-400 tracking-wide">
          ⚡ Dev Panel
        </h2>

        {/* Navigation */}
        <nav className="space-y-2 px-4">
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={i}
                to={item.path}
                className={`block py-2 px-4 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg"
                    : "hover:bg-purple-800/40 text-gray-300 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout + Footer */}
      <div className="px-6 py-4 space-y-3 border-t border-purple-900/40">
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:scale-95 transition-all text-white font-medium py-2 rounded-lg shadow-lg"
        >
          🚪 Logout
        </button>
        <div className="text-sm text-gray-500 text-center">
          © 2025 E-Digital Dev
        </div>
      </div>
    </aside>
  );
}

export default DeveloperSidebar;
// new push