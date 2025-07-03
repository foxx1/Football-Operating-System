import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X, Image } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept: string;
  value?: string;
  onChange: (filePath: string | null) => void;
  description?: string;
  className?: string;
}

export function FileUpload({ 
  label, 
  accept, 
  value, 
  onChange, 
  description,
  className = "" 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/single', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { filePath } = await response.json();
      setPreview(filePath);
      onChange(filePath);
    } catch (error) {
      console.error('Upload error:', error);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = preview && (preview.includes('.jpg') || preview.includes('.jpeg') || preview.includes('.png') || preview.includes('.gif'));

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {!preview ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${(label || 'default').replace(/\s+/g, '-').toLowerCase()}`}
          />
          <Label
            htmlFor={`file-upload-${(label || 'default').replace(/\s+/g, '-').toLowerCase()}`}
            className="cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </span>
            </div>
          </Label>
        </div>
      ) : (
        <div className="border rounded-lg p-3 flex items-center justify-between bg-muted/50">
          <div className="flex items-center space-x-3">
            {isImage ? (
              <div className="flex items-center space-x-3">
                <Image className="h-5 w-5 text-muted-foreground" />
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="h-12 w-12 object-cover rounded border"
                />
              </div>
            ) : (
              <File className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {preview.split('/').pop()}
              </p>
              <p className="text-xs text-muted-foreground">
                File uploaded successfully
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}