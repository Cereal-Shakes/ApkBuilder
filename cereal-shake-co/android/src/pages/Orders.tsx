import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Package, ChevronRight, Clock, CheckCircle2,
  Truck, XCircle, RefreshCw, Star, ReceiptText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:          { label: "Pending",         color: "text-gray-500",  bg: "bg-gray-100",   icon: Clock },
  confirmed:        { label: "Confirmed",        color: "text-blue-600",  bg: "bg-blue-50",    icon: CheckCircle2 },
  preparing:        { label: "Preparing",        color: "text-amber-700", bg: "bg-amber-100",  icon: RefreshCw },
  ready:            { label: "Ready",            color: "text-green-700", bg: "bg-green-100",  icon: Star },
  out_for_delivery: { label: "On the Way",       color: "text-purple-700",bg: "bg-purple-100", icon: Truck },
  delivered:        { label: "Delivered",        color: "text-green-700", bg: "bg-green-100",  icon: CheckCircle2 },
  cancelled:        { label: "Cancelled",        color: "text-red-600",   bg: "bg-red-50",     icon: XCircle },
  refunded:         { label: "Refunded",         color: "text-orange-600",bg: "bg-orange-50",  icon: ReceiptText },
};

const TABS = ["All", "Active", "Completed", "Cancelled"] as const;
type Tab = typeof TABS[number];

export default function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const { data: orders, isLoading } = trpc.order.myOrders.useQuery();

  const filtered = orders?.filter((o) => {
    if (activeTab === "All") return true;
    if (activeTab === "Active") return ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status);
    if (activeTab === "Completed") return o.status === "delivered";
    if (activeTab === "Cancelled") return ["cancelled", "refunded"].includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-black text-amber-900 mb-6">My Orders</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50"
              }`}
            >
              {tab}
              {tab === "Active" && orders && (
                <span className="ml-1.5 text-xs">
                  ({orders.filter(o => ["pending","confirmed","preparing","ready","out_for_delivery"].includes(o.status)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-amber-100/50 animate-pulse" />
            ))}
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-amber-200 mb-4" />
            <h3 className="text-xl font-bold text-amber-800">No {activeTab !== "All" ? activeTab.toLowerCase() : ""} orders yet</h3>
            <p className="text-amber-500 mt-2">
              {activeTab === "All" ? "Place your first order to see it here!" : `No ${activeTab.toLowerCase()} orders to show.`}
            </p>
            <Button onClick={() => navigate("/menu")} className="mt-6 bg-amber-500 hover:bg-amber-600 rounded-xl">
              Browse Menu
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const isActive = ["pending","confirmed","preparing","ready","out_for_delivery"].includes(order.status);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => isActive ? navigate(`/track/${order.id}`) : undefined}
                  className={`bg-white rounded-2xl border border-amber-100 p-5 shadow-sm hover:shadow-md transition-all ${isActive ? "cursor-pointer hover:border-amber-300" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-amber-400">#{order.id}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            Live
                          </span>
                        )}
                      </div>

                      {/* Items preview */}
                      <div className="text-sm text-amber-700 truncate">
                        {(order as any).items?.slice(0, 2).map((item: any) => item.menuItem?.name || `Item #${item.menuItemId}`).join(", ")}
                        {(order as any).items?.length > 2 && ` +${(order as any).items.length - 2} more`}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-amber-400">
                        <span>{new Date((order as any).createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {order.deliveryAddress && <span>· {order.deliveryAddress.split(",")[0]}</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-amber-700">${parseFloat(order.total).toFixed(2)}</div>
                      {order.loyaltyPointsEarned ? (
                        <div className="text-xs text-amber-400 mt-1">+{order.loyaltyPointsEarned} pts</div>
                      ) : null}
                      {isActive && <ChevronRight className="w-4 h-4 text-amber-400 ml-auto mt-2" />}
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-3 border-t border-amber-50 flex items-center justify-between">
                      <span className="text-xs text-amber-500">Tap to track your order</span>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/track/${order.id}`); }}
                        className="h-7 px-3 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs"
                      >
                        <Truck className="w-3 h-3 mr-1" /> Track
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
