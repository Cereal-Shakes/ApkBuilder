export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "Premium noise-canceling wireless headphones with 30-hour battery life",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  {
    id: "2",
    name: "Minimalist Watch",
    description: "Elegant timepiece with sapphire crystal and leather strap",
    price: 189.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Accessories",
  },
  {
    id: "3",
    name: "Smart Speaker",
    description: "Voice-controlled speaker with premium sound quality",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  {
    id: "4",
    name: "Leather Backpack",
    description: "Handcrafted genuine leather backpack with laptop compartment",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    category: "Accessories",
  },
  {
    id: "5",
    name: "Fitness Tracker",
    description: "Advanced health monitoring with GPS and heart rate sensor",
    price: 179.99,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  {
    id: "6",
    name: "Ceramic Mug Set",
    description: "Set of 4 handmade ceramic mugs with modern design",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
    category: "Home",
  },
  {
    id: "7",
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with Cherry MX switches",
    price: 159.99,
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  {
    id: "8",
    name: "Plant Pot Collection",
    description: "Set of 3 minimalist concrete planters for indoor plants",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop",
    category: "Home",
  },
];
