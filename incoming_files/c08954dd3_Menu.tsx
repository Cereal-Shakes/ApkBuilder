import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Star, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

export default function Menu() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const { data: categories } = trpc.menu.categories.useQuery();
  const { data: items, isLoading } = trpc.menu.items.useQuery({
    categoryId: activeCategory,
    search: search || undefined,
  });

  const handleAddToCart = (item: any) => {
    addItem({
      id: Date.now() + Math.random(),
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image || "/hero-shake.jpg",
      quantity: 1,
    });
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-black text-amber-900">Our Menu</h1>
            <p className="mt-2 text-amber-600">
              Discover our handcrafted cereal milkshakes
            </p>
          </motion.div>

          {/* Search & Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shakes..."
                className="pl-10 h-12 bg-amber-50 border-amber-200 rounded-xl focus:ring-amber-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(undefined)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !activeCategory
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-amber-100/50 animate-pulse h-80" />
            ))}
          </div>
        ) : items?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-amber-300" />
            </div>
            <h3 className="text-xl font-bold text-amber-900">No shakes found</h3>
            <p className="text-amber-600 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {items?.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white rounded-2xl border border-amber-100 overflow-hidden hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-300"
                >
                  <div
                    className="relative aspect-square overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/menu/${item.id}`)}
                  >
                    <img
                      src={item.image || "/hero-shake.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.popular && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                        <Star className="w-3 h-3 fill-white" />
                        Popular
                      </div>
                    )}
                    {item.calories && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
                        {item.calories} cal
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="w-full bg-white text-amber-700 hover:bg-amber-50 font-semibold"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Quick Add
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3
                      className="font-bold text-amber-900 text-lg cursor-pointer hover:text-amber-600 transition-colors"
                      onClick={() => navigate(`/menu/${item.id}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-amber-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-2xl font-bold text-amber-700">
                        ${parseFloat(item.price).toFixed(2)}
                      </span>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 rounded-xl"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
