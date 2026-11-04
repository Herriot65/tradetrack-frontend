import RegisterForm from "../components/forms/RegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";
export default function Register() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
