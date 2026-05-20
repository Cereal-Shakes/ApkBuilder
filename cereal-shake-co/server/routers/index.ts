import { router } from "../trpc";
import { menuRouter }     from "./menu";
import { orderRouter }    from "./order";
import { paymentRouter }  from "./payment";
import { trackingRouter } from "./tracking";
import { rewardsRouter }  from "./rewards";

export const appRouter = router({
  menu:     menuRouter,
  order:    orderRouter,
  payment:  paymentRouter,
  tracking: trackingRouter,
  rewards:  rewardsRouter,
});

export type AppRouter = typeof appRouter;
