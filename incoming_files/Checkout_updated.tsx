import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  CreditCard,
  MapPin,
  Truck,
  ArrowLeft,
  Check,
  Lock,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ─── Stripe setup ───
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

type PaymentMethod = "card" | "paypal" | "apple_pay" | "google_pay" | "cash";
type DeliveryPlatform = "internal" | "uber_eats" | "doorDash";

// ─── Validation ───
function validateStep1(formData: Record<string, string>): string | null {
  if (!formData.name.trim()) return "Full name is required.";
  if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    return "A valid email is required.";
  if (!formData.phone.trim()) return "Phone number is required.";
  if (!formData.address.trim()) return "Delivery address is required.";
  if (!formData.city.trim()) return "City is required.";
  if (!formData.zip.trim() || !/^\d{5}(-\d{4})?$/.test(formData.zip))
    return "A valid ZIP code is required.";
  return null;
}

// ─── Inner checkout form (needs Stripe context) ───
function CheckoutForm() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const createOrder = trpc.order.create.useMutation();
  const createPaymentIntent = trpc.payment.createIntent.useMutation();

  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [deliveryPlatform, setDeliveryPlatform] =
    useState<DeliveryPlatform>("internal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    specialInstructions: "",
  });

  const subtotal = getTotal();
  const tax = subtotal * 0.08;
  const deliveryFee = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + tax + deliveryFee;

  const field = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: "" }));
    },
  });

  const handleStep1Continue = () => {
    const error = validateStep1(formData);
    if (error) {
      toast.error(error);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    try {
      // 1. If paying by card, confirm with Stripe
      if (paymentMethod === "card") {
        // Create a PaymentIntent on your backend
        const { clientSecret } = await createPaymentIntent.mutateAsync({
          amount: Math.round(total * 100), // cents
          currency: "usd",
          email: formData.email,
        });

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: {
                  city: formData.city,
                  postal_code: formData.zip,
                  line1: formData.address,
                },
              },
            },
          });

        if (stripeError) {
          toast.error(stripeError.message || "Payment failed. Please try again.");
          setIsProcessing(false);
          return;
        }

        if (paymentIntent?.status !== "succeeded") {
          toast.error("Payment was not completed. Please try again.");
          setIsProcessing(false);
          return;
        }

        // 2. Create order with Stripe payment intent ID
        await createOrder.mutateAsync({
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
          stripePaymentIntentId: paymentIntent.id,
          specialInstructions: formData.specialInstructions || undefined,
        });
      } else {
        // Non-card payment (cash, PayPal, etc.)
        await createOrder.mutateAsync({
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
        });
      }

      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/track/latest`);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
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

        {/* Progress Steps */}
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

        <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Step 1: Delivery ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Delivery Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Full Name", placeholder: "John Doe", type: "text" },
                  { key: "email", label: "Email", placeholder: "john@example.com", type: "email" },
                  { key: "phone", label: "Phone", placeholder: "+1 234 567 890", type: "tel" },
                  { key: "address", label: "Address", placeholder: "123 Main St", type: "text" },
                  { key: "city", label: "City", placeholder: "New York", type: "text" },
                  { key: "zip", label: "ZIP Code", placeholder: "10001", type: "text" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-amber-800 mb-1 block">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      {...field(key as keyof typeof formData)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors[key] ? "border-red-400" : "border-amber-200"
                      }`}
                    />
                    {errors[key] && (
                      <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-amber-800 mb-1 block">
                  Special Instructions (optional)
                </label>
                <textarea
                  {...field("specialInstructions")}
                  className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none"
                  placeholder="Any special requests..."
                />
              </div>

              {/* Delivery Platform */}
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
                      <span className="text-xs font-medium text-amber-800">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStep1Continue}
                className="w-full bg-amber-500 hover:bg-amber-600 rounded-xl h-12 text-base font-bold"
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Payment Method
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "card" as PaymentMethod, label: "Credit Card", icon: CreditCard },
                  { id: "apple_pay" as PaymentMethod, label: "Apple Pay", icon: Smartphone },
                  { id: "google_pay" as PaymentMethod, label: "Google Pay", icon: Smartphone },
                  { id: "paypal" as PaymentMethod, label: "PayPal", icon: Lock },
                  { id: "cash" as PaymentMethod, label: "Cash on Delivery", icon: Truck },
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
                    <span className="text-xs font-medium text-amber-800 text-center">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Stripe Card Element */}
              {paymentMethod === "card" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-amber-800 block">Card Details</label>
                  <div className="px-4 py-3 border border-amber-200 rounded-xl focus-within:ring-2 focus-within:ring-amber-500">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#78350f",
                            "::placeholder": { color: "#d97706" },
                          },
                          invalid: { color: "#ef4444" },
                        },
                        hidePostalCode: true,
                      }}
                    />
                  </div>
                  <p className="text-xs text-amber-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Secured by Stripe — your card details are never stored on our servers.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-amber-200 text-amber-700 rounded-xl h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-xl h-12 font-bold"
                >
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-3">
                <h2 className="text-xl font-bold text-amber-900">Order Summary</h2>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-amber-800">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-amber-100 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-black text-amber-900 text-lg pt-1">
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-2 text-sm text-amber-700">
                <p><span className="font-semibold">Delivering to:</span> {formData.address}, {formData.city}, {formData.zip}</p>
                <p><span className="font-semibold">Contact:</span> {formData.name} · {formData.email}</p>
                <p><span className="font-semibold">Payment:</span> {paymentMethod.replace(/_/g, " ")} via {deliveryPlatform.replace(/_/g, " ")}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 border-amber-200 text-amber-700 rounded-xl h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || !stripe}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-xl h-12 font-bold"
                >
                  {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
                </Button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}

// ─── Wrapper with Stripe Elements provider ───
export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
