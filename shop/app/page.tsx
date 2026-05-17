import { CartProvider } from "@/context/cart-context";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { CartSidebar } from "@/components/cart-sidebar";

export default function Home() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              New Arrivals
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">
              Discover Premium Products
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Curated selection of high-quality products designed to elevate your everyday life. 
              Free shipping on orders over $100.
            </p>
          </div>

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Featured Products</h2>
              <span className="text-sm text-muted-foreground">8 products</span>
            </div>
            <ProductGrid />
          </section>
        </main>

        <CartSidebar />
      </div>
    </CartProvider>
  );
}
