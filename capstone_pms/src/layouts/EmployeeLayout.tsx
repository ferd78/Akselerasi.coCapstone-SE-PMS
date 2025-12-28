import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const EmployeeLayout = () => {
  return (
    <div className="flex">
      <Sidebar role="employee" />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default EmployeeLayout
