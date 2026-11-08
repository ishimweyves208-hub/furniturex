import { z } from "zod";
import { passwordIssues } from "@/lib/auth/password";

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .superRefine((value, ctx) => {
    for (const issue of passwordIssues(value)) {
      ctx.addIssue({ code: "custom", message: issue });
    }
  });

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is required.")
  .max(254, "Email is too long.")
  .email("Enter a valid email address.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(120),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
    role: z.enum(["customer", "seller"]),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    shopName: z.string().trim().max(120).optional().or(z.literal("")),
    acceptTerms: z.literal(true, { message: "You must accept the terms to continue." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "seller" || (data.shopName && data.shopName.length >= 2), {
    message: "Shop name is required for seller accounts.",
    path: ["shopName"],
  });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required.").max(128),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "Reset token is invalid."),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  avatar: z.string().trim().url("Avatar must be a valid URL.").max(500).optional().or(z.literal("")),
});

export const shopProfileSchema = z.object({
  shopName: z.string().trim().min(2, "Shop name is required.").max(120),
  shopDescription: z.string().trim().max(2000).optional().or(z.literal("")),
  shopLogo: z.string().trim().url("Logo must be a valid URL.").max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});
