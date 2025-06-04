import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
}

const mockTasks: Task[] = [
  {
    id: 1,
    title: "Update medical certificates",
    description: "5 players need renewed certificates",
    dueDate: "Due: Tomorrow",
    priority: "high",
    status: "pending",
  },
  {
    id: 2,
    title: "Match preparation meeting",
    description: "Schedule tactics review with assistant coaches",
    dueDate: "Due: Friday",
    priority: "medium",
    status: "pending",
  },
  {
    id: 3,
    title: "Equipment inventory",
    description: "Review and order new training equipment",
    dueDate: "Due: Next week",
    priority: "low",
    status: "in-progress",
  },
];

const priorityConfig = {
  high: {
    bg: "bg-red-50 dark:bg-red-900/20",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  medium: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  low: {
    bg: "bg-green-50 dark:bg-green-900/20",
    dot: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
};

const statusIcons = {
  pending: AlertCircle,
  "in-progress": Clock,
  completed: CheckCircle,
};

export default function TasksNotifications() {
  const pendingTasks = mockTasks.filter(task => task.status === "pending");

  return (
    <Card className="content-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks & Notifications</CardTitle>
          <Badge variant="destructive" className="text-xs">
            {pendingTasks.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTasks.map((task) => {
            const config = priorityConfig[task.priority];
            const StatusIcon = statusIcons[task.status];
            
            return (
              <div
                key={task.id}
                className={`flex items-start space-x-3 p-3 rounded-lg ${config.bg}`}
              >
                <div className={`w-2 h-2 ${config.dot} rounded-full mt-2 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.description}
                  </p>
                  <p className={`text-xs mt-1 ${config.text}`}>
                    {task.dueDate}
                  </p>
                </div>
                <StatusIcon className={`w-4 h-4 shrink-0 ${config.text}`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
