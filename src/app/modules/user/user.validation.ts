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

export const UserValidation = {
  createUserValidationSchema,
};
