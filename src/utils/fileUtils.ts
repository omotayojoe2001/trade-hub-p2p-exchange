/**
 * Utility functions for file handling
 */

/**
 * Determines if a URL points to a PDF file
 * @param url - The file URL to check
 * @returns true if the URL points to a PDF file
 */
export const isPdfFile = (url: string): boolean => {
  if (!url) return false;
  
  // Check file extension
  const extension = url.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return true;
  
  // Check if URL contains PDF in the path (for some storage systems)
  return url.toLowerCase().includes('.pdf');
};

/**
 * Determines if a URL points to an image file
 * @param url - The file URL to check
 * @returns true if the URL points to an image file
 */
export const isImageFile = (url: string): boolean => {
  if (!url) return false;
  
  const extension = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
};

/**
 * Gets the file type from a URL
 * @param url - The file URL to check
 * @returns 'pdf', 'image', or 'unknown'
 */
export const getFileType = (url: string): 'pdf' | 'image' | 'unknown' => {
  if (isPdfFile(url)) return 'pdf';
  if (isImageFile(url)) return 'image';
  return 'unknown';
};

/**
 * Downloads a file from a URL
 * @param url - The file URL to download
 * @param filename - Optional filename for the download
 */
export const downloadFile = (url: string, filename?: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || url.split('/').pop() || 'download';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
