import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../schemas/registerSchema";
import { registerUser } from "../../api/auth.api";
import { useNavigate, Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "./PasswordInput";
import { FormErrorBanner } from "./FormErrorBanner";
import { FieldError } from "./FieldError";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setServerError("");

    if (data.password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setConfirmPasswordError("");

    try {
      await registerUser(data);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setServerError(
        "Unable to create your account. Please check your details and try again."
      );
    }
  };

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-xl shadow-black/20 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <img
            src="/trader_track_logo.png"
            alt="TraderTrack"
            className="h-16 w-16 rounded-xl"
            style={{ animation: "float 3s ease-in-out infinite" }}
          />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create account
        </CardTitle>
        <CardDescription>
          Start tracking your trading performance today
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormErrorBanner message={serverError} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="John"
                autoComplete="given-name"
                aria-invalid={!!errors.first_name}
                {...register("first_name")}
              />
              <FieldError message={errors.first_name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Doe"
                autoComplete="family-name"
                aria-invalid={!!errors.last_name}
                {...register("last_name")}
              />
              <FieldError message={errors.last_name?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <PasswordInput
              id="confirm_password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!confirmPasswordError}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (confirmPasswordError) {
                  setConfirmPasswordError("");
                }
              }}
            />
            <FieldError message={confirmPasswordError} />
          </div>

          <Button className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <div className="pt-1">
            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to home
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
