import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, File as FileIcon, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef<{ active: boolean; startX: number; startY: number; initialX: number; initialY: number }>({ active: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropBoxRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Read file as data URL and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setRawImage(result);
      setCropOpen(true);
      // reset zoom/offset
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = preview && (preview.includes('.jpg') || preview.includes('.jpeg') || preview.includes('.png') || preview.includes('.gif') || preview.startsWith('data:'));

  useEffect(() => {
    // if external value changed, update preview
    setPreview(value || null);
  }, [value]);

  const startDrag = (e: React.PointerEvent) => {
    if (!imgRef.current) return;
    draggingRef.current.active = true;
    draggingRef.current.startX = e.clientX;
    draggingRef.current.startY = e.clientY;
    draggingRef.current.initialX = offset.x;
    draggingRef.current.initialY = offset.y;
    (e.target as Element).setPointerCapture((e as any).pointerId);
  };

  const onDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current.active) return;
    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;
    setOffset({ x: draggingRef.current.initialX + dx, y: draggingRef.current.initialY + dy });
  };

  const endDrag = (e: React.PointerEvent) => {
    draggingRef.current.active = false;
    try { (e.target as Element).releasePointerCapture((e as any).pointerId); } catch {}
  };

  const applyCrop = async () => {
    if (!rawImage || !imgRef.current || !cropBoxRef.current) return;

    // Measure the already-rendered, already-zoomed/panned image directly so the
    // exported crop matches exactly what's visible in the circular preview,
    // instead of re-deriving the object-cover + zoom math (which drifts for
    // any image whose natural size isn't already ~square).
    const boxRect = cropBoxRef.current.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();

    const size = 300; // output square size
    const scale = size / boxRect.width;

    const drawX = (imgRect.left - boxRect.left) * scale;
    const drawY = (imgRect.top - boxRect.top) * scale;
    const drawW = imgRect.width * scale;
    const drawH = imgRect.height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill transparent
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // create circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    ctx.restore();

    // convert to blob and upload
    const dataUrl = canvas.toDataURL('image/png');
    try {
      setUploading(true);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'avatar.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/single', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const { filePath } = await response.json();
      setPreview(filePath);
      onChange(filePath);
      setCropOpen(false);
      setRawImage(null);
    } catch (err) {
      console.error('Crop upload error', err);
      toast({
        title: 'Upload failed',
        description: 'Could not upload the profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

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
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="h-12 w-12 object-cover rounded-full border"
                />
              </div>
            ) : (
              <FileIcon className="h-5 w-5 text-muted-foreground" />
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                // allow re-cropping existing preview by loading image
                setRawImage(preview);
                setCropOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop profile picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 items-center">
            <div ref={cropBoxRef} className="w-72 h-72 bg-black/5 rounded-full overflow-hidden relative">
              {rawImage && (
                // image is positioned via transform based on offset and zoom
                <img
                  ref={imgRef}
                  src={rawImage}
                  alt="To crop"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    cursor: 'grab',
                  }}
                  onPointerDown={startDrag}
                  onPointerMove={onDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  draggable={false}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-5/6 h-5/6 rounded-full border-2 border-white/80 shadow-inner"></div>
              </div>
            </div>

            <div className="w-full px-4">
              <label className="text-xs text-muted-foreground">Zoom</label>
              <input type="range" min={0.5} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full" />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { setCropOpen(false); setRawImage(null); }} variant="outline">Cancel</Button>
              <Button onClick={applyCrop} disabled={uploading}>{uploading ? 'Saving...' : 'Apply'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}