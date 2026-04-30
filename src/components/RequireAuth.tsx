import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}