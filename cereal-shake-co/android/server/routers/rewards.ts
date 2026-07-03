import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../db";
import { loyaltyPoints, rewards, orders } from "../../db/schema";
import { eq, desc, sum, and, gt } from "drizzle-orm";

export const rewardsRouter = router({
  // Get current user's points balance + lifetime total
  balance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    const rows = await db
      .select({ points: loyaltyPoints.points, type: loyaltyPoints.type })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.userId, userId));

    const balance = rows.reduce((acc, r) => {
      if (r.type === "earned" || r.type === "bonus") return acc + r.points;
      if (r.type === "redeemed" || r.type === "expired") return acc - r.points;
      return acc;
    }, 0);

    const lifetimeEarned = rows
      .filter((r) => r.type === "earned" || r.type === "bonus")
      .reduce((acc, r) => acc + r.points, 0);

    return { balance: Math.max(0, balance), lifetimeEarned };
  }),

  // Full points history for the user
  history: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.userId, ctx.session.userId))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(50);
  }),

  // List all available redeemable rewards
  list: publicProcedure.query(async () => {
    return db
      .select()
      .from(rewards)
      .where(eq(rewards.active, true))
      .orderBy(rewards.pointsCost);
  }),

  // Redeem a reward
  redeem: protectedProcedure
    .input(z.object({ rewardId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // 1. Get reward details
      const reward = await db.query.rewards.findFirst({
        where: eq(rewards.id, input.rewardId),
      });
      if (!reward || !reward.active) throw new Error("Reward not found or unavailable");

      // 2. Check balance
      const rows = await db
        .select({ points: loyaltyPoints.points, type: loyaltyPoints.type })
        .from(loyaltyPoints)
        .where(eq(loyaltyPoints.userId, userId));

      const balance = rows.reduce((acc, r) => {
        if (r.type === "earned" || r.type === "bonus") return acc + r.points;
        if (r.type === "redeemed" || r.type === "expired") return acc - r.points;
        return acc;
      }, 0);

      if (balance < reward.pointsCost) {
        throw new Error(`Insufficient points. You have ${balance}, need ${reward.pointsCost}.`);
      }

      // 3. Deduct points
      await db.insert(loyaltyPoints).values({
        userId,
        points: reward.pointsCost,
        type: "redeemed",
        description: `Redeemed: ${reward.name}`,
      });

      return { success: true, rewardName: reward.name, discountValue: reward.discountValue };
    }),

  // Admin: grant bonus points to a user
  grantBonus: protectedProcedure
    .input(z.object({
      userId: z.number(),
      points: z.number().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(loyaltyPoints).values({
        userId: input.userId,
        points: input.points,
        type: "bonus",
        description: input.description ?? "Admin bonus",
      });
      return { success: true };
    }),
});
