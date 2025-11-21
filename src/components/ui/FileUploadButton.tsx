import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InAppPhotoPicker } from './InAppPhotoPicker';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  title?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  selectedFile,
  title = "Select File",
  buttonText,
  variant = "outline",
  className = ""
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const displayText = buttonText || (selectedFile ? selectedFile.name : 'Choose File');

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setShowPicker(true)}
        className={`w-full ${className}`}
      >
        <Upload className="w-4 h-4 mr-2" />
        {displayText}
      </Button>
      
      <InAppPhotoPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(file) => {
          onFileSelect(file);
          setShowPicker(false);
        }}
        title={title}
      />
    </>
  );
};