import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Truck, Gift, ChevronRight, Flame, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

const FEATURES = [
  { icon: Truck,  label: "Free Delivery",    sub: "On orders over $25" },
  { icon: Clock,  label: "30-Min Delivery",  sub: "Or your next one's free" },
  { icon: Star,   label: "Rewards Points",   sub: "Earn on every order" },
  { icon: Gift,   label: "Loyalty Perks",    sub: "Exclusive member deals" },
];

const STATS = [
  { value: "50+",    label: "Shake flavors" },
  { value: "4.9★",   label: "Avg rating" },
  { value: "15min",  label: "Avg delivery" },
  { value: "10K+",   label: "Happy customers" },
];

export default function Home() {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const { data: featured } = trpc.menu.items.useQuery({ featured: true });
  const { data: popular } = trpc.menu.items.useQuery({ popular: true });

  const handleAddToCart = (item: any) => {
    addItem({
      id: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image || "/hero-shake.jpg",
      quantity: 1,
    });
    toast.success(`${item.name} added!`, { description: `$${parseFloat(item.price).toFixed(2)}` });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-orange-700">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-amber-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-700/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-sm font-semibold mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Now delivering in your area
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none">
              Cereal
              <br />
              <span className="text-amber-400">Shakes.</span>
              <br />
              <span className="text-white/70 text-4xl sm:text-5xl font-bold">Delivered.</span>
            </h1>

            <p className="mt-6 text-xl text-amber-100/80 leading-relaxed max-w-lg">
              Handcrafted cereal milkshakes made with your favorite cereals and premium ice cream,
              delivered hot-fresh to your door in under 30 minutes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                onClick={() => navigate("/menu")}
                size="lg"
                className="h-14 px-8 text-lg bg-amber-400 hover:bg-amber-300 text-amber-900 font-black rounded-2xl shadow-xl shadow-amber-400/30"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Order Now
              </Button>
              <Button
                onClick={() => navigate("/rewards")}
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-amber-400/40 text-amber-300 hover:bg-amber-400/10 rounded-2xl backdrop-blur-sm"
              >
                <Gift className="w-5 h-5 mr-2" />
                Rewards
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-4 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-amber-400">{s.value}</div>
                  <div className="text-xs text-amber-200/60 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero shake visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative">
              <div className="w-80 h-80 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-900/50">
                <span className="text-[10rem] select-none">🥤</span>
              </div>
              {/* Floating badges */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2 shadow-xl"
              >
                <div className="text-amber-700 font-black text-sm">🏆 #1 Rated</div>
              </motion.div>
              <motion.div
                animate={{ y: [8, -8, 8] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-amber-400 rounded-2xl px-4 py-2 shadow-xl"
              >
                <div className="text-amber-900 font-black text-sm">Free delivery 🚀</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" fill="white" preserveAspectRatio="none">
            <path d="M0,80 C360,0 1080,80 1440,20 L1440,80 Z" />
          </svg>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-amber-50 border border-amber-100"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-bold text-amber-900">{label}</div>
                <div className="text-sm text-amber-600 mt-1">{sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured shakes ── */}
      {featured && featured.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-amber-900">Featured Shakes</h2>
                <p className="text-amber-600 mt-1">Handpicked by our shake masters</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/menu")} className="text-amber-600 hover:text-amber-800">
                See all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((item, i) => (
                <ShakeCard key={item.id} item={item} index={i} onAdd={handleAddToCart} onView={() => navigate(`/menu/${item.id}`)} badge={<><Sparkles className="w-3 h-3" /> Featured</>} badgeClass="bg-purple-500" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Popular shakes ── */}
      {popular && popular.length > 0 && (
        <section className="py-16 bg-amber-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-amber-900">🔥 Most Popular</h2>
                <p className="text-amber-600 mt-1">What everyone's ordering right now</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/menu")} className="text-amber-600 hover:text-amber-800">
                See all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popular.slice(0, 4).map((item, i) => (
                <ShakeCard key={item.id} item={item} index={i} onAdd={handleAddToCart} onView={() => navigate(`/menu/${item.id}`)} badge={<><Flame className="w-3 h-3 fill-white" /> Popular</>} badgeClass="bg-amber-500" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Loyalty CTA ── */}
      <section className="py-20 bg-gradient-to-br from-amber-900 to-orange-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-4xl font-black text-white">Join Shake Rewards</h2>
            <p className="mt-4 text-xl text-amber-200/80 max-w-2xl mx-auto">
              Earn points on every order. Redeem for free shakes, discounts, and exclusive perks.
              New members get 100 bonus points just for signing up.
            </p>
            <Button
              onClick={() => navigate("/rewards")}
              size="lg"
              className="mt-8 h-14 px-10 text-lg bg-amber-400 hover:bg-amber-300 text-amber-900 font-black rounded-2xl shadow-xl shadow-amber-900/40"
            >
              <Gift className="w-5 h-5 mr-2" />
              Start Earning Points
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-amber-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-amber-200/60 text-sm">
            <div>
              <div className="text-white font-black text-xl mb-3">🥤 Cereal Shakes</div>
              <p>Milkshake delivery, reimagined. Made fresh, delivered fast.</p>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Quick Links</div>
              <div className="space-y-2">
                {[["Menu", "/menu"], ["Rewards", "/rewards"], ["Track Order", "/orders"], ["Support", "/support"]].map(([label, path]) => (
                  <button key={path} onClick={() => navigate(path)} className="block hover:text-amber-400 transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Contact</div>
              <div className="space-y-2">
                <div>📞 (555) 123-SHAKE</div>
                <div>📧 hello@cerealshakes.com</div>
                <div>📍 Delivering citywide</div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-amber-800 text-center text-amber-200/40 text-xs">
            © 2026 Cereal Shakes. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ShakeCard({ item, index, onAdd, onView, badge, badgeClass }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group bg-white rounded-2xl border border-amber-100 overflow-hidden hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={item.image || "/hero-shake.jpg"} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 text-white text-xs font-bold rounded-full ${badgeClass}`}>
          {badge}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Button onClick={(e) => { e.stopPropagation(); onAdd(item); }} className="w-full bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold rounded-xl">
            <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-amber-900">{item.name}</h3>
        <p className="text-amber-600 text-sm mt-1 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-black text-amber-700">${parseFloat(item.price).toFixed(2)}</span>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onAdd(item); }} className="bg-amber-500 hover:bg-amber-600 rounded-xl">
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
