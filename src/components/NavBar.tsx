import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Menu, X, Gift, Package,
  Home, UtensilsCrossed, Bell, User
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { trpc } from "@/providers/trpc";

const NAV_LINKS = [
  { label: "Home",    path: "/",         icon: Home },
  { label: "Menu",    path: "/menu",      icon: UtensilsCrossed },
  { label: "Rewards", path: "/rewards",   icon: Gift },
  { label: "Orders",  path: "/orders",    icon: Package },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const { data: notifData } = trpc.notifications?.unreadCount?.useQuery?.() ?? { data: undefined };
  const unread = notifData?.count ?? 0;

  const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm group-hover:bg-amber-400 transition-colors">
              <span className="text-lg">🥤</span>
            </div>
            <span className="font-black text-xl text-amber-900 hidden sm:block">Cereal <span className="text-amber-500">Shakes</span></span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive(path)
                    ? "bg-amber-100 text-amber-800"
                    : "text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:block">Cart</span>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 bg-white text-amber-600 text-xs rounded-full flex items-center justify-center font-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-50"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl"
            >
              <div className="p-6 pt-20 space-y-2">
                {NAV_LINKS.map(({ label, path, icon: Icon }) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                      isActive(path)
                        ? "bg-amber-100 text-amber-800"
                        : "text-amber-600 hover:bg-amber-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
                <div className="pt-4 border-t border-amber-100">
                  <button
                    onClick={() => { navigate("/cart"); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500 text-white rounded-xl font-bold"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-amber-100 safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {[...NAV_LINKS, { label: "Cart", path: "/cart", icon: ShoppingBag }].map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isActive(path) ? "text-amber-600" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {path === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
