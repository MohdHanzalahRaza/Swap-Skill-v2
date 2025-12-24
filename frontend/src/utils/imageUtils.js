/**
 * Resolves the correct URL for a user avatar.
 * Handles:
 * 1. External URLs (Cloudinary, Google, etc.)
 * 2. Local backend paths (/uploads/...)
 * 3. Fallbacks
 */
export const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;

    // If it's already a full URL (http:// or https://), return as is
    if (avatarPath.startsWith('http')) {
        return avatarPath;
    }

    // If it's a local path from the backend
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}${avatarPath}`;
};
