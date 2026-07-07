import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;           // crypto.randomUUID()
  menuItemId: number;
  name: string;
  price: string;        // decimal string e.g. "9.99"
  image: string;
  quantity: number;
  addOns?: string;      // JSON stringified add-ons
  specialInstructions?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // If same menuItemId and same add-ons already in cart, increment quantity
          const existing = state.items.find(
            (i) => i.menuItemId === item.menuItemId && i.addOns === item.addOns
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.id !== id)
            : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cereal-shakes-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
