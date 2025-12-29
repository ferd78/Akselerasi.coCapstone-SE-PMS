import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const ManagerDashboard = () => {
  return (
    <div className="max-w mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Manager Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your team's performance and development
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ">
        {[
          {
            label: "Team Members",
            icon: <Users className="size-6 text-blue-600" />,
            color: "bg-blue-100",
          },
          {
            label: "Pending Reviews",
            icon: <Clock className="size-6 text-orange-600" />,
            color: "bg-orange-100",
            action: "Action Needed",
          },
          {
            label: "In Progress",
            icon: <TrendingUp className="size-6 text-yellow-600" />,
            color: "bg-yellow-100",
          },
          {
            label: "Completed",
            icon: <CheckCircle className="size-6 text-green-600" />,
            color: "bg-green-100",
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                {stat.icon}
              </div>

              {stat.action && (
                <span className="text-sm bg-orange-50 text-orange-700 px-3 py-1 rounded-full">
                  {stat.action}
                </span>
              )}
            </div>

            <div className="text-3xl mb-1">—</div>
            <div className="text-gray-600">
              {stat.label}
            </div>

            {stat.label === "Pending Reviews" && (
              <Link
                to="/manager/evaluation"
                className="text-blue-600 text-sm mt-3 inline-flex items-center gap-1"
              >
                Start reviews <ArrowRight className="size-4" />
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Team Overview */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Team Overview</h2>
          <Link
            to="/manager/evaluation"
            className="text-blue-600 text-sm"
          >
            Manage all
          </Link>
        </div>

        {/* Empty state */}
        <div className="text-center py-12 text-gray-500">
          <Users className="size-12 mx-auto mb-3" />
          <p>No team data available</p>
          <p className="text-sm mt-1">
            Team members will appear here once loaded
          </p>
        </div>

        {/* TEMPLATE — enable later */}
        {false && (
          <div className="space-y-3">
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white size-12 rounded-lg flex items-center justify-center">
                  A
                </div>
                <div>
                  <div>Employee Name</div>
                  <div className="text-sm text-gray-600">
                    Position
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    Performance
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-gray-100">
                    —
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    Review Status
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-orange-600" />
                    <span className="text-sm">
                      Pending
                    </span>
                  </div>
                </div>

                <Link
                  to="/manager/evaluation/employee-id"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Evaluate
                </Link>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "360 Feedback",
            desc: "Initiate and manage feedback cycles",
            icon: <Users className="size-6 text-blue-600" />,
            link: "/manager/feedback",
            bg: "bg-blue-100",
          },
          {
            title: "Development Planning",
            desc: "Create and manage development plans",
            icon: <TrendingUp className="size-6 text-green-600" />,
            link: "/manager/development",
            bg: "bg-green-100",
          },
          {
            title: "Reward Recommendations",
            desc: "Recommend team members for rewards",
            icon: <CheckCircle className="size-6 text-purple-600" />,
            link: "/manager/rewards",
            bg: "bg-purple-100",
          },
        ].map((action) => (
          <Link to={action.link} key={action.title}>
            <Card className="p-6 hover:border-blue-300 transition-colors border border-gray-200">
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

export default ManagerDashboard;
