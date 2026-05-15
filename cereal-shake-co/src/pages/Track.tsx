import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Home,
  Star,
  ChevronLeft,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";

// ─── Order status steps ───
const STATUS_STEPS = [
  { key: "confirmed",    label: "Confirmed",   icon: CheckCircle2 },
  { key: "preparing",   label: "Preparing",   icon: Package },
  { key: "ready",       label: "Ready",        icon: Star },
  { key: "in_transit",  label: "On the Way",  icon: Truck },
  { key: "delivered",   label: "Delivered",   icon: Home },
] as const;

const STATUS_MESSAGES: Record<string, string> = {
  confirmed:  "Order confirmed! We'll start blending soon 🎉",
  preparing:  "Blending your shake right now 🥣",
  ready:      "Your shake is ready — driver being assigned 🏃",
  picked_up:  "Driver picked up your order! 🛵",
  in_transit: "On the way to you 🚀",
  nearby:     "Almost there — be ready at the door! 📍",
  delivered:  "Delivered! Enjoy your shake 🍨",
};

// ─── Simple Google Maps embed ───
function DeliveryMap({
  lat,
  lng,
  driverName,
}: {
  lat?: string;
  lng?: string;
  driverName?: string;
}) {
  const hasCoords = lat && lng;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!hasCoords || !apiKey) {
    return (
      <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center border border-amber-200">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
            <Truck className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-amber-800 font-semibold">
          {driverName ? `${driverName} is on the way` : "Driver en route"}
        </p>
        <p className="text-amber-500 text-sm mt-1">Live map available when driver shares location</p>
      </div>
    );
  }

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;

  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden border border-amber-200 relative">
      <iframe
        title="Driver Location"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        src={mapUrl}
        allowFullScreen
        loading="lazy"
      />
      <div className="absolute bottom-3 right-3 bg-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
        <Navigation className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-medium text-amber-800">Live Location</span>
      </div>
    </div>
  );
}

export default function Track() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const id = Number(orderId);

  // Poll every 8 seconds for real-time updates
  const { data, refetch } = trpc.tracking.getOrder.useQuery(
    { orderId: id },
    { enabled: !!id, refetchInterval: 8000 }
  );

  const latestTracking = data?.tracking?.[0];
  const order = data?.order;
  const currentStatus = latestTracking?.status ?? "confirmed";

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const isDelivered = currentStatus === "delivered";

  // ETA countdown
  const [eta, setEta] = useState<string | null>(null);
  useEffect(() => {
    if (!latestTracking?.estimatedArrival) return;
    const update = () => {
      const diff = new Date(latestTracking.estimatedArrival!).getTime() - Date.now();
      if (diff <= 0) { setEta("Arriving now"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setEta(`${mins}m ${secs}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [latestTracking?.estimatedArrival]);

  if (!order) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto animate-pulse">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-amber-700 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-amber-900">Order #{order.id}</h1>
              <p className="text-amber-500 text-sm mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-700">
                ${parseFloat(order.total.toString()).toFixed(2)}
              </p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                order.paymentStatus === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {order.paymentStatus === "paid" ? "✓ Paid" : "Payment Pending"}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4 space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm text-amber-700">
                <span>{item.menuItem?.name ?? "Item"} × {item.quantity}</span>
                <span>${parseFloat(item.totalPrice).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl p-5 text-center font-semibold text-lg ${
              isDelivered
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {STATUS_MESSAGES[currentStatus] ?? "Tracking your order..."}
          </motion.div>
        </AnimatePresence>

        {/* ETA */}
        {eta && !isDelivered && (
          <div className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-amber-500">Estimated Arrival</p>
                <p className="font-bold text-amber-900 text-lg">{eta}</p>
              </div>
            </div>
            <div className="text-2xl animate-pulse">🛵</div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6">
          <h2 className="font-bold text-amber-900 mb-6">Order Progress</h2>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-amber-100" />
            <div
              className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-amber-500 to-orange-400 transition-all duration-1000"
              style={{
                height: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
              }}
            />
            <div className="space-y-6">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                      done
                        ? active
                          ? "bg-amber-500 shadow-lg shadow-amber-200 scale-110"
                          : "bg-green-500"
                        : "bg-amber-100"
                    }`}>
                      <Icon className={`w-5 h-5 ${done ? "text-white" : "text-amber-300"}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${done ? "text-amber-900" : "text-amber-300"}`}>
                        {step.label}
                        {active && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                            Now
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Map */}
        {["in_transit", "nearby", "picked_up"].includes(currentStatus) && (
          <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4">
            <h2 className="font-bold text-amber-900">Driver Location</h2>
            <DeliveryMap
              lat={latestTracking?.lat?.toString()}
              lng={latestTracking?.lng?.toString()}
              driverName={latestTracking?.driverName ?? undefined}
            />
            {latestTracking?.driverName && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-lg">🛵</span>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">{latestTracking.driverName}</p>
                    <p className="text-xs text-amber-500">{latestTracking.driverVehicle ?? "Delivery Driver"}</p>
                  </div>
                </div>
                {latestTracking.driverPhone && (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${latestTracking.driverPhone}`}
                      className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </a>
                    <a
                      href={`sms:${latestTracking.driverPhone}`}
                      className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-amber-500">Delivering to</p>
              <p className="font-semibold text-amber-900">{order.deliveryAddress}</p>
            </div>
          </div>
        )}

        {/* Delivered CTA */}
        {isDelivered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 text-center space-y-4"
          >
            <div className="text-5xl">🍨</div>
            <h2 className="text-xl font-black text-green-800">Enjoy your shake!</h2>
            <p className="text-green-600 text-sm">How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map((star) => (
                <button key={star} className="text-3xl hover:scale-125 transition-transform">⭐</button>
              ))}
            </div>
            <Button
              onClick={() => navigate("/menu")}
              className="w-full bg-amber-500 hover:bg-amber-600 rounded-xl"
            >
              Order Again
            </Button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
