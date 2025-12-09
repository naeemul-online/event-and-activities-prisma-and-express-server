import { UserRole } from "@prisma/client";

export interface IJWTPayload {
  email: string;
  role: UserRole;
}
