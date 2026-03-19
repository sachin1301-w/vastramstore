# 📸 VASTRAM - Product Image Guide

## Quick Reference for Adding Product Images

### Method 1: Using Admin Panel (EASIEST) ⭐

1. **Login to Admin:**
   - URL: Your website → `/admin/dashboard`
   - Email: `vastram.pune2026@gmail.com`
   - Password: `123456`

2. **Add Product:**
   - Click "Add Product" button
   - Fill all details
   - For images, use one of these formats:

#### Image URL Formats Supported:

**A) Unsplash Images (Free Stock Photos):**
```
https://images.unsplash.com/photo-XXXXXXXXX?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=...
```

**B) Figma Asset Images (Your Uploaded Images):**
```
figma:asset/c476246d08c03e059bf273475d93d05327762e01.png
```

**C) Direct URLs (Any website):**
```
https://example.com/image.jpg
```

3. **Generate Code:**
   - Click "Generate Product Code"
   - Code is auto-copied to clipboard

4. **Add to Products File:**
   - Open: `/src/app/data/products.ts`
   - Scroll to end of products array (before the `];`)
   - Paste the code
   - Add comma after previous product
   - Save file

---

### Method 2: Manual File Editing

**File Location:** `/src/app/data/products.ts`

**Template:**
```typescript
{
  id: '18', // Unique ID (increment from last product)
  name: 'Product Name',
  description: 'Detailed product description',
  price: 1999,
  originalPrice: 2999, // Optional - for showing discount
  image: 'IMAGE_URL_HERE', // Main thumbnail image
  images: [
    'IMAGE_URL_HERE', // Same as main
    'IMAGE_URL_2',    // Additional images (optional)
    'IMAGE_URL_3',    // Additional images (optional)
  ],
  category: 'Dresses', // Dresses, Shirts, T-Shirts, Outerwear, Accessories, Bottoms
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  inStock: true,
  featured: true, // Show on homepage
  badge: 'NEW', // Optional: NEW, SALE, TRENDING, HOT
},
```

---

### Method 3: Request Images from AI Assistant

Just ask me! Examples:
- "Add an image of pink ethnic dress"
- "I need images for 5 sarees"
- "Get me a photo of traditional jewelry"

I'll fetch the images from Unsplash and add them for you!

---

### Method 4: Upload Your Own Images via Figma

1. Take product photos
2. Upload to Figma
3. Attach to chat with me
4. I'll convert them to `figma:asset` URLs
5. Add to your products

---

## 🎨 Image Best Practices

### Recommended Image Specs:
- **Size:** 1080px width minimum
- **Format:** JPG or PNG
- **Aspect Ratio:** Square (1:1) or Portrait (3:4)
- **Quality:** High resolution, well-lit

### Tips:
✅ Use white or plain background
✅ Show product clearly
✅ Multiple angles (front, back, side, details)
✅ Consistent lighting across all product images
✅ High resolution for zoom functionality

---

## 📝 Example Products with Images

### Example 1: Unsplash Image
```typescript
{
  id: '20',
  name: 'Beautiful Red Saree',
  description: 'Traditional red saree with golden border',
  price: 3499,
  originalPrice: 4999,
  image: 'https://images.unsplash.com/photo-XXXXX...',
  images: [
    'https://images.unsplash.com/photo-XXXXX...',
  ],
  category: 'Dresses',
  sizes: ['One Size'],
  inStock: true,
  featured: true,
  badge: 'NEW',
}
```

### Example 2: Figma Asset
```typescript
{
  id: '21',
  name: 'KAASHVI JENIKA Orange Suit',
  description: 'Ethnic suit with embroidery',
  price: 2299,
  originalPrice: 3499,
  image: 'figma:asset/c476246d08c03e059bf273475d93d05327762e01.png',
  images: [
    'figma:asset/c476246d08c03e059bf273475d93d05327762e01.png',
  ],
  category: 'Dresses',
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  inStock: true,
  featured: true,
  badge: 'NEW',
}
```

### Example 3: Multiple Images
```typescript
{
  id: '22',
  name: 'Designer Lehenga',
  description: 'Beautiful designer lehenga for weddings',
  price: 8999,
  originalPrice: 12999,
  image: 'figma:asset/main.png',
  images: [
    'figma:asset/main.png',        // Front view
    'figma:asset/back.png',        // Back view
    'figma:asset/side.png',        // Side view
    'figma:asset/detail.png',      // Embroidery detail
    'figma:asset/dupatta.png',     // Dupatta closeup
  ],
  category: 'Dresses',
  sizes: ['S', 'M', 'L', 'XL'],
  inStock: true,
  featured: true,
  badge: 'TRENDING',
}
```

---

## 🚀 Quick Actions

### Need Help?
Just tell me:
1. **"Add image for [product type]"** - I'll fetch from Unsplash
2. **Upload image here** - I'll convert to figma:asset URL
3. **"Create product with image"** - I'll do it all for you

### Current Product Count: 14
### Next Available ID: 18

---

## 📞 Contact for Help
If you need assistance adding images, just ask! I'm here to help! 😊
