"use client";

import { ShoppingBag, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { CartItem } from "./cart-item";
import { useState } from "react";

export function CartSidebar() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const shipping = totalPrice > 100 ? 0 : 9.99;
  const tax = totalPrice * 0.08;
  const finalTotal = totalPrice + shipping + tax;

  return (
    <>
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
        aria-label="Open cart"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-semibold">Cart</span>
        {totalItems > 0 && (
          <span className="bg-background text-foreground text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
              <span className="bg-primary/10 text-primary text-sm font-medium px-2 py-0.5 rounded-full">
                {totalItems} items
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Your cart is empty
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add some products to get started
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-4 space-y-4 bg-card">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {totalPrice < 100 && (
                  <p className="text-xs text-primary">
                    Add ${(100 - totalPrice).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="flex justify-between text-foreground font-semibold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Checkout
              </button>

              <button
                onClick={clearCart}
                className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Clear cart
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
