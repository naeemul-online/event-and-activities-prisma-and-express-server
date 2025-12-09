import z from "zod";

const categorySchema = z.object({
  name: z.string().nonempty("Name is required"),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z
    .string()
    .datetime(
      "Invalid date format. Use ISO string like 2025-06-30T14:00:00.000Z"
    ),
  location: z.string().min(1, "Location is required"),
  minParticipants: z
    .number()
    .int()
    .min(1, "Minimum participants must be at least 1"),
  maxParticipants: z
    .number()
    .int()
    .min(10, "Maximum participants must be at least 1"),
  categoryId: z.string().uuid("Invalid categoryId (must be a UUID)"),
});

export const eventValidation = {
  categorySchema,
  createEventSchema,
};
