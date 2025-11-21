import { useState } from 'react';

export const useInAppPhotoPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const openPicker = () => setIsOpen(true);
  const closePicker = () => setIsOpen(false);
  
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsOpen(false);
  };

  const clearSelection = () => setSelectedFile(null);

  return {
    isOpen,
    selectedFile,
    openPicker,
    closePicker,
    handleFileSelect,
    clearSelection
  };
};