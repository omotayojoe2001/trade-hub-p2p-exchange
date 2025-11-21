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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[80vh] rounded-t-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleTakePhoto}
              className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Camera className="w-5 h-5 mr-2" />
              Take Photo
            </Button>
            
            <label className="flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              Choose File
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
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {selectedPhoto.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(selectedPhoto)}
                          alt="Selected"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Upload className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedPhoto.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
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
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Take a photo or choose a file to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};