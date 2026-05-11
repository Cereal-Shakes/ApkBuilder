import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  boolean,
  bigint,

} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  image: text("image"),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── Menu Items ───
export const menuItems = mysqlTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  popular: boolean("popular").default(false),
  featured: boolean("featured").default(false),
  calories: int("calories"),
  tags: text("tags"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;

// ─── Add-ons / Customizations ───
export const addOns = mysqlTable("add_ons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  menuItemId: bigint("menu_item_id", { mode: "number", unsigned: true }),
  category: varchar("category", { length: 50 }),
  active: boolean("active").default(true),
});

export type AddOn = typeof addOns.$inferSelect;

// ─── Orders ───
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  guestEmail: varchar("guest_email", { length: 320 }),
  guestPhone: varchar("guest_phone", { length: 50 }),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refunded",
  ]).default("pending").notNull(),
  paymentStatus: mysqlEnum("payment_status", [
    "pending",
    "paid",
    "failed",
    "refunded",
  ]).default("pending").notNull(),
  paymentMethod: mysqlEnum("payment_method", [
    "card",
    "cash",
    "paypal",
    "apple_pay",
    "google_pay",
  ]),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  loyaltyPointsEarned: int("loyalty_points_earned").default(0),
  loyaltyPointsUsed: int("loyalty_points_used").default(0),
  deliveryAddress: text("delivery_address"),
  deliveryLat: decimal("delivery_lat", { precision: 10, scale: 8 }),
  deliveryLng: decimal("delivery_lng", { precision: 11, scale: 8 }),
  deliveryPlatform: mysqlEnum("delivery_platform", [
    "internal",
    "uber_eats",
    "doorDash",
    "grubhub",
    "postmates",
  ]).default("internal"),
  deliveryPlatformOrderId: varchar("delivery_platform_order_id", { length: 255 }),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Order = typeof orders.$inferSelect;

// ─── Order Items ───
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  menuItemId: bigint("menu_item_id", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  addOns: text("add_ons"),
  specialInstructions: text("special_instructions"),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Loyalty Points ───
export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }),
  points: int("points").notNull(),
  type: mysqlEnum("type", ["earned", "redeemed", "bonus", "expired"]).notNull(),
  description: varchar("description", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;

// ─── Rewards / Redeemable Items ───
export const rewards = mysqlTable("rewards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  pointsCost: int("points_cost").notNull(),
  image: text("image"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountType: mysqlEnum("discount_type", ["fixed", "percentage", "free_item"]).default("fixed"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;

// ─── Notifications ───
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", [
    "order_update",
    "promotion",
    "loyalty",
    "delivery",
    "system",
    "support",
  ]).notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Support Tickets ───
export const supportTickets = mysqlTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  guestEmail: varchar("guest_email", { length: 320 }),
  guestName: varchar("guest_name", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  category: mysqlEnum("category", [
    "order_issue",
    "delivery",
    "payment",
    "account",
    "feedback",
    "other",
  ]).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"])
    .default("open")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
    .default("medium")
    .notNull(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }),
  assignedTo: bigint("assigned_to", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SupportTicket = typeof supportTickets.$inferSelect;

// ─── Delivery Tracking ───
export const deliveryTracking = mysqlTable("delivery_tracking", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", [
    "confirmed",
    "preparing",
    "ready",
    "picked_up",
    "in_transit",
    "nearby",
    "delivered",
  ]).notNull(),
  driverName: varchar("driver_name", { length: 255 }),
  driverPhone: varchar("driver_phone", { length: 50 }),
  driverVehicle: varchar("driver_vehicle", { length: 100 }),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lng: decimal("lng", { precision: 11, scale: 8 }),
  estimatedArrival: timestamp("estimated_arrival"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;

// ─── Cart (session storage for logged-in users) ───
export const carts = mysqlTable("carts", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  menuItemId: bigint("menu_item_id", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  addOns: text("add_ons"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Cart = typeof carts.$inferSelect;

// ─── Email Logs ───
export const emailLogs = mysqlTable("email_logs", {
  id: serial("id").primaryKey(),
  to: varchar("to", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  template: varchar("template", { length: 100 }),
  orderId: bigint("order_id", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
