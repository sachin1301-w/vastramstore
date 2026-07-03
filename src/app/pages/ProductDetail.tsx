import { useState, useContext, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { StockContext } from '../context/StockContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Update selected image when product changes
  useEffect(() => {
    if (product?.image) {
      setSelectedImage(product.image);
    }
  }, [product?.id, product?.image]);

  // If product has sizeStock, derive total from it; otherwise use context/product.stock
  const totalStock = product
    ? (product.sizeStock && Object.keys(product.sizeStock).length > 0
        ? Object.values(product.sizeStock).reduce((a, b) => a + b, 0)
        : (stockContext ? stockContext.getStock(product.id) : (product.stock ?? 10)))
    : 0;

  // Per-size stock: use sizeStock if available and a size is selected
  const sizeStock = (selectedSize && product?.sizeStock?.[selectedSize] !== undefined)
    ? product.sizeStock![selectedSize]
    : null;
  const stock = sizeStock !== null ? sizeStock : totalStock;

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
    if (stock <= 0) {
      toast.error('This product is out of stock');
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
        {/* Back Button */}
        <Link to="/products" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <ImageWithFallback
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <Badge className="absolute top-4 left-4 bg-amber-700 hover:bg-amber-800">
                  {product.badge}
                </Badge>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all hover:border-amber-700 ${
                      selectedImage === image
                        ? 'border-amber-700 ring-2 ring-amber-700'
                        : 'border-gray-200'
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
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

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block mb-3">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const qty = product.sizeStock?.[size];
                    const outOfStock = qty !== undefined && qty <= 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !outOfStock && setSelectedSize(size)}
                        disabled={outOfStock}
                        className={`px-4 py-2 border rounded-md transition-colors relative ${
                          outOfStock
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                            : selectedSize === size
                            ? 'bg-amber-700 text-white border-amber-700'
                            : 'border-gray-300 hover:border-amber-700'
                        }`}
                      >
                        {size}
                        {qty !== undefined && !outOfStock && (
                          <span className="block text-xs opacity-60">{qty} left</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {stock > 0 ? (
                <div>
                  <p className="text-green-600 font-medium">
                    In Stock: {stock} {selectedSize ? `available in ${selectedSize}` : 'units available'}
                  </p>
                  {stock <= 5 && (
                    <p className="text-orange-600 text-sm mt-1">Only {stock} left — Order soon!</p>
                  )}
                </div>
              ) : (
                <p className="text-red-600 font-medium">
                  {selectedSize ? `${selectedSize} is out of stock` : 'Out of Stock'}
                </p>
              )}
            </div>

            {/* Add to Cart */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-amber-700 hover:bg-amber-800"
                onClick={handleAddToCart}
                disabled={stock <= 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
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
