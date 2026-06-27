import { useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
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
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const stockContext = useContext(StockContext);
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Defensive helper — only calls getStockForSize if it actually exists on
  // the context. Prevents "X is not a function" crashes if the provider
  // doesn't implement per-size stock tracking.
  const getSizeStock = useCallback(
    (productId: string, size: string): number | null => {
      if (
        stockContext &&
        typeof (stockContext as any).getStockForSize === 'function'
      ) {
        return (stockContext as any).getStockForSize(productId, size);
      }
      return null;
    },
    [stockContext]
  );

  const getTotalStockSafe = useCallback(
    (productId: string, fallback: number): number => {
      if (stockContext && typeof (stockContext as any).getStock === 'function') {
        return (stockContext as any).getStock(productId);
      }
      return fallback;
    },
    [stockContext]
  );

  // All images for the gallery
  const allImages: string[] = useMemo(
    () =>
      product
        ? (product.images && product.images.length > 0 ? product.images : [product.image])
        : [],
    [product]
  );

  // Total stock (whole product)
  const totalStock = product ? getTotalStockSafe(product.id, product.stock ?? 10) : 0;

  // Stock for selected size
  const sizeStock = product && selectedSize ? getSizeStock(product.id, selectedSize) : null;

  const displayStock = sizeStock !== null ? sizeStock : totalStock;

  // Image navigation — manual only
  const prevImage = useCallback(() => {
    setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(i => (i + 1) % allImages.length);
  }, [allImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prevImage, nextImage]);

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

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart', {
        duration: 4000,
        action: { label: 'Login', onClick: () => navigate('/login') },
      });
      return;
    }

    if (displayStock <= 0) {
      toast.error(selectedSize ? `Size ${selectedSize} is out of stock` : 'This product is out of stock');
      return;
    }

    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize || undefined,
    });

    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link to="/products" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Image Gallery ────────────────────────────────── */}
          <div>
            {/* Main image with prev/next */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 group">
              <ImageWithFallback
                key={allImages[currentImageIndex]}
                src={allImages[currentImageIndex]}
                alt={`${product.name} — image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
              />

              {product.badge && (
                <Badge className="absolute top-4 left-4 bg-amber-700 hover:bg-amber-800 z-10">
                  {product.badge}
                </Badge>
              )}

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentImageIndex ? 'bg-amber-700 w-4' : 'bg-white/70'
                        }`}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      i === currentImageIndex
                        ? 'border-amber-700 shadow-md'
                        : 'border-gray-200 hover:border-amber-400'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="sync"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ─────────────────────────────────── */}
          <div>
            <h1 className="text-3xl md:text-4xl mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl">₹{product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            <div className="mb-6">
              <Badge variant="outline" className="mb-2">{product.category}</Badge>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="font-medium mb-2">Available Colors</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <span
                      key={color}
                      className="px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-700"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block mb-3 font-medium">Select Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const szQty = getSizeStock(product.id, size);
                    const outOfStock = szQty !== null && szQty <= 0;

                    return (
                      <button
                        key={size}
                        onClick={() => !outOfStock && setSelectedSize(size)}
                        disabled={outOfStock}
                        title={szQty !== null ? `${szQty} left` : ''}
                        className={`px-4 py-2 border rounded-md transition-colors relative ${
                          selectedSize === size
                            ? 'bg-amber-700 text-white border-amber-700'
                            : outOfStock
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                            : 'border-gray-300 hover:border-amber-700'
                        }`}
                      >
                        {size}
                        {szQty !== null && szQty > 0 && szQty <= 5 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" title={`Only ${szQty} left`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && sizeStock !== null && sizeStock > 0 && sizeStock <= 5 && (
                  <p className="text-orange-600 text-sm mt-2">Only {sizeStock} left in size {selectedSize}!</p>
                )}
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {selectedSize && sizeStock !== null ? (
                sizeStock > 0 ? (
                  <p className="text-green-600 font-medium">
                    {sizeStock} unit{sizeStock !== 1 ? 's' : ''} available in size {selectedSize}
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">Size {selectedSize} is out of stock</p>
                )
              ) : totalStock > 0 ? (
                <p className="text-green-600 font-medium">In Stock: {totalStock} units available</p>
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
                disabled={displayStock <= 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {displayStock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="mb-4">Product Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start"><span className="mr-2">✓</span><span>Premium quality materials</span></li>
                <li className="flex items-start"><span className="mr-2">✓</span><span>Comfortable fit</span></li>
                <li className="flex items-start"><span className="mr-2">✓</span><span>Easy care and maintenance</span></li>
                <li className="flex items-start"><span className="mr-2">✓</span><span>Free shipping on orders over ₹500</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
