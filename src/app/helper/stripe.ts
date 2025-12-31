import Stripe from "stripe";
import config from "../../config";

export const stripe = new Stripe(config.strip_secret!);

export const createStripeSession = async ({
  event,
  paymentId,
  userId,
  eventId,
}: {
  event: any;
  paymentId: number;
  userId: string;
  eventId: string;
}) => {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: event.currency.toLowerCase(),
          product_data: {
            name: event.title,
          },
          unit_amount: Number(event.fee) * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${config.stripe_success_url}/payment/success?eventId=${eventId}`,
    cancel_url: `${config.stripe_cancel_url}/events/${eventId}`,
    metadata: {
      paymentId,
      userId,
      eventId,
    },
  });
};
