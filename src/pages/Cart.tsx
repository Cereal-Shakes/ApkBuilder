import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Trash2, Plus, Minus, Tag, Gift,
  ArrowRight, ChevronLeft, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cartStore";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

const PROMO_CODES: Record<string, number> = {
  SHAKE10: 0.10,
  FIRST20: 0.20,
  CEREAL5: 0.05,
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(0);

  // Get loyalty balance
  const { data: loyaltyData } = trpc.rewards.balance.useQuery(undefined, {
    onError: () => {}, // guest users won't have this
  });

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const deliveryFee = subtotal >= 25 ? 0 : 4.99;
  const promoDiscount = appliedPromo ? subtotal * (PROMO_CODES[appliedPromo] ?? 0) : 0;
  const loyaltyDiscount = loyaltyRedeem * 0.01; // 1 point = $0.01
  const tax = (subtotal - promoDiscount - loyaltyDiscount) * 0.08875;
  const total = Math.max(0, subtotal - promoDiscount - loyaltyDiscount + tax + deliveryFee);
  const pointsToEarn = Math.floor(total * 10); // 10 pts per $1

  const applyPromo = () => {
    setPromoError("");
    if (PROMO_CODES[promoCode.toUpperCase()]) {
      setAppliedPromo(promoCode.toUpperCase());
      toast.success(`Promo code applied! ${(PROMO_CODES[promoCode.toUpperCase()] * 100).toFixed(0)}% off`);
      setPromoCode("");
    } else {
      setPromoError("Invalid promo code");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
          <div className="w-28 h-28 mx-auto rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center mb-6">
            <ShoppingBag className="w-14 h-14 text-amber-300" />
          </div>
          <h2 className="text-3xl font-black text-amber-900">Your cart is empty</h2>
          <p className="text-amber-600 mt-2 max-w-sm mx-auto">No shakes yet! Head to the menu and pick your favorites.</p>
          <Button
            onClick={() => navigate("/menu")}
            className="mt-8 h-12 px-8 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold"
          >
            Browse Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/30 to-white pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/menu")} className="flex items-center gap-2 text-amber-600 hover:text-amber-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Continue Shopping
          </button>
          <div className="flex-1" />
          <button onClick={() => { clearCart(); toast.success("Cart cleared"); }} className="text-sm text-amber-400 hover:text-red-500 transition-colors">
            Clear cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-3xl font-black text-amber-900 mb-6">
              Your Cart <span className="text-amber-400">({items.length} {items.length === 1 ? "item" : "items"})</span>
            </h1>

            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-4 p-4 bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-amber-50">
                    <img src={item.image || "/hero-shake.jpg"} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-amber-900 truncate">{item.name}</h3>
                    <div className="text-amber-600 text-sm mt-1">${parseFloat(item.price).toFixed(2)} each</div>

                    <div className="flex items-center gap-3 mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-1">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) removeItem(item.id);
                            else updateQuantity(item.id, item.quantity - 1);
                          }}
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-amber-900 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button onClick={() => removeItem(item.id)} className="ml-auto text-amber-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black text-amber-700">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Promo Code */}
            <div className="p-4 bg-white rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-amber-900 text-sm">Promo Code</span>
                {appliedPromo && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    {appliedPromo} applied ✓
                  </span>
                )}
              </div>
              {!appliedPromo && (
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder="Enter code (try SHAKE10)"
                    className="flex-1 h-10 bg-amber-50 border-amber-200 rounded-xl text-sm"
                  />
                  <Button onClick={applyPromo} className="h-10 bg-amber-500 hover:bg-amber-600 rounded-xl px-5">
                    Apply
                  </Button>
                </div>
              )}
              {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
              {appliedPromo && (
                <button onClick={() => setAppliedPromo(null)} className="text-xs text-amber-400 hover:text-amber-600 mt-1">
                  Remove code
                </button>
              )}
            </div>

            {/* Loyalty Points Redemption */}
            {loyaltyData && loyaltyData.balance > 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-amber-900 text-sm">Redeem Points</span>
                  <span className="ml-auto text-xs text-amber-600">{loyaltyData.balance} pts available</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.min(loyaltyData.balance, Math.floor(subtotal * 100))}
                  step={10}
                  value={loyaltyRedeem}
                  onChange={(e) => setLoyaltyRedeem(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-amber-600 mt-1">
                  <span>0 pts</span>
                  <span className="font-bold text-amber-800">{loyaltyRedeem} pts = ${(loyaltyRedeem * 0.01).toFixed(2)} off</span>
                  <span>{Math.min(loyaltyData.balance, Math.floor(subtotal * 100))} pts</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
              <h2 className="text-xl font-black text-amber-900 mb-6">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-amber-700">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo ({appliedPromo})</span>
                    <span>-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-500">
                    <span>Points ({loyaltyRedeem} pts)</span>
                    <span>-${loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-700">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE 🎉" : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {subtotal < 25 && subtotal > 0 && (
                  <div className="text-xs text-amber-500 bg-amber-50 rounded-lg p-2">
                    Add ${(25 - subtotal).toFixed(2)} more for free delivery!
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-amber-100 flex justify-between items-center">
                <span className="text-lg font-black text-amber-900">Total</span>
                <span className="text-2xl font-black text-amber-700">${total.toFixed(2)}</span>
              </div>

              {/* Points earn preview */}
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
                <Gift className="w-3.5 h-3.5 text-amber-500" />
                You'll earn <span className="font-bold text-amber-700">{pointsToEarn} points</span> with this order!
              </div>

              <Button
                onClick={() => navigate("/checkout", {
                  state: {
                    subtotal,
                    tax,
                    deliveryFee,
                    total,
                    promoDiscount,
                    appliedPromo,
                    loyaltyRedeem,
                    loyaltyDiscount,
                    pointsToEarn,
                  }
                })}
                className="mt-6 w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-lg"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/menu")}
                className="mt-3 w-full h-10 text-amber-600 hover:text-amber-800 rounded-xl text-sm"
              >
                <Package className="w-4 h-4 mr-2" />
                Add more items
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
