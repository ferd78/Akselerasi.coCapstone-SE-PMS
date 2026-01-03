import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const EmployeeLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar role="employee" />
      <main className="flex-1 min-w-0 overflow-y-auto px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;