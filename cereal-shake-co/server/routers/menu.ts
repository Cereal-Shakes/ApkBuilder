import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";
import { menuItems, categories, addOns } from "../../db/schema";
import { eq, and, like, or } from "drizzle-orm";

export const menuRouter = router({
  // All active categories
  categories: publicProcedure.query(async () => {
    return db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(categories.sortOrder);
  }),

  // Menu items with filters
  items: publicProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
        popular: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const conditions = [eq(menuItems.active, true)];

      if (input?.categoryId) conditions.push(eq(menuItems.categoryId, input.categoryId));
      if (input?.featured)   conditions.push(eq(menuItems.featured, true));
      if (input?.popular)    conditions.push(eq(menuItems.popular, true));

      let results = await db
        .select()
        .from(menuItems)
        .where(and(...conditions))
        .orderBy(menuItems.name);

      // Client-side search filter (for simplicity — move to DB LIKE for scale)
      if (input?.search) {
        const q = input.search.toLowerCase();
        results = results.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? "").toLowerCase().includes(q) ||
            (i.tags ?? "").toLowerCase().includes(q)
        );
      }

      return results;
    }),

  // Single item + its add-ons
  item: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await db.query.menuItems.findFirst({
        where: eq(menuItems.id, input.id),
      });
      if (!item) throw new Error("Item not found");

      const itemAddOns = await db
        .select()
        .from(addOns)
        .where(and(eq(addOns.active, true), eq(addOns.menuItemId, item.id)));

      // Global add-ons (not tied to specific item)
      const globalAddOns = await db
        .select()
        .from(addOns)
        .where(and(eq(addOns.active, true)));

      return {
        ...item,
        addOns: [...new Map([...itemAddOns, ...globalAddOns].map((a) => [a.id, a])).values()],
      };
    }),
});
