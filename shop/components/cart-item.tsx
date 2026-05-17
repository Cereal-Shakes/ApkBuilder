"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/lib/products";
import { useCart } from "@/context/cart-context";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-b-0">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{item.name}</h4>
        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
        
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary rounded-lg">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="p-1.5 hover:bg-muted rounded-l-lg transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-foreground">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-1.5 hover:bg-muted rounded-r-lg transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <button
            onClick={() => removeFromCart(item.id)}
            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <span className="font-semibold text-foreground">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
