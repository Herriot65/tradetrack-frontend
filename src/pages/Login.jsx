import { useSearchParams } from "react-router-dom";
import LoginForm from "../components/forms/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";
export default function Login() {
  const [params] = useSearchParams();
  return (
    <AuthLayout>
      <LoginForm sessionExpired={params.get("reason") === "session-expired"} />
    </AuthLayout>
  );
}
