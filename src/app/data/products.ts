// Product images - Using Unsplash for deployment compatibility
const jenikaImg = 'https://images.unsplash.com/photo-1757598079169-b8655dc3e933?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBldGhuaWMlMjBzdWl0JTIwc2Fsd2FyJTIwa2FtZWV6fGVufDF8fHx8MTc3Mzg0MTk5N3ww&ixlib=rb-4.1.0&q=80&w=1080';

export interface SizeStock {
  size: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  sizes: string[];
  colors?: string[];
  inStock: boolean;
  stock?: number;               // legacy total stock (fallback)
  sizeStock?: SizeStock[];      // per-size stock (new)
  featured?: boolean;
  badge?: string;
}

export const products: Product[] = [
  {
    "id": "1773907996913-cs2bybh",
    "name": "saree",
    "description": "children saree",
    "price": 500,
    "originalPrice": 500,
    "image": "https://juwtfhevkbfywawzzexn.supabase.co/storage/v1/object/public/make-e222e178-product-images/1773907996913-cs2bybh.jpeg",
    "images": [
      "https://juwtfhevkbfywawzzexn.supabase.co/storage/v1/object/public/make-e222e178-product-images/1773907996913-cs2bybh.jpeg"
    ],
    "category": "Sarees",
    "sizes": ["S", "XS", "M"],
    "inStock": true,
    "stock": 15,
    "sizeStock": [
      { "size": "XS", "quantity": 5 },
      { "size": "S", "quantity": 5 },
      { "size": "M", "quantity": 5 }
    ],
    "featured": false,
    "badge": "NEW"
  },
  {
    "id": "1777480829540-giydsil",
    "name": "saree",
    "description": "saree",
    "price": 1000,
    "originalPrice": 1500,
    "image": "https://cdn.phototourl.com/free/2026-04-29-77892ef3-8d8c-45b1-862e-32e32bd301a2.jpg",
    "images": [
      "https://cdn.phototourl.com/free/2026-04-29-77892ef3-8d8c-45b1-862e-32e32bd301a2.jpg"
    ],
    "category": "Sarees",
    "sizes": ["XS", "S", "M", "L", "XL"],
    "inStock": true,
    "stock": 20,
    "sizeStock": [
      { "size": "XS", "quantity": 4 },
      { "size": "S", "quantity": 4 },
      { "size": "M", "quantity": 4 },
      { "size": "L", "quantity": 4 },
      { "size": "XL", "quantity": 4 }
    ],
    "featured": false,
    "badge": "TRENDING"
  },
  {
    "id": "1776966559135-9giw08u",
    "name": "sarees",
    "description": "sae",
    "price": 500,
    "originalPrice": 1500,
    "image": "https://img.sanishtech.com/u/da6850686a037dbdc3c9459dba81aff7.jpeg",
    "images": [
      "https://img.sanishtech.com/u/da6850686a037dbdc3c9459dba81aff7.jpeg"
    ],
    "category": "Sarees",
    "sizes": ["S", "M"],
    "inStock": true,
    "stock": 20,
    "sizeStock": [
      { "size": "S", "quantity": 10 },
      { "size": "M", "quantity": 10 }
    ],
    "featured": false,
    "badge": "SALE"
  },
  {
    "id": "1781509314482-y2ppwdv",
    "name": "Cotton one piece",
    "description": "Cotton one piece Kurti",
    "price": 750,
    "originalPrice": 999,
    "image": "https://cdn.corenexis.com/f/x8pZsMx2qFr.jpeg",
    "images": [
      "https://cdn.corenexis.com/f/x8pZsMx2qFr.jpeg"
    ],
    "category": "Dresses",
    "sizes": ["S", "M", "XS", "L"],
    "inStock": true,
    "stock": 10,
    "sizeStock": [
      { "size": "XS", "quantity": 2 },
      { "size": "S", "quantity": 3 },
      { "size": "M", "quantity": 3 },
      { "size": "L", "quantity": 2 }
    ],
    "featured": false,
    "badge": "TRENDING"
  },
  {
    "id": "1781593024389-657oloi",
    "name": "Zeel Raincoat",
    "description": "JS201",
    "price": 1665,
    "originalPrice": 1849,
    "image": "https://cdn.corenexis.com/f/a62CHlUTqYq.jpeg",
    "images": [
      "https://cdn.corenexis.com/f/a62CHlUTqYq.jpeg",
      "https://cdn.corenexis.com/f/02p5Tqb8v0y.jpeg"
    ],
    "category": "Raincoat",
    "sizes": ["L", "XL", "XXL"],
    "inStock": true,
    "stock": 40,
    "sizeStock": [
      { "size": "L", "quantity": 15 },
      { "size": "XL", "quantity": 15 },
      { "size": "XXL", "quantity": 10 }
    ],
    "featured": false,
    "badge": "NEW"
  },
  {
    "id": "1781593590486-cfvcc8y",
    "name": "Zeel Raincoat",
    "description": "JS201 (Orange-blue)",
    "price": 1665,
    "originalPrice": 1849,
    "image": "https://cdn.corenexis.com/f/sodBddkf6JP.jpeg",
    "images": [
      "https://cdn.corenexis.com/f/sodBddkf6JP.jpeg",
      "https://cdn.corenexis.com/f/QO7XXUMvZAz.jpeg"
    ],
    "category": "Raincoat",
    "sizes": ["L", "XL", "XXL"],
    "inStock": true,
    "stock": 40,
    "sizeStock": [
      { "size": "L", "quantity": 15 },
      { "size": "XL", "quantity": 15 },
      { "size": "XXL", "quantity": 10 }
    ],
    "featured": false,
    "badge": "NEW"
  },
  {
    "id": "1782547347604-0fvdysr",
    "name": "zeel raincoat new ",
    "description": "green r",
    "price": 1650,
    "originalPrice": 1950,
    "image": "https://zeelretail.com/cdn/shop/files/Zeel-Mens-Neon-Green-Rainsuit-Zeelretail-9233012.jpg?v=1716038438&width=1080",
    "images": [
      "https://zeelretail.com/cdn/shop/files/Zeel-Mens-Neon-Green-Rainsuit-Zeelretail-9233012.jpg?v=1716038438&width=1080",
      "https://zeelretail.com/cdn/shop/files/Zeel-Mens-Neon-Green-Rainsuit-Zeelretail-9232468_1200x1200.jpg?v=1716038441",
      "https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/2/d/2da4ed3AZ18GRNRAINSUIT_1.jpg"
    ],
    "category": "Raincoat",
    "sizes": [
      "L",
      "XL",
      "XXL"
    ],
    "colors": [
      "green"
    ],
    "inStock": true,
    "stock": 25,
    "sizeStock": [
      {
        "size": "L",
        "quantity": 10
      },
      {
        "size": "XL",
        "quantity": 10
      },
      {
        "size": "XXL",
        "quantity": 5
      }
    ],
    "featured": false,
    "badge": "SALE"
  }
];

export const categories = [
  'All',
  'Dresses',
  'Shirts',
  'T-Shirts',
  'Outerwear',
  'Accessories',
  'Bottoms',
  'Raincoat',
  'Sarees',
];
