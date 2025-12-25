import { UserRole } from "@prisma/client";

export interface IJWTPayload {
  id: string;
  email: string;
  role: UserRole;
}
