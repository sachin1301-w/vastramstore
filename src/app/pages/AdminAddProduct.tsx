import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Package, Upload, X, Plus, ArrowLeft } from 'lucide-react';

export function AdminAddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'T-Shirts',
    sizes: [] as string[],
    badge: '',
    mainImage: '',
    galleryImages: [''],
  });

  const categories = ['Dresses', 'Shirts', 'T-Shirts', 'Outerwear', 'Accessories', 'Bottoms', 'Traditional', 'Sarees'];
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const badges = ['', 'NEW', 'SALE', 'TRENDING', 'HOT'];

  const handleSizeToggle = (size: string) => {
    if (formData.sizes.includes(size)) {
      setFormData({
        ...formData,
        sizes: formData.sizes.filter(s => s !== size),
      });
    } else {
      setFormData({
        ...formData,
        sizes: [...formData.sizes, size],
      });
    }
  };

  const addGalleryImage = () => {
    setFormData({
      ...formData,
      galleryImages: [...formData.galleryImages, ''],
    });
  };

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      galleryImages: formData.galleryImages.filter((_, i) => i !== index),
    });
  };

  const updateGalleryImage = (index: number, value: string) => {
    const newImages = [...formData.galleryImages];
    newImages[index] = value;
    setFormData({
      ...formData,
      galleryImages: newImages,
    });
  };

  const generateProductCode = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.description || !formData.price || !formData.mainImage) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.sizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }

    // Generate product code
    const productCode = generateProductCode();

    // Filter out empty gallery images
    const validGalleryImages = [formData.mainImage, ...formData.galleryImages.filter(img => img.trim() !== '')];

    // Create product object
    const newProduct = {
      id: productCode,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      image: formData.mainImage,
      images: validGalleryImages,
      category: formData.category,
      sizes: formData.sizes,
      inStock: true,
      featured: false,
      badge: formData.badge || undefined,
    };

    // Generate the code to copy
    const productCode_str = JSON.stringify(newProduct, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(productCode_str);

    toast.success('Product code copied to clipboard!', {
      description: 'Paste this into /src/app/data/products.ts in the products array',
      duration: 8000,
    });

    console.log('=== NEW PRODUCT CODE ===');
    console.log('Copy this and add it to /src/app/data/products.ts:');
    console.log('');
    console.log(productCode_str + ',');
    console.log('');
    console.log('========================');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-4 rounded-2xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-gray-600">Fill in the details to add a new product</p>
            </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-blue-900 mb-2">📝 How This Works</h3>
          <ol className="space-y-2 text-blue-800 text-sm">
            <li><strong>1.</strong> Fill in all product details below</li>
            <li><strong>2.</strong> Upload your product images to Imgur.com or another image host</li>
            <li><strong>3.</strong> Paste the image URLs in the image fields</li>
            <li><strong>4.</strong> Click "Generate Product Code"</li>
            <li><strong>5.</strong> The code will be copied to your clipboard automatically</li>
            <li><strong>6.</strong> Paste it into <code className="bg-blue-200 px-1 rounded">/src/app/data/products.ts</code></li>
          </ol>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Basic Information
              </h3>

              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Red Cotton Kurta"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  className="w-full min-h-[100px] p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="999"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="originalPrice">Original Price (₹) - Optional</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="1499"
                  />
                  <p className="text-xs text-gray-500 mt-1">For showing discounts (strike-through)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="badge">Badge - Optional</Label>
                  <select
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    {badges.map(badge => (
                      <option key={badge} value={badge}>{badge || 'None'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Available Sizes *
              </h3>
              <div className="flex flex-wrap gap-3">
                {allSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      formData.sizes.includes(size)
                        ? 'bg-orange-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Product Images *
              </h3>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>📸 How to get image URLs:</strong>
                </p>
                <ol className="text-sm text-amber-800 mt-2 space-y-1">
                  <li>1. Go to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Imgur.com</a></li>
                  <li>2. Click "New post" and upload your image</li>
                  <li>3. Right-click on the uploaded image → "Copy image address"</li>
                  <li>4. Paste the URL in the fields below</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="mainImage">Main Product Image URL *</Label>
                <Input
                  id="mainImage"
                  value={formData.mainImage}
                  onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                  placeholder="https://i.imgur.com/abc123.jpg"
                  required
                />
                {formData.mainImage && (
                  <div className="mt-3">
                    <img
                      src={formData.mainImage}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Gallery Images (Additional Views)</Label>
                <p className="text-xs text-gray-500 mb-3">Add multiple images to show different angles</p>
                
                {formData.galleryImages.map((image, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <Input
                      value={image}
                      onChange={(e) => updateGalleryImage(index, e.target.value)}
                      placeholder={`Image ${index + 2} URL (optional)`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeGalleryImage(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addGalleryImage}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More Images
                </Button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t-2 border-gray-200">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 text-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Generate Product Code
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                The product code will be automatically copied to your clipboard
              </p>
            </div>
          </form>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Next Steps After Generating Code:</h3>
          <ol className="space-y-2 text-gray-700">
            <li><strong>1.</strong> The product code is now in your clipboard</li>
            <li><strong>2.</strong> Open the file: <code className="bg-gray-200 px-2 py-1 rounded">/src/app/data/products.ts</code></li>
            <li><strong>3.</strong> Find the <code className="bg-gray-200 px-2 py-1 rounded">export const products: Product[] = [</code> line</li>
            <li><strong>4.</strong> Scroll to the end of the products array (before the <code className="bg-gray-200 px-2 py-1 rounded">];</code>)</li>
            <li><strong>5.</strong> Paste your product code there</li>
            <li><strong>6.</strong> Make sure there's a comma after the previous product</li>
            <li><strong>7.</strong> Save the file - your product will appear instantly!</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
