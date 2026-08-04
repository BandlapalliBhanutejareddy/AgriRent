"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileByUrl = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Admin client for backend operations (deletion, management)
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
/**
 * Extracts the file path from a Supabase public URL
 * @param url The full public URL
 * @returns The path within the bucket
 */
const extractPathFromUrl = (url) => {
    try {
        // Expected format: .../storage/v1/object/public/bucket-name/filename.jpg
        const parts = url.split('/public/');
        if (parts.length < 2)
            return null;
        const pathParts = parts[1].split('/');
        pathParts.shift(); // Remove bucket name
        return pathParts.join('/');
    }
    catch (error) {
        return null;
    }
};
/**
 * Deletes a file from Supabase storage using its public URL
 * @param url Public URL of the file
 * @param bucketName Bucket name
 */
const deleteFileByUrl = (url, bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    if (!url)
        return;
    const path = extractPathFromUrl(url);
    if (!path)
        return;
    try {
        const { data, error } = yield supabaseAdmin.storage
            .from(bucketName)
            .remove([path]);
        if (error) {
            // If error is not a "not found" error, we should throw it
            // Supabase remove returns an empty array if file wasn't found, which is fine
            if (data && data.length === 0) {
                console.log(`File already missing from storage: ${path}`);
                return;
            }
            throw error;
        }
    }
    catch (error) {
        console.error(`Error deleting storage file: ${url}`, error);
        throw error;
    }
});
exports.deleteFileByUrl = deleteFileByUrl;
