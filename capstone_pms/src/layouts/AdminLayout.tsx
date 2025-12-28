import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AdminLayout = () => {
  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1 p-4">
        <Outlet/>
      </div>
    </div>
  );
};

export default AdminLayout;