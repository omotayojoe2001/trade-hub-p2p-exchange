import React, { useState, useEffect } from 'react';
import { X, Camera, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  title = "Select Photo"
}) => {
  const [recentPhotos, setRecentPhotos] = useState<File[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecentPhotos();
    }
  }, [isOpen]);

  const loadRecentPhotos = async () => {
    try {
      setLoading(true);
      
      // Use File System Access API if available (modern browsers)
      if ('showDirectoryPicker' in window) {
        // For now, we'll use the input method but make it seamless
        return;
      }
      
      // Fallback: Create dummy recent photos for demo
      // In production, you'd integrate with device photo library
      const dummyPhotos: File[] = [];
      setRecentPhotos(dummyPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  const handleConfirm = () => {
    if (selectedPhoto) {
      onSelect(selectedPhoto);
      onClose();
      setSelectedPhoto(null);
    }
  };

  const handleTakePhoto = () => {
    // Trigger camera input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedPhoto(file);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end" style={{ paddingBottom: '80px' }}>
      <div className="bg-white w-full max-h-[70vh] rounded-t-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 pb-8 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleTakePhoto}
              className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Camera className="w-8 h-8 mb-2" />
              <span className="font-semibold">Take Photo</span>
            </Button>
            
            <label className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-2xl cursor-pointer shadow-lg transition-all duration-200 transform hover:scale-105">
              <Upload className="w-8 h-8 mb-2" />
              <span className="font-semibold">Choose File</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Photo Preview */}
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center border-2 border-green-200">
                      {selectedPhoto.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(selectedPhoto)}
                          alt="Selected"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{selectedPhoto.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="bg-green-600 rounded-full p-2">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Use This File
              </Button>
            </div>
          )}

          {/* Recent Photos Grid (when available) */}
          {recentPhotos.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Photos</h4>
              <div className="grid grid-cols-3 gap-2">
                {recentPhotos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                      selectedPhoto === photo ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Recent ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading photos...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && recentPhotos.length === 0 && !selectedPhoto && (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              </div>
              <p className="text-gray-600 text-lg font-medium">
                Take a photo or choose a file to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};