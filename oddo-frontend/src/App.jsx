import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import UsersPage from "./pages/UsersPage";
import ProjectsPage from "./pages/ProjectsPage";
import AdminSprintsPage from "./pages/AdminSprintsPage";
import AdminBacklogsPage from "./pages/AdminBacklogsPage";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import DeveloperBacklogsPage from "./pages/DeveloperBacklogsPage";
import DeveloperBugsPage from "./pages/DeveloperBugsPage";
import TesterDashboard from "./pages/TesterDashboardPage";
import TesterBugsPage from "./pages/TesterBugsPage";
import AdminCourse from "./pages/AdminCourse";
import StaffDashboard from "./pages/StaffDashboard";
import StaffClasses from "./pages/StaffClasses";
import StaffAssignments from "./pages/StaffAssignments";
import StudentDashbord from "./pages/StudentDashboard";
import StudentClasses from "./pages/StudentClasses";
import StudentAssignments from "./pages/StudentAssignments";
import AdminAttendance from "./pages/AdminAttendance";

import Landing from "./pages/Landing";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<AdminDashboard />} />
      {/* <Route path="/developer" element={<DeveloperDashboard />} /> */}
      <Route path="/admin/users" element={<UsersPage />} />
      <Route path="/admin/projects" element={<ProjectsPage />} /> {/* 👈 new route */}
      <Route path="/admin/tasks" element={<AdminSprintsPage />} />   {/* ✅ */}
      <Route path="/admin/backlogs" element={<AdminBacklogsPage />} />
      <Route path="/developer" element={<DeveloperDashboard />} />
      <Route path="/developer/backlogs" element={<DeveloperBacklogsPage />} />
      <Route path="/developer/bugs" element={<DeveloperBugsPage />} />
      <Route path="/tester" element={<TesterDashboard />} />
      <Route path="/tester/bugs" element={<TesterBugsPage />} />
      <Route path="/admin/course" element={<AdminCourse />} />
      <Route path="/staff" element={<StaffDashboard />} />
      <Route path="/staff/classes" element={<StaffClasses />} />
      <Route path="/staff/assignments" element={<StaffAssignments />} />
      <Route path="/student" element={<StudentDashbord />} />
      <Route path="/student/classes" element={<StudentClasses />} />
      <Route path="/student/assignments" element={<StudentAssignments />} />
      <Route path="/admin/attendance" element={<AdminAttendance />} />

      {/* <Route 


      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

export default App;
