import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./layouts/AdminDashboard";
import HRDashboard from "./layouts/HRDashboard";
import EmployeeDashboard from "./layouts/EmployeeDashboard";
import ManagerDashboard from "./layouts/ManagerDashboard";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>}>
          <Route index element={<div>Admin Dashboard Home</div>} />
          <Route path="performance" element={<div>Admin Performance Review</div>} />
          <Route path="feedback" element={<div>Admin 360 Feedback</div>} />
          <Route path="development" element={<div>Admin Development Plans</div>} />
          <Route path="settings" element={<div>Admin Panel Settings</div>} />
        </Route>

      
        <Route path="/hr" element={<RequireAuth><HRDashboard /></RequireAuth>}>
          <Route index element={<div>HR Dashboard Home</div>} />
          <Route path="performance" element={<div>HR Performance Review</div>} />
          <Route path="feedback" element={<div>HR 360 Feedback</div>} />
          <Route path="development" element={<div>HR Development Plans</div>} />
        </Route>

        
        <Route path="/employee" element={<RequireAuth><EmployeeDashboard /></RequireAuth>}>
          <Route index element={<div>Employee Dashboard Home</div>} />
          <Route path="performance" element={<div>My Performance Reviews</div>} />
          <Route path="feedback" element={<div>My 360 Feedback</div>} />
          <Route path="development" element={<div>My Development Plans</div>} />
        </Route>

        
        <Route path="/manager" element={<RequireAuth><ManagerDashboard /></RequireAuth>}>
          <Route index element={<div>Manager Dashboard Home</div>} />
          <Route path="performance" element={<div>Team Performance Review</div>} />
          <Route path="feedback" element={<div>Team 360 Feedback</div>} />
          <Route path="development-overview" element={<div>Employee Development Overview</div>} />
        </Route>

        
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;