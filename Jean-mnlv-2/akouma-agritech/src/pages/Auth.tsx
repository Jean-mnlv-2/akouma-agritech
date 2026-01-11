import { useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function Auth() {
  useEffect(() => {
    // Clear any stale admin access flag to avoid unintended redirects
    sessionStorage.removeItem('admin_access_granted');
  }, []);

  return <AuthForm />;
}