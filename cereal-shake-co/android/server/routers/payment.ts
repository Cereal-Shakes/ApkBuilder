import Stripe from "stripe";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { orders } from "../../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export const paymentRouter = router({
  // Create a PaymentIntent — called before confirming card payment
  createIntent: publicProcedure
    .input(
      z.object({
        amount: z.number().min(50), // cents
        currency: z.string().default("usd"),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const intent = await stripe.paymentIntents.create({
        amount: input.amount,
        currency: input.currency,
        receipt_email: input.email,
        automatic_payment_methods: { enabled: true },
        metadata: {
          app: "cerealicious",
        },
      });

      return { clientSecret: intent.client_secret };
    }),

  // Webhook handler — Stripe calls this to confirm payment events
  webhook: publicProcedure
    .input(z.object({ rawBody: z.string(), signature: z.string() }))
    .mutation(async ({ input }) => {
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          input.rawBody,
          input.signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err) {
        throw new Error(`Webhook signature verification failed: ${err}`);
      }

      if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object as Stripe.PaymentIntent;

        // Update order payment status to "paid"
        await db
          .update(orders)
          .set({ paymentStatus: "paid" })
          .where(eq(orders.stripePaymentIntentId, intent.id));
      }

      if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object as Stripe.PaymentIntent;

        await db
          .update(orders)
          .set({ paymentStatus: "failed" })
          .where(eq(orders.stripePaymentIntentId, intent.id));
      }

      return { received: true };
    }),

  // Get payment status for an order
  status: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        columns: {
          paymentStatus: true,
          stripePaymentIntentId: true,
          total: true,
        },
      });

      if (!order) throw new Error("Order not found");

      return order;
    }),
});
