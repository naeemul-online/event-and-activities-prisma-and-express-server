import { EventStatus, Prisma } from "@prisma/client";
import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
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
    throw new ApiError(httpStatus.BAD_REQUEST, "Host not found");
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
      hostId: hostId?.id,
      fee: req.body.fee,
      image: req.body.image,
    },
  });
};

const reviewEvent = async (user: IJWTPayload, req: Request) => {
  const reviewer = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      id: true,
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
      "ou can only review events you joined"
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
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found");
  }

  if (event.status !== EventStatus.OPEN) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event is not open");
  }

  const existing = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Already joined this event");
  }

  const participantCount = await prisma.eventParticipant.count({
    where: { eventId, status: "JOINED" },
  });

  if (event.maxParticipants && participantCount >= event.maxParticipants) {
    throw new ApiError(httpStatus.CONFLICT, "Event is full");
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

  return { paymentUrl: session.url };
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

const getJoinEvents = async (
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
  updateEvent,
  deleteEvent,
  getMyEvents,
  getJoinEvents,
};
