import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@stackframe/stack";

export default function DashboardPageClient() {
  const user = useUser();

  return (
    <div>
      <Label className="text-sm">Team name</Label>
      <Input placeholder="Team name" />
      <Button className="mt-4 w-full">Create team</Button>
      {user ? null : <div className="mt-3 text-sm text-red-600">Please sign in first.</div>}
    </div>
  );
}
