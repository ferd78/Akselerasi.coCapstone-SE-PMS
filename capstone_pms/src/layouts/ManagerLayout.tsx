import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const ManagerLayout = () => {
  return (
    <div className="flex">
      <Sidebar role="manager" />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default ManagerLayout
