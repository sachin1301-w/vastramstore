import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Package, Upload, X, Plus, ArrowLeft } from 'lucide-react';
import { addDynamicProduct, getStoredCategoriesList, getStoredBadgesList, Product } from '../data/products';

// One row per size (or per size+color if colors are used)
interface SizeStockRow {
  size: string;
  stock: string; // kept as string while typing, parsed to number on submit
  color: string; // empty string if this product has no colors
}

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

  // NEW: colors for this product (e.g. Red, Blue). Leave empty if the product has no color variants.
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');

  // NEW: stock entered per size (and per color, if colors exist)
  const [sizeStockRows, setSizeStockRows] = useState<SizeStockRow[]>([]);

  // Categories & badges are admin-managed (see Admin Dashboard) and stored in
  // localStorage, so any category/badge added there shows up here automatically.
  const [categories, setCategories] = useState<string[]>(['Dresses', 'Shirts', 'T-Shirts', 'Outerwear', 'Accessories', 'Bottoms', 'Sarees', 'Raincoat']);
  const [badges, setBadges] = useState<string[]>(['', 'NEW', 'SALE', 'TRENDING', 'HOT']);
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  useEffect(() => {
    const storedCategories = getStoredCategoriesList().filter((c) => c !== 'All');
    if (storedCategories.length > 0) setCategories(storedCategories);

    const storedBadges = getStoredBadgesList();
    if (storedBadges.length > 0) setBadges(['', ...storedBadges]);
  }, []);

  // Rebuild the size/stock rows whenever the selected sizes OR the colors list changes.
  // If colors exist, we need one row per size PER color. If no colors, one row per size.
  const rebuildSizeStockRows = (sizes: string[], colorList: string[]) => {
    const rows: SizeStockRow[] = [];
    const colorsToUse = colorList.length > 0 ? colorList : [''];

    colorsToUse.forEach((color) => {
      sizes.forEach((size) => {
        // Preserve existing stock value if this size/color row already existed
        const existing = sizeStockRows.find((r) => r.size === size && r.color === color);
        rows.push({
          size,
          color,
          stock: existing ? existing.stock : '',
        });
      });
    });

    setSizeStockRows(rows);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter((s) => s !== size)
      : [...formData.sizes, size];

    setFormData({ ...formData, sizes: newSizes });
    rebuildSizeStockRows(newSizes, colors);
  };

  const handleAddColor = () => {
    const trimmed = newColor.trim();
    if (!trimmed) return;
    if (colors.includes(trimmed)) {
      toast.error('Color already added');
      return;
    }
    const newColors = [...colors, trimmed];
    setColors(newColors);
    setNewColor('');
    rebuildSizeStockRows(formData.sizes, newColors);
  };

  const handleRemoveColor = (color: string) => {
    const newColors = colors.filter((c) => c !== color);
    setColors(newColors);
    rebuildSizeStockRows(formData.sizes, newColors);
  };

  const updateStockForRow = (size: string, color: string, value: string) => {
    setSizeStockRows((prev) =>
      prev.map((row) =>
        row.size === size && row.color === color ? { ...row, stock: value } : row
      )
    );
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

    // Make sure every size (and size+color combo) has a stock value entered
    const missingStock = sizeStockRows.some((row) => row.stock === '' || isNaN(Number(row.stock)));
    if (missingStock) {
      toast.error('Please enter stock quantity for every size' + (colors.length > 0 ? ' and color' : ''));
      return;
    }

    // Generate product code
    const productCode = generateProductCode();

    // Filter out empty gallery images
    const validGalleryImages = [formData.mainImage, ...formData.galleryImages.filter(img => img.trim() !== '')];

    // Build the sizeStock array from the rows the admin filled in
    const sizeStock = sizeStockRows.map((row) => ({
      size: row.size,
      stock: Number(row.stock),
      ...(row.color ? { color: row.color } : {}),
    }));

    // Flat fallback stock = sum of all sizeStock entries (keeps old code that reads `stock` working)
    const totalStock = sizeStock.reduce((sum, s) => sum + s.stock, 0);

    // Create product object
    const newProduct: Product = {
      id: productCode,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      image: formData.mainImage,
      images: validGalleryImages,
      category: formData.category,
      sizes: formData.sizes,
      colors: colors.length > 0 ? colors : undefined,
      sizeStock,
      inStock: totalStock > 0,
      stock: totalStock,
      featured: false,
      badge: formData.badge || undefined,
    };

    // Save it so it shows up immediately on Home, Products, ProductDetail,
    // ProductCard, Cart and Checkout — no manual file editing needed.
    addDynamicProduct(newProduct);

    toast.success('Product added successfully!', {
      description: `${newProduct.name} is now live on the store.`,
      duration: 5000,
    });

    // Reset the form so the admin can add another product right away
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: formData.category,
      sizes: [],
      badge: '',
      mainImage: '',
      galleryImages: [''],
    });
    setColors([]);
    setSizeStockRows([]);

    navigate('/admin/dashboard');
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
            <li><strong>2.</strong> Select sizes, then (optionally) add colors, then enter stock for each size/color</li>
            <li><strong>3.</strong> Upload your product images to Imgur.com or another image host</li>
            <li><strong>4.</strong> Paste the image URLs in the image fields (add 3-4 for a slideshow)</li>
            <li><strong>5.</strong> Click "Add Product" — it goes live on the store instantly</li>
            <li><strong>6.</strong> Stock updates automatically as customers place orders</li>
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

            {/* NEW: Colors (optional) */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                Colors - Optional
              </h3>
              <p className="text-xs text-gray-500">
                Add colors only if this product comes in more than one color. If you skip this, stock will just be tracked per size.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="e.g., Red"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddColor}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Color
                </Button>
              </div>
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <span
                      key={color}
                      className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* NEW: Stock per size (and per color) */}
            {formData.sizes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-2">
                  Stock Quantity *
                </h3>
                <p className="text-xs text-gray-500">
                  Enter how many units you have for each size{colors.length > 0 ? ' and color' : ''}.
                </p>

                {colors.length === 0 ? (
                  // Simple case: one stock field per size
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sizeStockRows.map((row) => (
                      <div key={row.size}>
                        <Label htmlFor={`stock-${row.size}`}>Size {row.size}</Label>
                        <Input
                          id={`stock-${row.size}`}
                          type="number"
                          min="0"
                          value={row.stock}
                          onChange={(e) => updateStockForRow(row.size, '', e.target.value)}
                          placeholder="Qty"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  // With colors: group stock fields by color
                  <div className="space-y-6">
                    {colors.map((color) => (
                      <div key={color} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-3">{color}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.sizes.map((size) => {
                            const row = sizeStockRows.find((r) => r.size === size && r.color === color);
                            return (
                              <div key={`${color}-${size}`}>
                                <Label htmlFor={`stock-${color}-${size}`}>Size {size}</Label>
                                <Input
                                  id={`stock-${color}-${size}`}
                                  type="number"
                                  min="0"
                                  value={row?.stock ?? ''}
                                  onChange={(e) => updateStockForRow(size, color, e.target.value)}
                                  placeholder="Qty"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                  <li>5. Add 3-4 images total (main + gallery) so customers can swipe through a slideshow</li>
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
                <p className="text-xs text-gray-500 mb-3">Add multiple images (e.g. front, back, side, close-up) to power the slideshow on the product card and detail page</p>
                
                {formData.galleryImages.map((image, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <Input
                      value={image}
                      onChange={(e) => updateGalleryImage(index, e.target.value)}
                      placeholder={`Image ${index + 2} URL (optional)`}
                    />
                    {image && (
                      <img
                        src={image}
                        alt={`Gallery ${index + 2}`}
                        className="w-12 h-12 object-cover rounded-md border-2 border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
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
                Add Product
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                The product will be added to the store instantly — no manual file editing needed
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
          <h3 className="text-lg font-bold text-gray-900 mb-3">📋 What Happens Next:</h3>
          <ol className="space-y-2 text-gray-700">
            <li><strong>1.</strong> Your product is saved and goes live immediately</li>
            <li><strong>2.</strong> It will appear on Home (if featured later), Products, and search</li>
            <li><strong>3.</strong> Stock shown to customers is the total of every size/color you entered</li>
            <li><strong>4.</strong> Stock automatically decreases as customers place orders</li>
            <li><strong>5.</strong> You can add more products anytime from this same page</li>
            <li><strong>6.</strong> New categories or badges can be added from the Admin Dashboard</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
