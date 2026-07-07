import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import {
  CreditCard, MapPin, User, Mail, Phone,
  ShoppingBag, Lock, ChevronLeft, CheckCircle2, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      fontFamily: "inherit",
      color: "#92400e",
      "::placeholder": { color: "#fbbf24" },
      iconColor: "#f59e0b",
    },
    invalid: { color: "#ef4444", iconColor: "#ef4444" },
  },
};

function CheckoutForm({
  subtotal, tax, deliveryFee, total, promoDiscount, appliedPromo, loyaltyRedeem, loyaltyDiscount, pointsToEarn,
}: any) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();

  const [step, setStep] = useState<"info" | "payment" | "done">("info");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "",
    instructions: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createIntent = trpc.payment.createIntent.useMutation();
  const createOrder  = trpc.order.create.useMutation();

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const validateInfo = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.address.trim()) e.address = "Delivery address is required";
    if (!form.city.trim())    e.city    = "City is required";
    if (!form.zip.trim())     e.zip     = "ZIP code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInfoNext = () => {
    if (validateInfo()) setStep("payment");
  };

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    setLoading(true);
    try {
      // 1. Create payment intent
      const { clientSecret } = await createIntent.mutateAsync({
        amount: Math.round(total * 100),
        currency: "usd",
        email: form.email,
      });

      if (!clientSecret) throw new Error("Failed to initialize payment");

      // 2. Confirm card payment with Stripe
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: { name: form.name, email: form.email, phone: form.phone },
        },
      });

      if (stripeErr) throw new Error(stripeErr.message);
      if (!paymentIntent || paymentIntent.status !== "succeeded") throw new Error("Payment did not succeed");

      // 3. Create order in DB
      const { orderId } = await createOrder.mutateAsync({
        guestEmail: form.email,
        guestPhone: form.phone || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.price,
          totalPrice: (parseFloat(i.price) * i.quantity).toFixed(2),
        })),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        loyaltyPointsEarned: pointsToEarn,
        loyaltyPointsUsed: loyaltyRedeem,
        deliveryAddress: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
        paymentMethod: "card",
        stripePaymentIntentId: paymentIntent.id,
        specialInstructions: form.instructions || undefined,
      });

      clearCart();
      setStep("done");
      setTimeout(() => navigate(`/track/${orderId}`), 3000);
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
        <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-amber-900">Order Placed! 🎉</h2>
        <p className="text-amber-600 mt-2">Redirecting to your tracking page...</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-500">
          <Gift className="w-4 h-4" />
          You earned <span className="font-bold text-amber-700">{pointsToEarn} points</span>!
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* ── Left: Form ── */}
      <div className="lg:col-span-3 space-y-6">
        {/* Step tabs */}
        <div className="flex gap-2">
          {[{ key: "info", label: "1. Your Info" }, { key: "payment", label: "2. Payment" }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => key === "info" && setStep("info")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                step === key ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {step === "info" && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-amber-900">Contact Details</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-700 text-sm font-semibold">Full Name *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="John Doe" className={`mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl ${errors.name ? "border-red-400" : ""}`} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label className="text-amber-700 text-sm font-semibold">Phone</Label>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="(555) 000-0000" className="mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-amber-700 text-sm font-semibold">Email *</Label>
                  <Input value={form.email} onChange={(e) => set("email", e.target.value)}
                    type="email" placeholder="john@example.com" className={`mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl ${errors.email ? "border-red-400" : ""}`} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-amber-900">Delivery Address</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-amber-700 text-sm font-semibold">Street Address *</Label>
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)}
                    placeholder="123 Shake Ave" className={`mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl ${errors.address ? "border-red-400" : ""}`} />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label className="text-amber-700 text-sm font-semibold">City *</Label>
                    <Input value={form.city} onChange={(e) => set("city", e.target.value)}
                      placeholder="New York" className={`mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl ${errors.city ? "border-red-400" : ""}`} />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label className="text-amber-700 text-sm font-semibold">State</Label>
                    <Input value={form.state} onChange={(e) => set("state", e.target.value)}
                      placeholder="NY" maxLength={2} className="mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl uppercase" />
                  </div>
                  <div>
                    <Label className="text-amber-700 text-sm font-semibold">ZIP *</Label>
                    <Input value={form.zip} onChange={(e) => set("zip", e.target.value)}
                      placeholder="10001" className={`mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl ${errors.zip ? "border-red-400" : ""}`} />
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-amber-700 text-sm font-semibold">Delivery Instructions</Label>
                  <Input value={form.instructions} onChange={(e) => set("instructions", e.target.value)}
                    placeholder="Buzz #4B, leave at door, etc." className="mt-1 h-11 bg-amber-50 border-amber-200 rounded-xl" />
                </div>
              </div>
            </div>

            <Button onClick={handleInfoNext} className="w-full h-12 bg-amber-500 hover:bg-amber-600 font-black rounded-xl text-lg">
              Continue to Payment →
            </Button>
          </motion.div>
        )}

        {step === "payment" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-amber-900">Card Details</h3>
                <Lock className="w-4 h-4 text-amber-300 ml-auto" />
                <span className="text-xs text-amber-400">Secured by Stripe</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
              <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Your payment is encrypted and secure. We never store your card details.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("info")} className="h-12 px-6 border-amber-200 text-amber-700 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handlePay}
                disabled={loading || !stripe}
                className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 font-black rounded-xl text-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Pay ${total.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Right: Order Summary ── */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 bg-white rounded-2xl border border-amber-100 p-6">
          <h3 className="font-black text-amber-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            Order Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-amber-700"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {promoDiscount > 0 && <div className="flex justify-between text-green-600"><span>Promo ({appliedPromo})</span><span>-${promoDiscount.toFixed(2)}</span></div>}
            {loyaltyDiscount > 0 && <div className="flex justify-between text-amber-500"><span>Points ({loyaltyRedeem} pts)</span><span>-${loyaltyDiscount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-amber-700"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-amber-700">
              <span>Delivery</span>
              <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>{deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-100 flex justify-between items-center">
            <span className="font-black text-amber-900">Total</span>
            <span className="text-2xl font-black text-amber-700">${total.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
            <Gift className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            Earn <span className="font-bold text-amber-700 mx-1">{pointsToEarn} points</span> with this order
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCartStore();

  const state = location.state ?? {};
  const subtotal       = state.subtotal       ?? items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const tax            = state.tax            ?? subtotal * 0.08875;
  const deliveryFee    = state.deliveryFee    ?? (subtotal >= 25 ? 0 : 4.99);
  const total          = state.total          ?? subtotal + tax + deliveryFee;
  const promoDiscount  = state.promoDiscount  ?? 0;
  const appliedPromo   = state.appliedPromo   ?? null;
  const loyaltyRedeem  = state.loyaltyRedeem  ?? 0;
  const loyaltyDiscount = state.loyaltyDiscount ?? 0;
  const pointsToEarn   = state.pointsToEarn   ?? Math.floor(total * 10);

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-amber-200 mb-4" />
          <h2 className="text-2xl font-black text-amber-900">Your cart is empty</h2>
          <Button onClick={() => navigate("/menu")} className="mt-4 bg-amber-500 hover:bg-amber-600 rounded-xl">
            Go to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/30 to-white pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/cart")} className="flex items-center gap-2 text-amber-600 hover:text-amber-800">
            <ChevronLeft className="w-5 h-5" /> Back to Cart
          </button>
        </div>
        <h1 className="text-3xl font-black text-amber-900 mb-8">Checkout</h1>
        <Elements stripe={stripePromise}>
          <CheckoutForm
            subtotal={subtotal} tax={tax} deliveryFee={deliveryFee} total={total}
            promoDiscount={promoDiscount} appliedPromo={appliedPromo}
            loyaltyRedeem={loyaltyRedeem} loyaltyDiscount={loyaltyDiscount}
            pointsToEarn={pointsToEarn}
          />
        </Elements>
      </div>
    </div>
  );
}
