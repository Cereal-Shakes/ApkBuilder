import { router } from "../trpc";
import { menuRouter } from "./menu";
import { orderRouter } from "./order";
import { paymentRouter } from "./payment";
import { trackingRouter } from "./tracking";
import { supportRouter } from "./support";
import { authRouter } from "./auth";
import { userRouter } from "./user";

export const appRouter = router({
  auth: authRouter,
  menu: menuRouter,
  order: orderRouter,
  payment: paymentRouter,
  tracking: trackingRouter,
  support: supportRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
