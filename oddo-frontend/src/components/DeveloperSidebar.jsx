import React from "react";
import { Link, useNavigate } from "react-router-dom";

function DeveloperSidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/developer" },
    { name: "Backlogs", path: "/developer/backlogs" },
    { name: "Bugs", path: "/developer/bugs" },
    // { name: "Settings", path: "/developer/settings" },
  ];

  const handleLogout = () => {
    // ✅ Clear auth
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");

    navigate("/login"); // redirect to login
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 to-purple-700 text-white h-screen flex flex-col justify-between shadow-xl">
      <div>
        {/* Logo */}
        <h2 className="text-2xl font-extrabold px-6 py-6">⚡ Dev Panel</h2>

        {/* Navigation */}
        <nav className="space-y-2 px-4">
          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className="block py-2 px-4 rounded-lg hover:bg-white/20 transition"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout + Footer */}
      <div className="px-6 py-4 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 rounded-lg shadow transition"
        >
          🚪 Logout
        </button>
        <div className="text-sm text-white/70 text-center">
          © 2025 Oddo Dev
        </div>
      </div>
    </aside>
  );
}

export default DeveloperSidebar;
