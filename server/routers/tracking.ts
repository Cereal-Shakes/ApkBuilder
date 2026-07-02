import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "../db";
import { deliveryTracking, orders, notifications } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const trackingRouter = router({
  // Get full order + latest tracking status
  getOrder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          items: {
            with: { menuItem: true },
          },
        },
      });

      if (!order) throw new Error("Order not found");

      const tracking = await db
        .select()
        .from(deliveryTracking)
        .where(eq(deliveryTracking.orderId, input.orderId))
        .orderBy(desc(deliveryTracking.createdAt));

      return { order, tracking };
    }),

  // Get latest tracking snapshot (for polling)
  latest: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await db
        .select()
        .from(deliveryTracking)
        .where(eq(deliveryTracking.orderId, input.orderId))
        .orderBy(desc(deliveryTracking.createdAt))
        .limit(1);

      return snapshot[0] ?? null;
    }),

  // Admin: push a tracking update
  pushUpdate: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum([
          "confirmed",
          "preparing",
          "ready",
          "picked_up",
          "in_transit",
          "nearby",
          "delivered",
        ]),
        driverName: z.string().optional(),
        driverPhone: z.string().optional(),
        driverVehicle: z.string().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        estimatedArrival: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Insert new tracking row
      await db.insert(deliveryTracking).values({
        orderId: input.orderId,
        status: input.status,
        driverName: input.driverName,
        driverPhone: input.driverPhone,
        driverVehicle: input.driverVehicle,
        lat: input.lat,
        lng: input.lng,
        estimatedArrival: input.estimatedArrival,
        notes: input.notes,
      });

      // Sync order status
      const orderStatusMap: Record<string, string> = {
        confirmed: "confirmed",
        preparing: "preparing",
        ready: "ready",
        picked_up: "out_for_delivery",
        in_transit: "out_for_delivery",
        nearby: "out_for_delivery",
        delivered: "delivered",
      };

      await db
        .update(orders)
        .set({ status: orderStatusMap[input.status] as any })
        .where(eq(orders.id, input.orderId));

      // Get order for notification
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
      });

      // Push in-app notification if user exists
      if (order?.userId) {
        const statusMessages: Record<string, string> = {
          confirmed: "Your order has been confirmed! 🎉",
          preparing: "We're blending your shake right now! 🥣",
          ready: "Your order is ready and waiting for pickup! ✅",
          picked_up: "A driver has picked up your order! 🛵",
          in_transit: "Your shake is on its way! 🚀",
          nearby: "Your driver is almost there — be ready! 📍",
          delivered: "Order delivered! Enjoy your shake! 🍨",
        };

        await db.insert(notifications).values({
          userId: order.userId,
          title: "Order Update",
          message: statusMessages[input.status] ?? `Status: ${input.status}`,
          type: "order_update",
          orderId: input.orderId,
        });
      }

      return { success: true };
    }),

  // Driver location update (called by driver app)
  updateDriverLocation: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        lat: z.string(),
        lng: z.string(),
        driverToken: z.string(), // simple auth token for driver
      })
    )
    .mutation(async ({ input }) => {
      // Validate driver token against env
      if (input.driverToken !== process.env.DRIVER_API_TOKEN) {
        throw new Error("Unauthorized");
      }

      await db
        .insert(deliveryTracking)
        .values({
          orderId: input.orderId,
          status: "in_transit",
          lat: input.lat,
          lng: input.lng,
        });

      return { success: true };
    }),
});
