import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Package, Upload, X, Plus, ArrowLeft, Palette } from 'lucide-react';

interface SizeStock {
  size: string;
  quantity: number;
}

export function AdminAddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'T-Shirts',
    badge: '',
    mainImage: '',
    galleryImages: [''],
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});
  const [colors, setColors] = useState<string[]>(['']);

  const categories = ['Dresses', 'Shirts', 'T-Shirts', 'Outerwear', 'Accessories', 'Bottoms', 'Traditional', 'Sarees', 'Raincoat'];
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const badges = ['', 'NEW', 'SALE', 'TRENDING', 'HOT'];

  // ── Size toggle + stock ──────────────────────────────────────────────────
  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(prev => prev.filter(s => s !== size));
      setSizeStocks(prev => {
        const next = { ...prev };
        delete next[size];
        return next;
      });
    } else {
      setSelectedSizes(prev => [...prev, size]);
      setSizeStocks(prev => ({ ...prev, [size]: 0 }));
    }
  };

  const handleSizeQtyChange = (size: string, qty: number) => {
    setSizeStocks(prev => ({ ...prev, [size]: Math.max(0, qty) }));
  };

  // ── Colors ───────────────────────────────────────────────────────────────
  const addColor = () => setColors(prev => [...prev, '']);
  const removeColor = (i: number) => setColors(prev => prev.filter((_, idx) => idx !== i));
  const updateColor = (i: number, val: string) => {
    const next = [...colors];
    next[i] = val;
    setColors(next);
  };

  // ── Gallery images ────────────────────────────────────────────────────────
  const addGalleryImage = () => setFormData(f => ({ ...f, galleryImages: [...f.galleryImages, ''] }));
  const removeGalleryImage = (i: number) =>
    setFormData(f => ({ ...f, galleryImages: f.galleryImages.filter((_, idx) => idx !== i) }));
  const updateGalleryImage = (i: number, val: string) => {
    const next = [...formData.galleryImages];
    next[i] = val;
    setFormData(f => ({ ...f, galleryImages: next }));
  };

  const generateProductCode = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.mainImage) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }
    // Ensure all selected sizes have a quantity > 0
    const missingQty = selectedSizes.filter(s => !sizeStocks[s] || sizeStocks[s] <= 0);
    if (missingQty.length > 0) {
      toast.error(`Please enter stock quantity for: ${missingQty.join(', ')}`);
      return;
    }

    const productId = generateProductCode();
    const validGalleryImages = [formData.mainImage, ...formData.galleryImages.filter(img => img.trim() !== '')];
    const validColors = colors.map(c => c.trim()).filter(Boolean);

    // Build sizeStock array
    const sizeStockArr = selectedSizes.map(s => ({ size: s, quantity: sizeStocks[s] ?? 0 }));
    const totalStock = sizeStockArr.reduce((sum, s) => sum + s.quantity, 0);

    const newProduct: Record<string, unknown> = {
      id: productId,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      ...(formData.originalPrice ? { originalPrice: parseFloat(formData.originalPrice) } : {}),
      image: formData.mainImage,
      images: validGalleryImages,
      category: formData.category,
      sizes: selectedSizes,
      ...(validColors.length > 0 ? { colors: validColors } : {}),
      inStock: true,
      stock: totalStock,
      sizeStock: sizeStockArr,
      featured: false,
      ...(formData.badge ? { badge: formData.badge } : {}),
    };

    const productCode = JSON.stringify(newProduct, null, 2);
    navigator.clipboard.writeText(productCode);

    toast.success('Product code copied to clipboard!', {
      description: 'Paste this into /src/app/data/products.ts in the products array',
      duration: 8000,
    });

    console.log('=== NEW PRODUCT CODE ===');
    console.log(productCode + ',');
    console.log('========================');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
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
            <li><strong>2.</strong> Select sizes and enter stock quantity per size</li>
            <li><strong>3.</strong> Optionally add available colors</li>
            <li><strong>4.</strong> Add image URLs (upload to Imgur.com first)</li>
            <li><strong>5.</strong> Click "Generate Product Code" — code is copied to clipboard</li>
            <li><strong>6.</strong> Paste into <code className="bg-blue-200 px-1 rounded">/src/app/data/products.ts</code></li>
          </ol>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Basic Info ───────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Basic Information
              </h3>

              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Red Cotton Kurta"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="999"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original Price (₹) — Optional</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    required
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="badge">Badge — Optional</Label>
                  <select
                    id="badge"
                    value={formData.badge}
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    {badges.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* ── Sizes + Per-size Stock ───────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Sizes & Stock Quantity *
              </h3>
              <p className="text-sm text-gray-500">Select a size to enable it, then enter how many units are available for that size.</p>

              <div className="space-y-3">
                {allSizes.map(size => {
                  const selected = selectedSizes.includes(size);
                  return (
                    <div key={size} className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        className={`w-16 py-2 rounded-lg font-semibold text-sm transition-all flex-shrink-0 ${
                          selected
                            ? 'bg-orange-500 text-white shadow-md scale-105'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {size}
                      </button>
                      {selected && (
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-sm text-gray-600 whitespace-nowrap">Stock qty:</Label>
                          <Input
                            type="number"
                            min={0}
                            value={sizeStocks[size] ?? 0}
                            onChange={e => handleSizeQtyChange(size, parseInt(e.target.value) || 0)}
                            className="w-28"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-400">units</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedSizes.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-orange-800">
                    Total stock: {selectedSizes.reduce((sum, s) => sum + (sizeStocks[s] || 0), 0)} units
                    across {selectedSizes.length} size{selectedSizes.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </section>

            {/* ── Colors ──────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                <span className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-500" />
                  Available Colors — Optional
                </span>
              </h3>
              <p className="text-sm text-gray-500">Add color names if the product comes in multiple colors (e.g. Red, Blue, Black).</p>

              {colors.map((color, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={color}
                    onChange={e => updateColor(i, e.target.value)}
                    placeholder={`Color ${i + 1} (e.g. Navy Blue)`}
                  />
                  {colors.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => removeColor(i)} className="flex-shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addColor} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Color
              </Button>
            </section>

            {/* ── Images ──────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Product Images *
              </h3>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-semibold">📸 How to get image URLs:</p>
                <ol className="text-sm text-amber-800 mt-2 space-y-1">
                  <li>1. Go to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Imgur.com</a></li>
                  <li>2. Click "New post" and upload your image</li>
                  <li>3. Right-click on the uploaded image → "Copy image address"</li>
                  <li>4. Paste the URL below</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="mainImage">Main Product Image URL *</Label>
                <Input
                  id="mainImage"
                  value={formData.mainImage}
                  onChange={e => setFormData({ ...formData, mainImage: e.target.value })}
                  placeholder="https://i.imgur.com/abc123.jpg"
                  required
                />
                {formData.mainImage && (
                  <div className="mt-3">
                    <img
                      src={formData.mainImage}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Gallery Images (Additional Views)</Label>
                <p className="text-xs text-gray-500 mb-3">Add up to 4–5 images to show different angles. These will appear in the slideshow on the product page.</p>

                {formData.galleryImages.map((image, i) => (
                  <div key={i} className="flex gap-2 mb-3">
                    <Input
                      value={image}
                      onChange={e => updateGalleryImage(i, e.target.value)}
                      placeholder={`Image ${i + 2} URL (optional)`}
                    />
                    <Button type="button" variant="ghost" onClick={() => removeGalleryImage(i)} className="flex-shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addGalleryImage} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add More Images
                </Button>
              </div>
            </section>

            {/* ── Submit ──────────────────────────────────────── */}
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

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Next Steps After Generating Code:</h3>
          <ol className="space-y-2 text-gray-700">
            <li><strong>1.</strong> The product code is now in your clipboard</li>
            <li><strong>2.</strong> Open <code className="bg-gray-200 px-2 py-1 rounded">/src/app/data/products.ts</code></li>
            <li><strong>3.</strong> Find the <code className="bg-gray-200 px-2 py-1 rounded">export const products: Product[] = [</code> line</li>
            <li><strong>4.</strong> Scroll to the end of the products array (before the <code className="bg-gray-200 px-2 py-1 rounded">];</code>)</li>
            <li><strong>5.</strong> Paste your product code there (add a comma after the previous product)</li>
            <li><strong>6.</strong> Save the file — your product appears instantly!</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
