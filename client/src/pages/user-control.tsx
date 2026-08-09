import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Plus, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getRoleDisplayName, useAuth } from "@/lib/auth";

interface ManagedUser {
  id: number;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RoleDescriptor {
  role: string;
  label: string;
  permissions: string[];
}

const emptyForm = {
  username: "",
  password: "",
  role: "assistant",
  firstName: "",
  lastName: "",
  email: "",
};

export default function UserControlPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { user, permissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersKey = ["/api/admin/users"];
  const rolesKey = ["/api/admin/roles"];

  const { data: users = [], isLoading: isUsersLoading } = useQuery<ManagedUser[]>({
    queryKey: usersKey,
    queryFn: () => apiRequest("GET", "/api/admin/users"),
    enabled: permissions.canManageRoles,
  });

  const { data: roles = [] } = useQuery<RoleDescriptor[]>({
    queryKey: rolesKey,
    queryFn: () => apiRequest("GET", "/api/admin/roles"),
    enabled: permissions.canManageRoles,
  });

  const roleMap = useMemo(() => new Map(roles.map((role) => [role.role, role])), [roles]);

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/users", form),
    onSuccess: () => {
      setForm(emptyForm);
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: usersKey });
      toast({ title: "User created", description: "The new user can now sign in." });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to create user", description: error.message, variant: "destructive" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => apiRequest("PATCH", `/api/admin/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
      toast({ title: "Role updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to update role", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
      toast({ title: "User removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to remove user", description: error.message, variant: "destructive" });
    },
  });

  if (!permissions.canManageRoles) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            This page is available only for Club Super Admin users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Control</h1>
          <p className="text-muted-foreground mt-1">Manage club users, roles, and role privileges.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First Name" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} />
              <Field label="Last Name" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
              <Field label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
              <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
              <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {roles.map((role) => (
                    <option key={role.role} value={role.role}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUsersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">Loading users...</TableCell>
                  </TableRow>
                ) : users.map((managedUser) => (
                  <TableRow key={managedUser.id}>
                    <TableCell>
                      <div className="font-medium">{managedUser.firstName} {managedUser.lastName}</div>
                      <div className="text-sm text-muted-foreground">{managedUser.email}</div>
                    </TableCell>
                    <TableCell>{managedUser.username}</TableCell>
                    <TableCell>
                      <select
                        value={managedUser.role}
                        onChange={(event) => roleMutation.mutate({ id: managedUser.id, role: event.target.value })}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        disabled={roleMutation.isPending}
                      >
                        {roles.map((role) => (
                          <option key={role.role} value={role.role}>{role.label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteMutation.mutate(managedUser.id)}
                        disabled={deleteMutation.isPending || managedUser.id === user?.id}
                        aria-label="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Role Privileges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.map((role) => (
              <div key={role.role} className="border rounded-lg p-3 space-y-2">
                <div className="font-medium">{getRoleDisplayName(role.role)}</div>
                <div className="flex flex-wrap gap-2">
                  {(roleMap.get(role.role)?.permissions || []).map((permission) => (
                    <Badge key={permission} variant="secondary">{permission.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
