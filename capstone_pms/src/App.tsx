import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import HRLayout from "./layouts/HRLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/dashboard";
import EmployeeDevelopmentPlan from "./pages/employee/development";
import EmployeePerformanceReview from "./pages/employee/reviews";
import EmployeeFeedbackRequests from "./pages/employee/feedback";
import EmployeeRewards from "./pages/employee/rewards";
import EmployeeProfile from "./pages/employee/profile";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerPerformanceReview from "./pages/manager/ManagerPerformanceReview";
import Manager360Feedback from "./pages/manager/ManagerFeedback";
import ManagerDevelopmentPlanning from "./pages/manager/ManagerDevelopment";
import ManagerRewards from "./pages/manager/ManagerRewards";
import ManagerProfile from "./pages/manager/ManagerProfile";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";


const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

        <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<div>Admin Dashboard Home</div>} />
          <Route path="performance" element={<div>Admin Performance Review</div>} />
          <Route path="feedback" element={<div>Admin 360 Feedback</div>} />
          <Route path="development" element={<div>Admin Development Plans</div>} />
          <Route path="settings" element={<div>Admin Panel Settings</div>} />
        </Route>



        <Route path="/hr" element={<RequireAuth><HRLayout /></RequireAuth>}>
          <Route index element={<div>HR Dashboard Home</div>} />
          <Route path="performance" element={<div>HR Performance Review</div>} />
          <Route path="feedback" element={<div>HR 360 Feedback</div>} />
          <Route path="development" element={<div>HR Development Plans</div>} />
        </Route>



        <Route path="/employee" element={<RequireAuth><EmployeeLayout /></RequireAuth>}>
          <Route index element={<EmployeeDashboard/>} />
          <Route path="performance" element={<EmployeePerformanceReview />} />
          <Route path="feedback" element={<EmployeeFeedbackRequests />} />
          <Route path="development" element={<EmployeeDevelopmentPlan />} />
          <Route path="reward" element={<EmployeeRewards/>} />
          <Route path="profile" element={<EmployeeProfile/>} />
        </Route>



        <Route path="/manager" element={<RequireAuth><ManagerLayout /></RequireAuth>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="performance" element={<ManagerPerformanceReview/>} />
          <Route path="feedback" element={<Manager360Feedback />} />
          <Route path="development-overview" element={<ManagerDevelopmentPlanning user={null}/>} />
          <Route path="team-reward" element={<ManagerRewards/>} />
          <Route path="profile" element={<ManagerProfile/>}/>
        </Route>

        
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;