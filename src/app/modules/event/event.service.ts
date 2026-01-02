import {
  EventStatus,
  ParticipantStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { createStripeSession } from "../../helper/stripe";
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

  return prisma.event.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      location: req.body.location,
      minParticipants: req.body.minParticipants,
      maxParticipants: req.body.maxParticipants,
      categoryId: req.body.categoryId,
      hostId: user.id,
      fee: req.body.fee,
      image: req.body.image,
    },
  });
};

const reviewEvent = async (user: IJWTPayload, req: Request) => {
  const reviewer = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      profile: true,
    },
  });

  if (!reviewer) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
  }

  const event = await prisma.event.findUnique({
    where: { id: req.body.eventId },
    select: {
      id: true,
      date: true,
      hostId: true,
    },
  });

  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found");
  }

  if (new Date() < event.date) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only review after the event ends"
    );
  }

  const participant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: reviewer.id,
      },
    },
  });

  if (!participant || participant.status !== "JOINED") {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You can only review events you joined"
    );
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: reviewer.id,
      },
    },
  });

  if (existingReview) {
    throw new ApiError(httpStatus.CONFLICT, "You already reviewed this event");
  }

  return prisma.review.create({
    data: {
      eventId: req.body.eventId,
      userId: reviewer.id,
      hostId: event.hostId,
      rating: req.body.rating,
      comment: req.body.comment,
    },
  });
};

const joinEvent = async (user: IJWTPayload, req: Request) => {
  const { email } = user;
  const { eventId } = req.params;

  // 1️⃣ Get user
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });

  const userId = dbUser.id;

  // 2️⃣ Get event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found");
  }

  if (event.status !== EventStatus.OPEN) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Event is not open");
  }

  // 3️⃣ Check participant
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
  });

  // 4️⃣ Get latest payment (if exists)
  const latestPayment = await prisma.payment.findFirst({
    where: { eventId, userId },
    orderBy: { createdAt: "desc" },
  });

  console.log(latestPayment);

  /**
   * 🔁 ALREADY EXISTS CASE
   */
  if (participant) {
    // 🟢 Paid already
    if (latestPayment?.status === "PAID") {
      throw new ApiError(
        httpStatus.CONFLICT,
        "You have already joined this event"
      );
    }

    // 🟡 Payment pending → redirect again
    if (latestPayment?.status === "PENDING") {
      const session = await createStripeSession({
        event,
        paymentId: latestPayment.id,
        userId,
        eventId,
      });

      return {
        success: true,
        message: "Payment pending. Redirecting to payment.",
        data: {
          paymentUrl: session.url,
          paymentStatus: "PENDING",
        },
      };
    }
  }

  /**
   * 🧮 Capacity check (ONLY JOINED)
   */
  const joinedCount = await prisma.eventParticipant.count({
    where: {
      eventId,
      status: "JOINED",
    },
  });

  if (event.maxParticipants && joinedCount >= event.maxParticipants) {
    throw new ApiError(httpStatus.CONFLICT, "Event is full");
  }

  /**
   * 🆕 Create participant if not exists
   */
  if (!participant) {
    await prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
        status: "PENDING",
      },
    });
  }

  /**
   * 💳 Create new payment
   */
  const payment = await prisma.payment.create({
    data: {
      eventId,
      userId,
      amount: event.fee,
      currency: event.currency,
      status: "PENDING",
    },
  });

  const session = await createStripeSession({
    event,
    paymentId: payment.id,
    userId,
    eventId,
  });

  return {
    success: true,
    message: "Redirecting to payment",
    data: {
      paymentUrl: session.url,
      paymentStatus: "NEW",
    },
  };
};

const getAllReview = async () => {
  const reviews = await prisma.review.findMany();
  return reviews;
};
const getAllEvent = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const {
    searchTerm,
    category,
    categoryId,
    location,
    startDate,
    endDate,
    status,
    ...filtersData
  } = params;

  const andConditions: Prisma.EventWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...eventSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
        {
          host: {
            is: {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  // 🚦 Status filter (OPEN, FULL, CANCELLED)
  if (status) {
    andConditions.push({
      status: {
        equals: status,
      },
    });
  }

  // if (category) {
  //   andConditions.push({
  //     category: {
  //       is: {
  //         name: {
  //           contains: category,
  //           mode: "insensitive",
  //         },
  //       },
  //     },
  //   });
  // }

  // 🏷 Category filter
  if (categoryId) {
    andConditions.push({
      categoryId: {
        equals: categoryId,
      },
    });
  }

  // 📍 Location filter
  if (location) {
    andConditions.push({
      location: {
        contains: location,
        mode: "insensitive",
      },
    });
  }

  // 📅 Date filter
  if (startDate || endDate) {
    andConditions.push({
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
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

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const events = await prisma.event.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      host: {
        select: {
          email: true,
          profile: true,
        },
      },
      reviews: true,
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
    data: events,
  };
};

const getMyEvents = async (hostId: string, params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const {
    searchTerm,
    category,
    categoryId,
    location,
    startDate,
    endDate,
    status,
    ...filtersData
  } = params;

  const andConditions: Prisma.EventWhereInput[] = [];

  // 🔐 Restrict to logged-in host
  andConditions.push({
    hostId: {
      equals: hostId,
    },
  });

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...eventSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
        {
          host: {
            is: {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  // 🚦 Status filter (OPEN, FULL, CANCELLED)
  if (status) {
    andConditions.push({
      status: {
        equals: status,
      },
    });
  }

  // if (category) {
  //   andConditions.push({
  //     category: {
  //       is: {
  //         name: {
  //           contains: category,
  //           mode: "insensitive",
  //         },
  //       },
  //     },
  //   });
  // }

  // 🏷 Category filter
  if (categoryId) {
    andConditions.push({
      categoryId: {
        equals: categoryId,
      },
    });
  }

  // 📍 Location filter
  if (location) {
    andConditions.push({
      location: {
        contains: location,
        mode: "insensitive",
      },
    });
  }

  // 📅 Date filter
  if (startDate || endDate) {
    andConditions.push({
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
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

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const events = await prisma.event.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      host: {
        select: {
          email: true,
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
    data: events,
  };
};

const getUserJoinEvents = async (
  userId: string,
  params: any,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const {
    searchTerm,
    category,
    categoryId,
    location,
    startDate,
    endDate,
    status,
    ...filtersData
  } = params;

  const andConditions: Prisma.EventWhereInput[] = [];

  // 🔐 Restrict to logged-in host
  // 🔐 Only events user joined
  andConditions.push({
    eventParticipants: {
      some: {
        userId: userId,
      },
    },
  });

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...eventSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
        {
          host: {
            is: {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  // 🚦 Status filter (OPEN, FULL, CANCELLED)
  if (status) {
    andConditions.push({
      status: {
        equals: status,
      },
    });
  }

  // 🏷 Category filter
  if (categoryId) {
    andConditions.push({
      categoryId: {
        equals: categoryId,
      },
    });
  }

  // 📍 Location filter
  if (location) {
    andConditions.push({
      location: {
        contains: location,
        mode: "insensitive",
      },
    });
  }

  // 📅 Date filter
  if (startDate || endDate) {
    andConditions.push({
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
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

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const events = await prisma.event.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      category: {
        select: { name: true },
      },
      host: {
        select: {
          email: true,
          profile: true,
        },
      },
      payments: {
        where: { userId },
        select: {
          status: true,
          id: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  const formattedEvents = events.map((event) => {
    const payment = event.payments[0] || null;

    return {
      ...event,
      paymentStatus: payment?.status ?? "PENDING",
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
          }
        : null,
      payments: undefined,
    };
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
    data: formattedEvents,
  };
};

const getSingleEvent = async (req: Request & { user?: any }) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: true,
            },
          },
        },
      },
      host: {
        select: {
          profile: true,
        },
      },
      eventParticipants: true,
      payments: userId
        ? {
            where: { userId },
            select: { status: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          }
        : false,
    },
  });
  return {
    ...event,

    paymentStatus: event.payments?.[0]?.status ?? null,
  };
};

const leaveEvent = async (user: IJWTPayload, req: Request) => {
  const { email } = user;
  const { eventId } = req.params;

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });

  const userId = dbUser.id;

  // Participant check
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
  });

  if (!participant) {
    throw new ApiError(httpStatus.NOT_FOUND, "You are not part of this event");
  }

  // Event check
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  if (event.date < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot leave a past event");
  }

  // Latest payment
  const payment = await prisma.payment.findFirst({
    where: { eventId, userId },
    orderBy: { createdAt: "desc" },
  });

  // Transaction for consistency
  await prisma.$transaction(async (tx) => {
    await tx.eventParticipant.update({
      where: {
        eventId_userId: { eventId, userId },
      },
      data: {
        status: ParticipantStatus.LEFT,
      },
    });

    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status:
            payment.status === "PAID"
              ? PaymentStatus.REFUNDED
              : PaymentStatus.CANCELLED,
        },
      });
    }
  });

  return {
    success: true,
    message: "You have left the event successfully",
  };
};

const getAllCategory = async (req: Request) => {
  const event = await prisma.category.findMany();
  return event;
};

const updateEvent = async (user: IJWTPayload, req: Request) => {
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
    throw new ApiError(httpStatus.NOT_FOUND, "Host not found!");
  }

  const result = await prisma.event.update({
    where: {
      id: req.params.id,
    },
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

  return result;
};

const deleteEvent = async (req: Request) => {
  const event = await prisma.event.delete({
    where: {
      id: req.params.id,
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
  reviewEvent,
  getAllReview,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getUserJoinEvents,
  leaveEvent,
};
