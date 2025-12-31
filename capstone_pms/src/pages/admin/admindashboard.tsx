import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Activity,
  Settings,
  FileText,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="max-w mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          System Administration
        </h1>
        <p className="text-gray-600 mt-1">
          Manage system configuration and users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: "204",
            icon: <Users className="size-6 text-blue-600" />,
            bg: "bg-blue-100",
            link: "/admin/users",
            linkText: "Manage →",
          },
          {
            title: "Active Review Cycles",
            value: "2",
            icon: <Calendar className="size-6 text-green-600" />,
            bg: "bg-green-100",
            status: "Active",
            link: "/admin/performance",
            linkText: "View →",
          },
          {
            title: "System Activities Today",
            value: "1,247",
            icon: <Activity className="size-6 text-purple-600" />,
            bg: "bg-purple-100",
            link: "/admin/audit",
            linkText: "View log →",
          },
          {
            title: "System Health",
            value: "98%",
            icon: <Settings className="size-6 text-orange-600" />,
            bg: "bg-orange-100",
          },
        ].map((stat) => (
          <Card
            key={stat.title}
            className="p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                {stat.icon}
              </div>

              {stat.status && (
                <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  {stat.status}
                </span>
              )}
            </div>

            <div className="text-3xl mb-1">
              {stat.value}
            </div>
            <div className="text-gray-600 mb-2">
              {stat.title}
            </div>

            {stat.link && (
              <Link
                to={stat.link}
                className="text-blue-600 text-sm"
              >
                {stat.linkText}
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Active Review Cycles */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">
            Active Review Cycles
          </h2>
          <Link
            to="/admin/performance"
            className="text-blue-600 text-sm"
          >
            Manage all
          </Link>
        </div>
        
                      
                <Card className="p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl">
                            Active Review Cycles
                            </h2>
                            <Link
                            to="/admin/performance"
                            className="text-blue-600 text-sm"
                            >
                            Manage all
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                            {
                                title: "Q4 2024 Performance Review",
                                date: "01/12/2024 - 31/12/2024",
                                progress: "57%",
                                completion: "89/156",
                            },
                            {
                                title: "360 Feedback - Q4 2024",
                                date: "10/12/2024 - 28/12/2024",
                                progress: "50%",
                                completion: "67/134",
                            },
                            ].map((cycle) => (
                            <Card
                                key={cycle.title}
                                className="p-5 border border-gray-200"
                            >
                                {/* Title */}
                                <div className="mb-3">
                                <div className="font-medium">
                                    {cycle.title}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {cycle.date}
                                </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-gray-600">
                                    Progress
                                    </div>
                                    <div className="text-lg">
                                    {cycle.progress}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-600">
                                    Completion
                                    </div>
                                    <div className="text-lg">
                                    {cycle.completion}
                                    </div>
                                </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-between">
                                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                                    Active
                                </span>

                                <Link
                                    to="/admin/performance"
                                    className="text-blue-600 text-sm"
                                >
                                    View →
                                </Link>
                                </div>
                            </Card>
                            ))}
                        </div>
                    </Card>

      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "User Management",
            desc: "Create and manage user accounts",
            icon: <Users className="size-6 text-blue-600" />,
            link: "/admin/users",
            bg: "bg-blue-100",
          },
          {
            title: "Review Cycles",
            desc: "Configure review periods",
            icon: <Calendar className="size-6 text-green-600" />,
            link: "/admin/performance",
            bg: "bg-green-100",
          },
          {
            title: "System Config",
            desc: "Manage system settings",
            icon: <Settings className="size-6 text-purple-600" />,
            link: "/admin/settings",
            bg: "bg-purple-100",
          },
          {
            title: "Audit Log",
            desc: "View system activity",
            icon: <FileText className="size-6 text-orange-600" />,
            link: "/admin/audit",
            bg: "bg-orange-100",
          },
        ].map((action) => (
          <Link to={action.link} key={action.title}>
            <Card className="p-6 border border-gray-200 hover:border-blue-300 transition-colors">
              <div
                className={`${action.bg} p-3 rounded-lg w-fit mb-4`}
              >
                {action.icon}
              </div>
              <h3 className="text-lg mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {action.desc}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
