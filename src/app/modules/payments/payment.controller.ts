import { Request, Response } from "express";
import config from "../../../config";
import { stripe } from "../../helper/stripe";
import catchAsync from "../../shared/catchAsync";
import { PaymentService } from "./payment.service";

const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    console.log("debugggggggggggggggg");

    const sig = req.headers["stripe-signature"] as string;

    console.log(
      "sig=============================================================:",
      sig
    );

    const webhookSecret = config.stripe_webhook_secret!;

    console.log("webhookSecret", webhookSecret);

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await PaymentService.handleStripeWebhook(event);

    res.status(200).json({ received: true });
  }
);

export const PaymentController = {
  handleStripeWebhookEvent,
};
