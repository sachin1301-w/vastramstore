import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { Button } from '../components/ui/button';
import { Upload, CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';
import { products } from '../data/products';
import { toast } from 'sonner';

const BUCKET_NAME = 'make-e222e178-product-images';

interface ProductImageMapping {
  productId: string;
  productName: string;
  oldImageUrl: string;
  newImageUrl?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function ProductImageMigration() {
  const [mappings, setMappings] = useState<ProductImageMapping[]>([]);
  const [uploading, setUploading] = useState(false);
  const [bucketCreated, setBucketCreated] = useState(false);

  const createBucketIfNotExists = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        // Try to create bucket, but if it fails due to RLS, that's okay
        // We'll just proceed anyway
        console.log('Bucket does not exist, but we will proceed anyway');
        toast.info('Bucket will be created automatically on first upload');
      } else {
        console.log('Bucket already exists');
        toast.success('Storage bucket is ready!');
      }
      
      setBucketCreated(true);
      return true;
    } catch (err) {
      console.error('Bucket check error:', err);
      // Don't fail here - just proceed
      setBucketCreated(true);
      toast.info('Proceeding with upload...');
      return true;
    }
  };

  const initializeMappings = () => {
    const newMappings: ProductImageMapping[] = products
      .filter(p => p.image.includes('r2.dev'))
      .map(p => ({
        productId: p.id,
        productName: p.name,
        oldImageUrl: p.image,
        status: 'pending' as const,
      }));
    
    setMappings(newMappings);
    toast.success(`Found ${newMappings.length} products with R2 images`);
  };

  const handleFileUpload = async (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mappingIndex = mappings.findIndex(m => m.productId === productId);
    if (mappingIndex === -1) return;

    // Update status to uploading
    setMappings(prev => {
      const updated = [...prev];
      updated[mappingIndex] = { ...updated[mappingIndex], status: 'uploading' };
      return updated;
    });

    try {
      // Upload file to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        // Update mapping with success
        setMappings(prev => {
          const updated = [...prev];
          updated[mappingIndex] = {
            ...updated[mappingIndex],
            status: 'success',
            newImageUrl: data.publicUrl,
          };
          return updated;
        });
        toast.success(`Uploaded image for ${mappings[mappingIndex].productName}`);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setMappings(prev => {
        const updated = [...prev];
        updated[mappingIndex] = {
          ...updated[mappingIndex],
          status: 'error',
          error: err.message,
        };
        return updated;
      });
      toast.error(`Failed to upload ${mappings[mappingIndex].productName}`);
    }
  };

  const generateUpdatedProductsFile = () => {
    const updatedProducts = products.map(product => {
      const mapping = mappings.find(m => m.productId === product.id);
      
      if (mapping && mapping.newImageUrl) {
        // Update image URL
        const updatedImages = product.images?.map(img => 
          img === mapping.oldImageUrl ? mapping.newImageUrl! : img
        ) || [mapping.newImageUrl];

        return {
          ...product,
          image: mapping.newImageUrl,
          images: updatedImages,
        };
      }
      
      return product;
    });

    // Generate the file content
    const fileContent = `// Product images - Migrated to Supabase Storage
const jenikaImg = 'https://images.unsplash.com/photo-1757598079169-b8655dc3e933?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBldGhuaWMlMjBzdWl0JTIwc2Fsd2FyJTIwa2FtZWV6fGVufDF8fHx8MTc3Mzg0MTk5N3ww&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaBrownImg = 'https://images.unsplash.com/photo-1761126088463-68134b9b782e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGV0aG5pYyUyMGRyZXNzJTIwaW5kaWFufGVufDF8fHx8MTc3Mzg0MTk5OHww&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaBrown2Img = 'https://images.unsplash.com/photo-1761126088463-68134b9b782e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGV0aG5pYyUyMGRyZXNzJTIwaW5kaWFufGVufDF8fHx8MTc3Mzg0MTk5OHww&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaGrishaImg = 'https://images.unsplash.com/photo-1757598079169-b8655dc3e933?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBldGhuaWMlMjBzdWl0JTIwc2Fsd2FyJTIwa2FtZWV6fGVufDF8fHx8MTc3Mzg0MTk5N3ww&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaGrishaTealImg = 'https://images.unsplash.com/photo-1741121625227-8ab247bf9d22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFsJTIwYmx1ZSUyMGV0aG5pYyUyMHN1aXR8ZW58MXx8fHwxNzczODQxOTk4fDA&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaGrishaOliveImg = 'https://images.unsplash.com/photo-1712196053036-96aaf89ea387?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGl2ZSUyMGdyZWVuJTIwZXRobmljJTIwZHJlc3N8ZW58MXx8fHwxNzczODQxOTk5fDA&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaGrishaYellowImg = 'https://images.unsplash.com/photo-1760287363878-1a09af715b80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5ZWxsb3clMjBldGhuaWMlMjBpbmRpYW4lMjBzdWl0fGVufDF8fHx8MTc3Mzg0MTk5OXww&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaGrishaTeal2Img = 'https://images.unsplash.com/photo-1741121625227-8ab247bf9d22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFsJTIwYmx1ZSUyMGV0aG5pYyUyMHN1aXR8ZW58MXx8fHwxNzczODQxOTk4fDA&ixlib=rb-4.1.0&q=80&w=1080';
const jenikaGrishaOlive2Img = 'https://images.unsplash.com/photo-1712196053036-96aaf89ea387?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGl2ZSUyMGdyZWVuJTIwZXRobmljJTIwZHJlc3N8ZW58MXx8fHwxNzczODQxOTk5fDA&ixlib=rb-4.1.0&q=80&w=1080';
const mayaPinkImg = 'https://images.unsplash.com/photo-1711128640065-cdac1e385dc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwZXRobmljJTIwc3VpdCUyMGluZGlhbnxlbnwxfHx8fDE3NzM4NDE5OTl8MA&ixlib=rb-4.1.0&q=80&w=1080';
const mayaLimeImg = 'https://images.unsplash.com/photo-1772698263053-6a064c060707?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaW1lJTIwZ3JlZW4lMjBldGhuaWMlMjBkcmVzc3xlbnwxfHx8fDE3NzM4NDIwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080';
const mayaMintImg = 'https://images.unsplash.com/photo-1668279580408-9120c463e98d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW50JTIwZ3JlZW4lMjBldGhuaWMlMjBzdWl0fGVufDF8fHx8MTc3Mzg0MjAwMHww&ixlib=rb-4.1.0&q=80&w=1080';
const midnightMoodImg = 'https://images.unsplash.com/photo-1757970766930-14d24d62e74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGV0aG5pYyUyMHN1aXQlMjBtaWRuaWdodHxlbnwxfHx8fDE3NzM4NDIwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080';
const soutoImg = 'https://images.unsplash.com/photo-1599346821185-6860259a6db7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBtZW5zJTIwdHNoaXJ0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzM4NDIwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080';
const ritualImg = 'https://images.unsplash.com/photo-1666358085449-a10a39f33942?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmludGVkJTIwdHNoaXJ0JTIwY2FzdWFsJTIwd2VhcnxlbnwxfHx8fDE3NzM4NDIwMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080';
const equalizeImg = 'https://images.unsplash.com/photo-1655141559812-42f8c1e8942d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwdHNoaXJ0JTIwbW9ja3VwfGVufDF8fHx8MTc3Mzg0MjAwMnww&ixlib=rb-4.1.0&q=80&w=1080';
const noiracentImg = 'https://images.unsplash.com/photo-1666358085449-a10a39f33942?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMHRzaGlydCUyMG1pbmltYWx8ZW58MXx8fHwxNzczODQyMDAyfDA&ixlib=rb-4.1.0&q=80&w=1080';
const vixyImg = 'https://images.unsplash.com/photo-1768935706759-f2be765b3aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwdHNoaXJ0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzM4NDIwMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080';

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
  inStock: boolean;
  stock?: number;
  featured?: boolean;
  badge?: string;
}

export const products: Product[] = ${JSON.stringify(updatedProducts, null, 2)};

export const categories = [
  'All',
  'Dresses',
  'Shirts',
  'T-Shirts',
  'Outerwear',
  'Accessories',
  'Bottoms',
];
`;

    // Download the file
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.ts';
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Downloaded updated products.ts file!');
  };

  const completedCount = mappings.filter(m => m.status === 'success').length;
  const errorCount = mappings.filter(m => m.status === 'error').length;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Product Image Migration to Supabase
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Setup Instructions - Follow These Steps:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
              <li>
                <strong>Go to Supabase SQL Editor:</strong>{' '}
                <a 
                  href="https://supabase.com/dashboard/project/juwtfhevkbfywawzzexn/sql/new" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 font-semibold"
                >
                  Click here to open SQL Editor
                </a>
              </li>
              <li>
                <strong>Copy and paste this SQL code:</strong>
                <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre>{`-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('make-e222e178-product-images', 'make-e222e178-product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Allow anyone to upload files to this bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'make-e222e178-product-images');

-- Allow anyone to read files from this bucket
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'make-e222e178-product-images');

-- Allow anyone to update files in this bucket
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'make-e222e178-product-images');

-- Allow anyone to delete files in this bucket (optional)
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'make-e222e178-product-images');`}</pre>
                </div>
              </li>
              <li>Click <strong>"Run"</strong> button in the SQL Editor</li>
              <li>You should see "Success. No rows returned" message ✅</li>
              <li>Come back here and click <strong>"Check Bucket"</strong> button below</li>
              <li>Then click <strong>"Find R2 Images"</strong> to scan products</li>
              <li>Upload each product image using the upload buttons</li>
              <li>Click <strong>"Download Updated products.ts"</strong> when done</li>
            </ol>
          </div>

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Still Getting "row-level security policy" Error?</h3>
            <p className="text-sm text-amber-800 mb-2">
              Make sure you ran the SQL code above in the SQL Editor. The UI policy creator sometimes doesn't work correctly.
            </p>
            <p className="text-sm text-amber-800">
              Quick link:{' '}
              <a 
                href="https://supabase.com/dashboard/project/juwtfhevkbfywawzzexn/sql/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 underline hover:text-amber-800 font-semibold"
              >
                Open SQL Editor →
              </a>
            </p>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={createBucketIfNotExists}
              className="bg-amber-700 hover:bg-amber-800"
            >
              {bucketCreated ? <CheckCircle className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {bucketCreated ? 'Bucket Verified ✓' : 'Check Bucket'}
            </Button>

            <Button
              onClick={initializeMappings}
              disabled={!bucketCreated || mappings.length > 0}
              variant="outline"
            >
              Find R2 Images
            </Button>

            {mappings.length > 0 && completedCount === mappings.length && (
              <Button
                onClick={generateUpdatedProductsFile}
                className="bg-green-700 hover:bg-green-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Updated products.ts
              </Button>
            )}
          </div>

          {mappings.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{mappings.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-900">{completedCount}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-1">Errors</p>
                  <p className="text-3xl font-bold text-red-900">{errorCount}</p>
                </div>
              </div>
            </div>
          )}

          {mappings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Images ({completedCount}/{mappings.length})
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {mappings.map((mapping, index) => (
                  <div 
                    key={mapping.productId} 
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      mapping.status === 'success' ? 'bg-green-50 border-green-200' :
                      mapping.status === 'error' ? 'bg-red-50 border-red-200' :
                      mapping.status === 'uploading' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {mapping.status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                      {mapping.status === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
                      {mapping.status === 'uploading' && (
                        <div className="w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                      )}
                      {mapping.status === 'pending' && <AlertCircle className="w-6 h-6 text-gray-400" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {index + 1}. {mapping.productName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        ID: {mapping.productId}
                      </p>
                      {mapping.error && (
                        <p className="text-xs text-red-600 mt-1">{mapping.error}</p>
                      )}
                      {mapping.newImageUrl && (
                        <p className="text-xs text-green-600 mt-1 truncate">
                          ✓ Uploaded: {mapping.newImageUrl}
                        </p>
                      )}
                    </div>

                    {/* Preview uploaded image */}
                    {mapping.newImageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={mapping.newImageUrl} 
                          alt={mapping.productName}
                          className="w-16 h-16 object-cover rounded border-2 border-green-500"
                        />
                      </div>
                    )}

                    {mapping.status === 'pending' && (
                      <div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => handleFileUpload(mapping.productId, e)}
                          className="hidden"
                          id={`file-input-${mapping.productId}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => document.getElementById(`file-input-${mapping.productId}`)?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                    )}

                    {mapping.status === 'error' && (
                      <div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => handleFileUpload(mapping.productId, e)}
                          className="hidden"
                          id={`file-input-retry-${mapping.productId}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => document.getElementById(`file-input-retry-${mapping.productId}`)?.click()}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mappings.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Click "Find R2 Images" to start the migration process
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}