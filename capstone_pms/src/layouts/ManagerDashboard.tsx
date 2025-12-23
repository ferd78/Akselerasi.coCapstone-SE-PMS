import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const ManagerDashboard = () => {
  return (
    <div className="flex">
      <Sidebar role="manager" />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default ManagerDashboard
