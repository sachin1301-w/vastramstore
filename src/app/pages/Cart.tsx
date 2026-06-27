import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

// Small component: manual prev/next image for a cart item (no auto-slide)
function CartItemImage({ productId, fallbackSrc, name }: { productId: string; fallbackSrc: string; name: string }) {
  const product = products.find(p => p.id === productId);
  const images: string[] = useMemo(
    () => (product?.images && product.images.length > 0 ? product.images : [fallbackSrc]),
    [product, fallbackSrc]
  );

  const [index, setIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setIndex(i => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setIndex(i => (i + 1) % images.length);
  };

  if (images.length === 1) {
    return (
      <ImageWithFallback src={images[0]} alt={name} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
    );
  }

  return (
    <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0 group">
      <ImageWithFallback
        key={images[index]}
        src={images[index]}
        alt={`${name} ${index + 1}`}
        className="w-full h-full object-cover"
        loading="eager"
        decoding="sync"
      />
      <button
        onClick={prev}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-3 h-3 text-gray-800" />
      </button>
      <button
        onClick={next}
        className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next image"
      >
        <ChevronRight className="w-3 h-3 text-gray-800" />
      </button>
    </div>
  );
}

export function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started</p>
          <Link to="/products">
            <Button className="bg-amber-700 hover:bg-amber-800">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="bg-white rounded-lg p-4 flex gap-4 shadow-sm">
                <CartItemImage productId={item.id} fallbackSrc={item.image} name={item.name} />

                <div className="flex-1">
                  <h3 className="mb-1">{item.name}</h3>
                  {item.size && <p className="text-sm text-gray-600 mb-2">Size: {item.size}</p>}
                  <p className="mb-3">₹{item.price.toFixed(2)}</p>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="text-xl mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span>Total</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
              <Link to="/checkout">
                <Button className="w-full bg-amber-700 hover:bg-amber-800 mb-3">Proceed to Checkout</Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
