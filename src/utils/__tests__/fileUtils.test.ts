import { isPdfFile, isImageFile, getFileType } from '../fileUtils';

describe('fileUtils', () => {
  describe('isPdfFile', () => {
    it('should detect PDF files by extension', () => {
      expect(isPdfFile('https://example.com/file.pdf')).toBe(true);
      expect(isPdfFile('https://example.com/path/file.PDF')).toBe(true);
      expect(isPdfFile('https://example.com/path/file.Pdf')).toBe(true);
    });

    it('should detect PDF files by path', () => {
      expect(isPdfFile('https://example.com/path/file.pdf')).toBe(true);
      expect(isPdfFile('https://storage.com/bucket/file.pdf')).toBe(true);
    });

    it('should return false for non-PDF files', () => {
      expect(isPdfFile('https://example.com/file.jpg')).toBe(false);
      expect(isPdfFile('https://example.com/file.png')).toBe(false);
      expect(isPdfFile('https://example.com/file')).toBe(false);
      expect(isPdfFile('')).toBe(false);
    });
  });

  describe('isImageFile', () => {
    it('should detect image files by extension', () => {
      expect(isImageFile('https://example.com/file.jpg')).toBe(true);
      expect(isImageFile('https://example.com/file.jpeg')).toBe(true);
      expect(isImageFile('https://example.com/file.png')).toBe(true);
      expect(isImageFile('https://example.com/file.gif')).toBe(true);
      expect(isImageFile('https://example.com/file.webp')).toBe(true);
      expect(isImageFile('https://example.com/file.svg')).toBe(true);
    });

    it('should handle case insensitive extensions', () => {
      expect(isImageFile('https://example.com/file.JPG')).toBe(true);
      expect(isImageFile('https://example.com/file.PNG')).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImageFile('https://example.com/file.pdf')).toBe(false);
      expect(isImageFile('https://example.com/file.txt')).toBe(false);
      expect(isImageFile('https://example.com/file')).toBe(false);
      expect(isImageFile('')).toBe(false);
    });
  });

  describe('getFileType', () => {
    it('should return correct file types', () => {
      expect(getFileType('https://example.com/file.pdf')).toBe('pdf');
      expect(getFileType('https://example.com/file.jpg')).toBe('image');
      expect(getFileType('https://example.com/file.png')).toBe('image');
      expect(getFileType('https://example.com/file.txt')).toBe('unknown');
      expect(getFileType('')).toBe('unknown');
    });
  });
});
