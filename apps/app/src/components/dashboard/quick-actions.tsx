import { useState } from "react";
import { Plus, UserPlus, Grid2x2Check, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const quickActions = [
  {
    id: "schedule-training",
    title: "Schedule Training",
    description: "Create new training session",
    icon: Plus,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "add-player",
    title: "Add Player",
    description: "Register new player",
    icon: UserPlus,
    color: "bg-green-100 dark:bg-green-900/20 text-green-600",
  },
  {
    id: "tactics-board",
    title: "Tactics Board",
    description: "Plan team formations",
    icon: Grid2x2Check,
    color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600",
  },
  {
    id: "generate-report",
    title: "Generate Report",
    description: "Export session data",
    icon: FileText,
    color: "bg-red-100 dark:bg-red-900/20 text-red-600",
  },
];

export default function QuickActions() {
  const { toast } = useToast();

  const handleQuickAction = (actionId: string, title: string) => {
    toast({
      title: `${title} Selected`,
      description: `This will open the ${title.toLowerCase()} interface.`,
    });
  };

  return (
    <Card className="content-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-start h-auto p-3 hover:bg-muted/50"
                onClick={() => handleQuickAction(action.id, action.title)}
              >
                <div className={`icon-wrapper mr-3 ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
