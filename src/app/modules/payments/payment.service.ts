import { ParticipantStatus, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "../../shared/prisma";

const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const { eventId, userId, paymentId } = session.metadata || {};

      if (!eventId || !userId || !paymentId) {
        console.error("⚠️ Missing metadata in session");
        return;
      }

      await prisma.payment.update({
        where: {
          id: Number(paymentId),
        },
        data: {
          status:
            session.payment_status === "paid"
              ? PaymentStatus.PAID
              : PaymentStatus.UNPAID,
        },
      });

      await prisma.eventParticipant.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          status:
            session.payment_status === "paid"
              ? ParticipantStatus.JOINED
              : ParticipantStatus.PENDING,
          joinedAt: new Date(),
        },
      });

      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
};

export const PaymentService = {
  handleStripeWebhook,
};
