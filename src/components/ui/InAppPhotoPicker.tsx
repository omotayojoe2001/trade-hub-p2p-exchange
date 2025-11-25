import React from 'react';
import { X, Camera, Upload } from 'lucide-react';

interface InAppPhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: File) => void;
  title?: string;
}

export const InAppPhotoPicker: React.FC<InAppPhotoPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Upload Payment Proof"
}) => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelect(file);
      onClose();
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onSelect(file);
        onClose();
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end" style={{ paddingBottom: '80px' }}>
      <div className="bg-white w-full rounded-t-2xl p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3 pb-4">
          <button
            onClick={handleCameraCapture}
            className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Camera size={20} />
            Take Photo
          </button>
          
          <label className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload size={20} />
            Choose from Gallery
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};