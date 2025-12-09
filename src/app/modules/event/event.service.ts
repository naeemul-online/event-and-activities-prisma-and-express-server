import { Request } from "express";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";

const createCategory = async (req: Request) => {
  const result = await prisma.category.create({
    data: {
      name: req.body.name,
    },
  });
  return result;
};

const createEvent = async (user: IJWTPayload, req: Request) => {
  const hostId = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      id: true,
    },
  });

  if (!hostId) {
    throw new Error("Host not found");
  }

  return prisma.event.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      minParticipants: req.body.minParticipants,
      maxParticipants: req.body.maxParticipants,
      categoryId: req.body.categoryId,
      hostId: hostId?.id as string,
    },
  });
};

const getAllEvent = async (req: Request) => {
  const event = await prisma.event.findMany({
    include: {
      category: true,
      host: {
        select: {
          profile: true,
        },
      },
    },
  });
  return event;
};

export const EventService = {
  createCategory,
  createEvent,
  getAllEvent,
};
