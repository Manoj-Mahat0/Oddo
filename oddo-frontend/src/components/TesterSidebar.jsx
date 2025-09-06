import React from "react";
import { Link, useNavigate } from "react-router-dom";

function TesterSidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/tester" },
    { name: "Bugs", path: "/tester/bugs" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen flex flex-col justify-between bg-gradient-to-b from-black via-[#0a0a0f] to-[#0f172a] backdrop-blur-xl border-r border-white/10 shadow-xl">
      <div>
        {/* Logo */}
        <h2 className="text-2xl font-extrabold px-6 py-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          🧪 Tester Panel
        </h2>

        {/* Navigation */}
        <nav className="space-y-2 px-4">
          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className="block py-2 px-4 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
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
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-95 hover:shadow-lg text-white font-medium py-2 rounded-xl shadow-md transition"
        >
          🚪 Logout
        </button>
        <div className="text-sm text-white/50 text-center">
          © 2025 Oddo Tester
        </div>
      </div>
    </aside>
  );
}

export default TesterSidebar;
