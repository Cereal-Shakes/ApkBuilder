import { relations } from "drizzle-orm";
import {
  users,
  orders,
  orderItems,
  menuItems,
  categories,
  addOns,
  loyaltyPoints,
  rewards,
  notifications,
  supportTickets,
  deliveryTracking,
  carts,
  emailLogs,
} from "./schema";

// ─── Users ───
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  loyaltyPoints: many(loyaltyPoints),
  notifications: many(notifications),
  supportTickets: many(supportTickets),
  carts: many(carts),
}));

// ─── Orders ───
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  loyaltyPoints: many(loyaltyPoints),
  deliveryTracking: many(deliveryTracking),
  notifications: many(notifications),
  supportTickets: many(supportTickets),
}));

// ─── Order Items ───
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// ─── Menu Items ───
export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  addOns: many(addOns),
  orderItems: many(orderItems),
  carts: many(carts),
}));

// ─── Categories ───
export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

// ─── Add-Ons ───
export const addOnsRelations = relations(addOns, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [addOns.menuItemId],
    references: [menuItems.id],
  }),
}));

// ─── Loyalty Points ───
export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  user: one(users, {
    fields: [loyaltyPoints.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [loyaltyPoints.orderId],
    references: [orders.id],
  }),
}));

// ─── Notifications ───
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
}));

// ─── Support Tickets ───
export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [supportTickets.orderId],
    references: [orders.id],
  }),
  assignedAdmin: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
    relationName: "assignedTickets",
  }),
}));

// ─── Delivery Tracking ───
export const deliveryTrackingRelations = relations(deliveryTracking, ({ one }) => ({
  order: one(orders, {
    fields: [deliveryTracking.orderId],
    references: [orders.id],
  }),
}));

// ─── Cart ───
export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  menuItem: one(menuItems, {
    fields: [carts.menuItemId],
    references: [menuItems.id],
  }),
}));
