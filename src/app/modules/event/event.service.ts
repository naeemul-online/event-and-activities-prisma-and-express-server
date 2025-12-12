import { EventStatus } from "@prisma/client";
import { Request } from "express";
import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { stripe } from "../../helper/stripe";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import { eventSearchableFields } from "./event.constant";

const createCategory = async (req: Request) => {
  const result = await prisma.category.create({
    data: {
      name: req.body.name,
    },
  });
  return result;
};

const createEvent = async (user: IJWTPayload, req: Request) => {
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.image = uploadResult?.secure_url as string;
  }

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
      hostId: hostId?.id,
      fee: req.body.fee,
      image: req.body.image,
    },
  });
};

const joinEvent = async (user: IJWTPayload, req: Request) => {
  const { email } = user;
  const participantUser = await prisma.user.findUniqueOrThrow({
    where: {
      email: email,
    },
  });

  const userId = participantUser.id;
  const eventId = req.params.eventId;

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status !== EventStatus.OPEN) {
    throw new Error("Event is not open");
  }

  const existing = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
  });

  if (existing) {
    throw new Error("Already joined this event");
  }

  const participantCount = await prisma.eventParticipant.count({
    where: { eventId, status: "JOINED" },
  });

  if (event.maxParticipants && participantCount >= event.maxParticipants) {
    throw new Error("Event is full");
  }

  await prisma.eventParticipant.create({
    data: {
      eventId,
      userId,
      status: "PENDING",
    },
  });

  const payment = await prisma.payment.create({
    data: {
      eventId,
      userId,
      amount: event.fee,
      currency: event.currency,
      status: "PENDING",
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: event.currency.toLowerCase(),
          product_data: {
            name: event.title,
          },
          unit_amount: Number(event.fee) * 100, // cents
        },
        quantity: 1,
      },
    ],
    success_url: `https://www.linkedin.com`,
    cancel_url: `https://www.facebook.com/`,
    metadata: {
      paymentId: payment.id,
      userId,
      eventId,
    },
  });

  return { paymentUrl: session.url, session: session };
};

const getAllEvent = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filtersData } = params;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: eventSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filtersData).length > 0) {
    andConditions.push({
      AND: Object.keys(filtersData).map((key) => ({
        [key]: {
          equals: (filtersData as any)[key],
        },
      })),
    });
  }

  const whereConditions =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const result = await prisma.event.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      host: {
        select: {
          profile: true,
        },
      },
    },
  });

  const total = await prisma.event.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleEvent = async (req: Request) => {
  const { id } = req.params;
  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      host: {
        select: {
          profile: true,
        },
      },
    },
  });
  return event;
};

const getAllCategory = async (req: Request) => {
  const event = await prisma.category.findMany({
    include: {
      events: true,
    },
  });
  return event;
};

export const EventService = {
  createCategory,
  createEvent,
  joinEvent,
  getAllEvent,
  getSingleEvent,
  getAllCategory,
};
