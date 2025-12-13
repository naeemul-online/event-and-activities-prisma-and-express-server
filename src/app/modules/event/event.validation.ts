import z from "zod";

const categorySchema = z.object({
  name: z.string().nonempty("Name is required"),
});

const createEventSchema = z.object({
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
  fee: z.number().optional(),
  currency: z.string().optional(),
});

const createReviewSchema = z.object({
  eventId: z.string("Event ID is required"),

  rating: z
    .number("Rating is required")
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),

  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters")
    .max(500, "Comment must be less than 500 characters")
    .optional(),
});

export const eventValidation = {
  categorySchema,
  createEventSchema,
  createReviewSchema,
};
