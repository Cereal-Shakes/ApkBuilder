import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "../db";
import { orders, orderItems, loyaltyPoints, notifications } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

// ─── Helper: post Slack notification ───
async function notifySlack(message: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  }).catch(() => {}); // fire and forget
}

export const orderRouter = router({
  // Create a new order
  create: publicProcedure
    .input(
      z.object({
        guestEmail: z.string().email().optional(),
        guestPhone: z.string().optional(),
        items: z.array(
          z.object({
            menuItemId: z.number(),
            quantity: z.number().min(1),
            unitPrice: z.string(),
            totalPrice: z.string(),
            addOns: z.string().optional(),
            specialInstructions: z.string().optional(),
          })
        ),
        subtotal: z.string(),
        tax: z.string(),
        deliveryFee: z.string(),
        total: z.string(),
        loyaltyPointsEarned: z.number().optional(),
        deliveryAddress: z.string().optional(),
        deliveryPlatform: z.enum(["internal", "uber_eats", "doorDash", "grubhub", "postmates"]).default("internal"),
        paymentMethod: z.enum(["card", "cash", "paypal", "apple_pay", "google_pay"]),
        stripePaymentIntentId: z.string().optional(),
        specialInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId ?? null;

      // 1. Create order
      const [newOrder] = await db.insert(orders).values({
        userId,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        status: "pending",
        paymentStatus: input.stripePaymentIntentId ? "paid" : "pending",
        paymentMethod: input.paymentMethod,
        stripePaymentIntentId: input.stripePaymentIntentId,
        subtotal: input.subtotal,
        tax: input.tax,
        deliveryFee: input.deliveryFee,
        total: input.total,
        loyaltyPointsEarned: input.loyaltyPointsEarned ?? 0,
        deliveryAddress: input.deliveryAddress,
        deliveryPlatform: input.deliveryPlatform,
        specialInstructions: input.specialInstructions,
      }).$returningId();

      const orderId = newOrder.id;

      // 2. Insert order items
      await db.insert(orderItems).values(
        input.items.map((item) => ({
          orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          addOns: item.addOns,
          specialInstructions: item.specialInstructions,
        }))
      );

      // 3. Track loyalty points
      if (userId && input.loyaltyPointsEarned && input.loyaltyPointsEarned > 0) {
        await db.insert(loyaltyPoints).values({
          userId,
          orderId,
          points: input.loyaltyPointsEarned,
          type: "earned",
          description: `Order #${orderId}`,
        });
      }

      // 4. In-app notification
      if (userId) {
        await db.insert(notifications).values({
          userId,
          title: "Order Confirmed!",
          message: `Your order #${orderId} has been placed and is being processed.`,
          type: "order_update",
          orderId,
        });
      }

      // 5. Slack alert to team
      await notifySlack(
        `🆕 *New Order #${orderId}*\n` +
        `Customer: ${input.guestEmail ?? "Logged-in user"}\n` +
        `Total: $${input.total}\n` +
        `Payment: ${input.paymentMethod} (${input.stripePaymentIntentId ? "✅ paid" : "⏳ pending"})\n` +
        `Delivery: ${input.deliveryPlatform}\n` +
        `Address: ${input.deliveryAddress ?? "N/A"}`
      );

      return { orderId };
    }),

  // Get single order (for customer)
  get: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: { items: { with: { menuItem: true } } },
      });
      if (!order) throw new Error("Order not found");
      return order;
    }),

  // List orders for logged-in user
  myOrders: protectedProcedure
    .query(async ({ ctx }) => {
      return db.query.orders.findMany({
        where: eq(orders.userId, ctx.session.userId),
        orderBy: [desc(orders.createdAt)],
        with: { items: { with: { menuItem: true } } },
      });
    }),

  // Admin: all orders
  allOrders: adminProcedure
    .query(async () => {
      return db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        with: { items: true },
      });
    }),

  // Admin: update order status
  updateStatus: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum([
          "pending", "confirmed", "preparing", "ready",
          "out_for_delivery", "delivered", "cancelled", "refunded",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId));

      await notifySlack(
        `📦 *Order #${input.orderId} updated* → ${input.status.replace(/_/g, " ").toUpperCase()}`
      );

      return { success: true };
    }),
});
