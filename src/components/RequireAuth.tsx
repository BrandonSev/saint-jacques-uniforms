import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, authLoading, isApel, isAdmin } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    // Les utilisateurs APEL (non admin) n'ont accès qu'à leur tableau de bord
    if (isApel && !isAdmin && location.pathname !== "/apel") {
      navigate({ to: "/apel" });
    }
  }, [user, authLoading, isApel, isAdmin, location.pathname, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }
  if (!user) return null;
  if (isApel && !isAdmin && location.pathname !== "/apel") return null;
  return <>{children}</>;
}