import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for backend operations (deletion, management)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Extracts the file path from a Supabase public URL
 * @param url The full public URL
 * @returns The path within the bucket
 */
const extractPathFromUrl = (url: string): string | null => {
  try {
    // Expected format: .../storage/v1/object/public/bucket-name/filename.jpg
    const parts = url.split('/public/');
    if (parts.length < 2) return null;
    
    const pathParts = parts[1].split('/');
    pathParts.shift(); // Remove bucket name
    return pathParts.join('/');
  } catch (error) {
    return null;
  }
};

/**
 * Deletes a file from Supabase storage using its public URL
 * @param url Public URL of the file
 * @param bucketName Bucket name
 */
export const deleteFileByUrl = async (url: string | null | undefined, bucketName: string): Promise<void> => {
  if (!url) return;
  
  const path = extractPathFromUrl(url);
  if (!path) return;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([path]);
      
    if (error) {
      // If error is not a "not found" error, we should throw it
      // Supabase remove returns an empty array if file wasn't found, which is fine
      if (data && (data as any).length === 0) {
          console.log(`File already missing from storage: ${path}`);
          return;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error deleting storage file: ${url}`, error);
    throw error;
  }
};
