"use client";

import Image from "next/image";
import { Plus, Check } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const isInCart = items.some((item) => item.id === product.id);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="aspect-square relative overflow-hidden bg-secondary">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="mt-1 font-semibold text-foreground text-lg leading-tight">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">
            ${product.price.toFixed(2)}
          </span>
          
          <button
            onClick={handleAddToCart}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              isInCart || isAdding
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {isAdding || isInCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
