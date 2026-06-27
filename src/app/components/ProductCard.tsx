import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../data/products';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { useContext, useState } from 'react';
import { StockContext } from '../context/StockContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const stockContext = useContext(StockContext);
  const stock = stockContext ? stockContext.getStock(product.id) : (product.stock ?? 10);

  // Build image list — gallery only when multiple images exist
  const images: string[] =
    product.images && product.images.length > 1
      ? product.images
      : [product.image];

  const hasMultiple = images.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i + 1) % images.length);
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {hasMultiple ? (
            <>
              {/* Single image shown at a time — no auto-slide, just current index */}
              <ImageWithFallback
                key={images[currentIndex]}
                src={images[currentIndex]}
                alt={`${product.name} — ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
              />

              {/* Prev / Next arrows — always visible since there's no auto-advance */}
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow z-10 transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4 text-gray-800" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow z-10 transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4 text-gray-800" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'bg-amber-700 w-3 h-1.5' : 'bg-white/70 w-1.5 h-1.5'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Single image — keep original zoom-on-hover behaviour */
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <ImageWithFallback
                src={images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {/* Badges — always on top */}
          {product.badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="absolute top-3 left-3 bg-amber-700 hover:bg-amber-800 z-10">
                {product.badge}
              </Badge>
            </motion.div>
          )}
          {stock <= 0 && (
            <Badge className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 z-10">
              OUT OF STOCK
            </Badge>
          )}
          {stock > 0 && stock <= 5 && (
            <Badge className="absolute top-3 right-3 bg-orange-600 hover:bg-orange-700 z-10">
              Only {stock} left
            </Badge>
          )}
        </div>

        {/* Product info */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
          <p className="text-xs text-gray-500 mb-3">
            {stock > 0 ? `Stock: ${stock} units` : 'Out of stock'}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-2xl text-amber-700 group-hover:text-amber-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                ₹{product.price.toFixed(2)}
              </motion.span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="icon"
                className="bg-amber-700 hover:bg-amber-800"
                onClick={e => e.preventDefault()}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  );
}
