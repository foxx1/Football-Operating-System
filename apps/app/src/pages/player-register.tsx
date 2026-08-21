import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlayerRegister() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token ?? "unknown";

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Player Invitation</CardTitle>
          <CardDescription>Complete your registration with the invitation link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-border bg-muted p-4 font-mono text-sm">
            {token}
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>This page is for players joining the team via an invitation link.</p>
            <p>If the registration process is not available yet, please contact your administrator for assistance.</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
