import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const ManagerLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar role="manager" />
      <main className="flex-1 min-w-0 overflow-y-auto px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}

export default ManagerLayout
