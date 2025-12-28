import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  to: string;                 // link destination
  icon: LucideIcon;
  iconBg: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  to,
  icon: Icon,
  iconBg,
}: StatCardProps) => {
  return (
    <Card className="p-6">
      
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className="size-6" />
        </div>
      </div>

      
      <div className="text-3xl mb-1">
        {value}
      </div>

      
      <div className="text-gray-600">
        {title}
      </div>

      
      <Link
        to={to}
        className="inline-block text-blue-600 text-sm mt-3"
      >
        {subtitle}
      </Link>
    </Card>
  );
};

export default StatCard;
