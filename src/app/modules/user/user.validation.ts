import { UserRole } from "@prisma/client";
import z from "zod";

const createUserValidationSchema = z.object({
  email: z.email(),
  password: z.string(),
  role: z.enum(UserRole).optional(),
  averageRating: z.number().optional(),
  profile: z.object({
    fullName: z.string().nonempty("Name is required"),
    bio: z.string().optional(),
    image: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
};
