import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import { loginSchema } from "../../schemas/loginSchema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Invalid credentials");
    }
  };

  return (
    <Card className="w-full max-w-md p-6 bg-gray-900 border-gray-800">
      
      <h1 className="text-2xl font-bold text-white text-center mb-6">
        Welcome back
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* EMAIL */}
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="space-y-1">
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* FORGOT PASSWORD */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-gray-400 hover:text-green-500 transition"
          >
            Forgot password?
          </Link>
        </div>

        {/* SUBMIT */}
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>

        {/* REGISTER LINK */}
        <p className="text-sm text-center text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-green-500 hover:underline">
            Create account
          </Link>
        </p>

      </form>
    </Card>
  );
}