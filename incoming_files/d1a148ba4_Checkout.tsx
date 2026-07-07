import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { CreditCard, MapPin, Truck, ArrowLeft, Check, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

type PaymentMethod = "card" | "paypal" | "apple_pay" | "google_pay" | "cash";
type DeliveryPlatform = "internal" | "uber_eats" | "doorDash";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const createOrder = trpc.order.create.useMutation();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [deliveryPlatform, setDeliveryPlatform] = useState<DeliveryPlatform>("internal");
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    specialInstructions: "",
  });

  const subtotal = getTotal();
  const tax = subtotal * 0.08;
  const deliveryFee = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + tax + deliveryFee;

  const handleSubmit = async () => {
    setIsProcessing(true);

    try {
      createOrder.mutate(
        {
          guestEmail: formData.email || undefined,
          guestPhone: formData.phone || undefined,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: (parseFloat(item.price) * item.quantity).toFixed(2),
            addOns: item.addOns || undefined,
          })),
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          total: total.toFixed(2),
          loyaltyPointsEarned: Math.floor(subtotal),
          deliveryAddress: `${formData.address}, ${formData.city}, ${formData.zip}`,
          deliveryPlatform,
          paymentMethod,
          specialInstructions: formData.specialInstructions || undefined,
        },
        {
          onSuccess: (data) => {
            clearCart();
            toast.success("Order placed successfully!");
            navigate(`/track/${data.orderId}`);
          },
          onError: () => {
            toast.error("Failed to place order. Please try again.");
            setIsProcessing(false);
          },
        }
      );
    } catch {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-900">Your cart is empty</h2>
          <Button onClick={() => navigate("/menu")} className="mt-4 bg-amber-500">
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-black text-amber-900 mb-8">Checkout</h1>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-8">
          {["Delivery", "Payment", "Review"].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > i + 1
                    ? "bg-green-500 text-white"
                    : step === i + 1
                    ? "bg-amber-500 text-white"
                    : "bg-amber-100 text-amber-400"
                }`}
              >
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  step === i + 1 ? "text-amber-900" : "text-amber-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Step 1: Delivery Info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Delivery Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-amber-800 mb-1 block">Full Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-800 mb-1 block">Email</label>
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="john@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-800 mb-1 block">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-800 mb-1 block">Address</label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-800 mb-1 block">City</label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-800 mb-1 block">ZIP Code</label>
                  <input
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-amber-800 mb-1 block">
                  Special Instructions (optional)
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none"
                  placeholder="Any special requests..."
                />
              </div>

              {/* Delivery Platform Selection */}
              <div>
                <label className="text-sm font-medium text-amber-800 mb-3 block">
                  Delivery Platform
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "internal" as DeliveryPlatform, label: "In-House", icon: Truck },
                    { id: "uber_eats" as DeliveryPlatform, label: "Uber Eats", icon: Smartphone },
                    { id: "doorDash" as DeliveryPlatform, label: "DoorDash", icon: Smartphone },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setDeliveryPlatform(platform.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        deliveryPlatform === platform.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-amber-100 hover:border-amber-300"
                      }`}
                    >
                      <platform.icon className="w-6 h-6 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 font-bold rounded-xl"
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Payment Method
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "card" as PaymentMethod, label: "Credit Card", icon: CreditCard },
                  { id: "paypal" as PaymentMethod, label: "PayPal", icon: Smartphone },
                  { id: "apple_pay" as PaymentMethod, label: "Apple Pay", icon: Smartphone },
                  { id: "google_pay" as PaymentMethod, label: "Google Pay", icon: Smartphone },
                  { id: "cash" as PaymentMethod, label: "Cash", icon: Lock },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? "border-amber-500 bg-amber-50"
                        : "border-amber-100 hover:border-amber-300"
                    }`}
                  >
                    <method.icon className="w-6 h-6 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">{method.label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === "card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-amber-800 mb-1 block">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                      <input
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-amber-800 mb-1 block">Expiry</label>
                      <input
                        value={formData.expiry}
                        onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-amber-800 mb-1 block">CVV</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                        <input
                          value={formData.cvv}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-amber-200 text-amber-700"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 font-bold rounded-xl"
                >
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6">
              <h2 className="text-xl font-bold text-amber-900">Order Review</h2>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h3 className="font-semibold text-amber-900 mb-2">Delivery</h3>
                  <p className="text-sm text-amber-700">
                    {formData.name || "Guest"}<br />
                    {formData.address || "Address not provided"}<br />
                    {formData.city && `${formData.city}, ${formData.zip}`}
                  </p>
                  <p className="text-sm text-amber-600 mt-1 capitalize">
                    Platform: {deliveryPlatform.replace("_", " ")}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl">
                  <h3 className="font-semibold text-amber-900 mb-2">Payment</h3>
                  <p className="text-sm text-amber-700 capitalize">
                    {paymentMethod.replace("_", " ")}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl">
                  <h3 className="font-semibold text-amber-900 mb-2">Items</h3>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-amber-700">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-amber-900 font-medium">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-amber-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">Subtotal</span>
                    <span className="text-amber-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">Tax</span>
                    <span className="text-amber-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-green-600" : "text-amber-900"}>
                      {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-amber-100 pt-2">
                    <span className="text-amber-900">Total</span>
                    <span className="text-amber-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 border-amber-200 text-amber-700"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Place Order - ${total.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
