import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const EmployeeDashboard = () => {
  return (
    <div className="flex">
      <Sidebar role="employee" />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default EmployeeDashboard
