import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../data/products';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { useContext } from 'react';
import { StockContext } from '../context/StockContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const stockContext = useContext(StockContext);

  // Use context stock if available, otherwise fall back to product's initial stock
  const stock = stockContext
    ? stockContext.getStock(product.id)
    : (product.stock ?? 10);

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {product.badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="absolute top-3 left-3 bg-amber-700 hover:bg-amber-800">
                {product.badge}
              </Badge>
            </motion.div>
          )}
          {stock <= 0 && (
            <Badge className="absolute top-3 right-3 bg-red-600 hover:bg-red-700">
              OUT OF STOCK
            </Badge>
          )}
          {stock > 0 && stock <= 5 && (
            <Badge className="absolute top-3 right-3 bg-orange-600 hover:bg-orange-700">
              Only {stock} left
            </Badge>
          )}
        </div>
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
                onClick={(e) => {
                  e.preventDefault();
                }}
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