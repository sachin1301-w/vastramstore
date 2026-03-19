import { useState } from 'react';
import { supabase } from '/utils/supabase/client';
import { Button } from '../components/ui/button';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

const BUCKET_NAME = 'make-e222e178-product-images';

export function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const createBucketIfNotExists = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
        
        if (error) {
          console.error('Error creating bucket:', error);
          setError('Failed to create storage bucket. Please check admin permissions.');
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Bucket creation error:', err);
      setError('Error checking/creating bucket');
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    const urls: string[] = [];

    // Create bucket first
    const bucketReady = await createBucketIfNotExists();
    if (!bucketReady) {
      setUploading(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${i}.${fileExt}`;
      const filePath = fileName;

      try {
        // Upload file
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setError(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        if (data.publicUrl) {
          urls.push(data.publicUrl);
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        setError(`Error uploading ${file.name}`);
      }
    }

    setUploadedUrls(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const copyAllUrls = () => {
    const allUrls = uploadedUrls.join('\n');
    navigator.clipboard.writeText(allUrls);
    alert('All URLs copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Upload Product Images to Supabase
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Select all your original product images</li>
              <li>Click "Upload Images" button</li>
              <li>Copy the generated URLs</li>
              <li>Replace the Unsplash URLs in products.ts with these URLs</li>
            </ol>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block mb-4">
              <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-amber-400 focus:outline-none">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="font-medium text-gray-600">
                    {uploading ? 'Uploading...' : 'Click to select images'}
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, JPEG (max 5MB each)
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {uploadedUrls.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="text-green-600" />
                  Uploaded Images ({uploadedUrls.length})
                </h3>
                <Button onClick={copyAllUrls} variant="outline" size="sm">
                  Copy All URLs
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uploadedUrls.map((url, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded border">
                    <img 
                      src={url} 
                      alt={`Uploaded ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 font-mono break-all">{url}</p>
                    </div>
                    <Button 
                      onClick={() => copyToClipboard(url)}
                      variant="ghost"
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Next Steps:</h4>
                <p className="text-sm text-green-800">
                  Now go to <code className="bg-green-100 px-2 py-1 rounded">/src/app/data/products.ts</code> and replace the Unsplash URLs with these Supabase URLs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}