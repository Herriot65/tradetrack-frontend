import { z } from "zod";

export const registerSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name is required"),

  last_name: z
    .string()
    .min(2, "Last name is required"),

  email: z
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});