import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Image, Paintbrush, FolderOpen, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainingImageUploadProps {
  onImageSelect?: (imageUrl: string, imageType: string, imageName: string) => void;
  onChange?: (value: { url: string; type: string; name: string }) => void;
  value?: {
    url: string;
    type: string;
    name: string;
  };
  currentImage?: {
    url: string;
    type: string;
    name: string;
  };
}

export default function TrainingImageUpload({ onImageSelect, onChange, value, currentImage }: TrainingImageUploadProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("library");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Helper function to handle image selection with both prop patterns
  const handleImageSelect = (url: string, type: string, name: string) => {
    if (onImageSelect) {
      onImageSelect(url, type, name);
    }
    if (onChange) {
      onChange({ url, type, name });
    }
    setUploadDialogOpen(false);
  };

  // Mock tactical board library images - in production, these would come from saved tactical board creations
  const libraryImages = [
    {
      id: 1,
      name: "4-4-2 Formation Setup",
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxsaW5lIHgxPSIyMDAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMzAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij40LTQtMjwvdGV4dD4KPC9zdmc+",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxsaW5lIHgxPSIyMDAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMzAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij40LTQtMjwvdGV4dD4KPC9zdmc+",
      type: "formation",
      description: "Basic 4-4-2 formation with player positions"
    },
    {
      id: 2,
      name: "Attacking Drill - Wing Play",
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxwYXRoIGQ9Ik01MCAyNTBMMTAwIDE1MEwxNTAgMjUwTDMwMCAxNTBMMzUwIDEwMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSIyNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTUwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjI1MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMzUwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjkwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5XaW5nIEF0dGFjazwvdGV4dD4KPC9zdmc+",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxwYXRoIGQ9Ik01MCAyNTBMMTAwIDE1MEwxNTAgMjUwTDMwMCAxNTBMMzUwIDEwMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSIyNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTUwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjI1MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMzUwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjkwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5XaW5nIEF0dGFjazwvdGV4dD4KPC9zdmc+",
      type: "drill",
      description: "Wing play attacking drill with movement patterns"
    },
    {
      id: 3,
      name: "Defensive Shape - Compact",
      url: "/api/placeholder/400/300",
      thumbnail: "/api/placeholder/150/100",
      type: "tactical",
      description: "Compact defensive shape with pressing triggers"
    },
    {
      id: 4,
      name: "Set Piece - Corner Kick",
      url: "/api/placeholder/400/300",
      thumbnail: "/api/placeholder/150/100",
      type: "set_piece",
      description: "Corner kick routine with player runs"
    },
    {
      id: 5,
      name: "Passing Drill - Triangle",
      url: "/api/placeholder/400/300",
      thumbnail: "/api/placeholder/150/100",
      type: "drill",
      description: "Triangle passing drill with movement"
    },
    {
      id: 6,
      name: "Goalkeeper Training Setup",
      url: "/api/placeholder/400/300",
      thumbnail: "/api/placeholder/150/100",
      type: "gk_training",
      description: "Goalkeeper training setup with cones and equipment"
    }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'training_image');

      const response = await fetch('/api/upload/single', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      onImageSelect(data.filePath, 'upload', file.name);
      setUploadDialogOpen(false);
      
      toast({
        title: "Image uploaded successfully",
        description: "Training image has been added to your session",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLibrarySelect = (image: typeof libraryImages[0]) => {
    handleImageSelect(image.url, 'library', image.name);
    toast({
      title: "Image selected",
      description: `${image.name} has been added to your training session`,
    });
  };

  const handleCreateNew = () => {
    // Navigate to tactical board with training context
    const tacticalBoardUrl = `/tactics?mode=training&returnTo=${encodeURIComponent(window.location.pathname)}`;
    window.open(tacticalBoardUrl, '_blank');
    setUploadDialogOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'formation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'drill':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'tactical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'set_piece':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'gk_training':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get current image from value prop or fallback to currentImage
  const displayImage = value?.url ? value : currentImage;

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {displayImage && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 bg-background rounded overflow-hidden">
              <img 
                src={displayImage.url} 
                alt={displayImage.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium">{displayImage.name}</p>
              <Badge variant="outline" className="text-xs">
                {displayImage.type}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleImageSelect("", "", "")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Training Image</Label>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Image className="w-4 h-4 mr-2" />
              {displayImage ? 'Change Image' : 'Add Image'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Training Image</DialogTitle>
            </DialogHeader>
            
            <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4" />
                  Create New
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="library" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Choose from your saved tactical board creations
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {libraryImages.map((image) => (
                    <Card key={image.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={image.thumbnail} 
                            alt={image.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{image.name}</h4>
                            <Badge variant="outline" className={getTypeColor(image.type)}>
                              {image.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{image.description}</p>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleLibrarySelect(image)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Upload an image from your computer
                </div>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Upload training image</p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="mt-4"
                    />
                  </div>
                  {uploading && (
                    <div className="text-center text-sm text-muted-foreground">
                      Uploading image...
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="create" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Create a new tactical diagram using our Interactive Tactical Board
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paintbrush className="w-5 h-5" />
                      Interactive Tactical Board
                    </CardTitle>
                    <CardDescription>
                      Design custom formations, drills, and tactical setups with our professional drawing tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Drag & drop player positioning
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Drawing tools & arrows
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Formation templates
                        </div>
                      </div>
                      <Button onClick={handleCreateNew} className="w-full">
                        <Paintbrush className="w-4 h-4 mr-2" />
                        Open Tactical Board
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      {currentImage && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{currentImage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentImage.type === 'library' ? 'From Library' : 
                     currentImage.type === 'upload' ? 'Uploaded' : 'Created'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageSelect('', '', '')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}