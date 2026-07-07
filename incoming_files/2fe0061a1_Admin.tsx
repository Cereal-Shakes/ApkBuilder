import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  ShoppingBag,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";

type Tab = "overview" | "orders" | "tickets" | "analytics";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: allOrders } = trpc.order.allOrders.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: allTickets } = trpc.support.allTickets.useQuery(undefined, {
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-900">Access Denied</h2>
          <p className="text-amber-600 mt-2">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate("/")} className="mt-4 bg-amber-500">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const totalRevenue = allOrders?.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0) || 0;
  const totalOrders = allOrders?.length || 0;
  const pendingOrders = allOrders?.filter((o) => o.status === "pending").length || 0;
  const openTickets = allTickets?.filter((t) => t.status === "open" || t.status === "in_progress").length || 0;

  const statusCounts = {
    pending: allOrders?.filter((o) => o.status === "pending").length || 0,
    confirmed: allOrders?.filter((o) => o.status === "confirmed").length || 0,
    preparing: allOrders?.filter((o) => o.status === "preparing").length || 0,
    ready: allOrders?.filter((o) => o.status === "ready").length || 0,
    out_for_delivery: allOrders?.filter((o) => o.status === "out_for_delivery").length || 0,
    delivered: allOrders?.filter((o) => o.status === "delivered").length || 0,
  };

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { id: "orders" as Tab, label: "Orders", icon: Package },
    { id: "tickets" as Tab, label: "Support Tickets", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-amber-900">Admin Dashboard</h1>
            <p className="text-amber-600 mt-1">Manage orders, tickets, and analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-amber-200 text-amber-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, change: "+12%", up: true },
            { label: "Total Orders", value: totalOrders.toString(), icon: ShoppingBag, change: "+8%", up: true },
            { label: "Pending Orders", value: pendingOrders.toString(), icon: Clock, change: "-3%", up: false },
            { label: "Open Tickets", value: openTickets.toString(), icon: MessageSquare, change: "+2", up: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-amber-100 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.up ? "text-green-600" : "text-red-500"}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-black text-amber-900 mt-4">{stat.value}</p>
              <p className="text-sm text-amber-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "bg-white text-amber-700 border border-amber-200 hover:border-amber-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Order Status Distribution */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <h3 className="font-bold text-amber-900 mb-4">Order Status Distribution</h3>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-amber-700 capitalize">{status.replace(/_/g, " ")}</span>
                      <span className="font-medium text-amber-900">{count}</span>
                    </div>
                    <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <h3 className="font-bold text-amber-900 mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {allOrders?.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/track/${order.id}`)}
                    className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl cursor-pointer hover:bg-amber-100/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-amber-900 text-sm">Order #{order.id}</p>
                      <p className="text-xs text-amber-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-amber-700">
                        ${parseFloat(order.total.toString()).toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                ))}
                {(!allOrders || allOrders.length === 0) && (
                  <p className="text-center text-amber-500 py-8">No orders yet</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-amber-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-100">
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Order #</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Customer</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Total</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Platform</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders?.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/track/${order.id}`)}
                      className="border-b border-amber-50 hover:bg-amber-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 text-sm text-amber-900 font-medium">#{order.id}</td>
                      <td className="p-4 text-sm text-amber-700">
                        {order.guestEmail || `User #${order.userId}`}
                      </td>
                      <td className="p-4 text-sm font-bold text-amber-900">
                        ${parseFloat(order.total.toString()).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-amber-600 capitalize">
                        {order.deliveryPlatform?.replace("_", " ")}
                      </td>
                      <td className="p-4 text-sm text-amber-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!allOrders || allOrders.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-amber-500">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "tickets" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-amber-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-100">
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Ticket #</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Subject</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Category</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Priority</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-amber-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allTickets?.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-amber-50 hover:bg-amber-50/50 transition-colors"
                    >
                      <td className="p-4 text-sm text-amber-900 font-medium">#{ticket.id}</td>
                      <td className="p-4 text-sm text-amber-700">{ticket.subject}</td>
                      <td className="p-4 text-sm text-amber-600 capitalize">
                        {ticket.category.replace("_", " ")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            ticket.priority === "urgent"
                              ? "bg-red-100 text-red-800"
                              : ticket.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : ticket.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            ticket.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : ticket.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-amber-600">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!allTickets || allTickets.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-amber-500">
                        No support tickets yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
