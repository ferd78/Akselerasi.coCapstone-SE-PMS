import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const HRDashboard = () => {
  return (
    <div className="flex">
      <Sidebar role="hr" />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default HRDashboard
