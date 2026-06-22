import { useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { findProductById, getTotalStock, getSizeStock } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { StockContext } from '../context/StockContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, ArrowLeft, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function ProductDetail() {
  const { id } = useParams();
  const product = findProductById(id);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const stockContext = useContext(StockContext);
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = product?.images && product.images.length > 0
    ? product.images
    : (product ? [product.image] : []);

  // Calculate total stock dynamically
  const totalStock = product
    ? (stockContext ? stockContext.getStock(product.id) : getTotalStock(product))
    : 0;

  // Get stock for selected size (and color if applicable)
  const selectedSizeStock = product && selectedSize
    ? (stockContext
        ? stockContext.getSizeStock(product.id, selectedSize, selectedColor || undefined)
        : getSizeStock(product, selectedSize, selectedColor || undefined))
    : 0;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Product not found</h2>
          <Link to="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleAddToCart = () => {
    // Check if user is logged in first
    if (!user) {
      toast.error('Please login to add items to cart', {
        duration: 4000,
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        }
      });
      return;
    }

    // Check stock availability
    if (totalStock <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // Check size-specific stock if sizeStock exists
    if (product.sizeStock && product.sizeStock.length > 0 && selectedSize) {
      const sizeStock = stockContext
        ? stockContext.getSizeStock(product.id, selectedSize, selectedColor || undefined)
        : getSizeStock(product, selectedSize, selectedColor || undefined);
      if (sizeStock <= 0) {
        toast.error(`Size ${selectedSize}${selectedColor ? ` (${selectedColor})` : ''} is out of stock`);
        return;
      }
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link to="/products" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images with Slideshow */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <ImageWithFallback
                src={allImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}

              {product.badge && (
                <Badge className="absolute top-4 left-4 bg-amber-700 hover:bg-amber-800">
                  {product.badge}
                </Badge>
              )}
            </div>

            {/* Thumbnail Images */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'border-amber-600 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`${product.name} - view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                {currentImageIndex + 1} / {allImages.length}
              </p>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl">₹{product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mb-6">
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <label className="block mb-3">
                  Select Color {selectedColor && <span className="text-amber-700 font-medium">- {selectedColor}</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize('');
                      }}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        selectedColor === color
                          ? 'bg-amber-700 text-white border-amber-700'
                          : 'border-gray-300 hover:border-amber-700'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block mb-3">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const sizeStock = product.sizeStock
                      ? getSizeStock(product, size, selectedColor || undefined)
                      : undefined;
                    const isOutOfStock = sizeStock !== undefined && sizeStock <= 0;

                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 border rounded-md transition-colors ${
                          selectedSize === size
                            ? 'bg-amber-700 text-white border-amber-700'
                            : isOutOfStock
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                              : 'border-gray-300 hover:border-amber-700'
                        }`}
                        title={isOutOfStock ? 'Out of stock' : sizeStock !== undefined ? `${sizeStock} available` : ''}
                      >
                        {size}
                        {sizeStock !== undefined && sizeStock > 0 && (
                          <span className="ml-1 text-xs opacity-70">({sizeStock})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {totalStock > 0 ? (
                <div>
                  <p className="text-green-600 font-medium">
                    In Stock: {totalStock} units available
                    {selectedSize && product.sizeStock && (
                      <span className="text-gray-600 font-normal ml-2">
                        (Size {selectedSize}: {selectedSizeStock} available)
                      </span>
                    )}
                  </p>
                  {totalStock <= 5 && (
                    <p className="text-orange-600 text-sm mt-1">Only {totalStock} left - Order soon!</p>
                  )}
                </div>
              ) : (
                <p className="text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            {/* Add to Cart */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-amber-700 hover:bg-amber-800"
                onClick={handleAddToCart}
                disabled={totalStock <= 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {totalStock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Product Features */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="mb-4">Product Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Premium quality materials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Comfortable fit</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Easy care and maintenance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Free shipping on orders over ₹500</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
