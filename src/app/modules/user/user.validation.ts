import z from "zod";
import { userRole } from "./user.interface";

const createUserValidationSchema = z.object({
  email: z.email(),
  password: z.string(),
  role: z.enum(userRole).optional(),
  interest: z.array(z.string()).optional(),
  profile: z.object({
    fullName: z.string().nonempty("Name is required"),
    bio: z.string().optional(),
    image: z.string().optional(),
    location: z.string().optional(),
  }),
  interestIds: z
    .array(z.number().int("Interest ID must be an integer"))
    .min(1, "At least one interest must be selected")
    .optional(),
});

const updateUserValidationSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),

  profile: z
    .object({
      fullName: z.string().min(1).optional(),
      bio: z.string().optional(),
      image: z.string().url().optional(),
      location: z.string().optional(),
    })
    .optional(),

  interestIds: z.array(z.number().int()).optional(),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
