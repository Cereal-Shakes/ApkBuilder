import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "sonner";
import { TRPCProvider } from "@/providers/trpc";

import NavBar   from "@/components/NavBar";
import Home     from "@/pages/Home";
import Menu     from "@/pages/Menu";
import Cart     from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Rewards  from "@/pages/Rewards";
import Orders   from "@/pages/Orders";
import Track    from "@/pages/Track";

export default function App() {
  return (
    <TRPCProvider>
      <BrowserRouter>
        <NavBar />
        <main className="pb-16 md:pb-0">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/menu"        element={<Menu />} />
            <Route path="/menu/:id"    element={<Menu />} />
            <Route path="/cart"        element={<Cart />} />
            <Route path="/checkout"    element={<Checkout />} />
            <Route path="/rewards"     element={<Rewards />} />
            <Route path="/orders"      element={<Orders />} />
            <Route path="/track/:orderId" element={<Track />} />
          </Routes>
        </main>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#92400e",
              fontFamily: "inherit",
              fontWeight: 600,
            },
          }}
        />
      </BrowserRouter>
    </TRPCProvider>
  );
}
