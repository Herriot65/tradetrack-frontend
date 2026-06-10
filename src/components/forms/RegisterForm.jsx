import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../schemas/registerSchema";
import { registerUser } from "../../api/auth.api";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function RegisterForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to register");
    }
  };

  return (
    <Card className="w-full max-w-md p-6 bg-gray-900 border-gray-800">
      
      <h1 className="text-2xl font-bold text-white text-center mb-6">
        Create account
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

        {/* FIRST NAME */}
        <div className="space-y-1">
          <Label>First name</Label>
          <Input
            type="text"
            placeholder="John"
            {...register("first_name")}
          />
          {errors.first_name && (
            <p className="text-sm text-red-500">
              {errors.first_name.message}
            </p>
          )}
        </div>

        {/* LAST NAME */}
        <div className="space-y-1">
          <Label>Last name</Label>
          <Input
            type="text"
            placeholder="Doe"
            {...register("last_name")}
          />
          {errors.last_name && (
            <p className="text-sm text-red-500">
              {errors.last_name.message}
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

        {/* SUBMIT */}
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Register"}
        </Button>

        <div className="flex justify-center">
            <Link to="/login" className="text-sm text-center text-gray-400 hover:text-gray-300">    Already have an account? <span className="text-green-500 hover:text-green-600">Login</span></Link>
        </div>

      </form>
    </Card>
  );
}