import z from "zod";
import { userRole } from "./user.interface";

const createUserValidationSchema = z.object({
  email: z.email(),
  password: z.string(),
  role: z.enum(userRole).optional(),
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
