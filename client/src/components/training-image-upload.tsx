import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image, Paintbrush, FolderOpen, Check, X, Search, Filter, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n, translateWithParams } from "@/contexts/I18nContext";
import { TRAINING_IMAGE_TYPES } from "@/lib/training-image-types";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();
  const { t, direction } = useI18n();

  // Helper function to handle image selection with both prop patterns
  const handleImageSelect = (url: string, type: string, name: string) => {
    try {
      if (onImageSelect) {
        onImageSelect(url, type, name);
      }
      if (onChange) {
        onChange({ url, type, name });
      }
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Error in handleImageSelect:', error);
      toast({
        title: t("training.imageUpload.toast.selectionErrorTitle"),
        description: t("training.imageUpload.toast.selectionErrorDescription"),
        variant: "destructive",
      });
    }
  };

  // Receives the drawing saved from the Interactive Tactical Board tab opened
  // via "Open Tactical Board" below. Kept in a ref so the listener (registered
  // once) always calls the latest closure instead of a stale one.
  const messageHandlersRef = useRef({ handleImageSelect, toast, t });
  messageHandlersRef.current = { handleImageSelect, toast, t };

  // Every training session has several of these upload widgets mounted at once
  // (overview image, fitness, goalkeeping, specific work - tabs stay mounted).
  // A token correlates the opened board tab back to *this* widget so a save
  // doesn't get broadcast into every section's image field at once.
  const pendingBoardTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const handleTacticalBoardMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'tactical-board-saved') return;
      if (event.data.token !== pendingBoardTokenRef.current) return;

      const { handleImageSelect, toast, t } = messageHandlersRef.current;
      const name = event.data.name || t("training.imageUpload.interactiveBoard");
      // The tactical board's save dialog asks the user to pick one of this
      // library's own categories, so a board saved there slots into the
      // same taxonomy as uploaded/library images instead of a generic tag.
      handleImageSelect(event.data.url, event.data.imageType || 'created', name);
      toast({
        title: t("training.imageUpload.toast.imageSelectedTitle"),
        description: translateWithParams(t, "training.imageUpload.toast.imageSelectedDescription", { name }),
      });
    };

    window.addEventListener('message', handleTacticalBoardMessage);
    return () => window.removeEventListener('message', handleTacticalBoardMessage);
  }, []);

  const typeLabels: Record<string, string> = Object.fromEntries(
    TRAINING_IMAGE_TYPES.map(({ value }) => [value, t(`training.imageUpload.type.${value}`)])
  );

  // Mock tactical board library images - in production, these would come from saved tactical board creations
  const libraryImages = [
    {
      id: 1,
      name: t("training.imageUpload.item1.name"),
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxsaW5lIHgxPSIyMDAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMzAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij40LTQtMjwvdGV4dD4KPC9zdmc+",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxsaW5lIHgxPSIyMDAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMzAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij40LTQtMjwvdGV4dD4KPC9zdmc+",
      type: "formation",
      description: t("training.imageUpload.item1.description")
    },
    {
      id: 2,
      name: t("training.imageUpload.item2.name"),
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxwYXRoIGQ9Ik01MCAyNTBMMTAwIDE1MEwxNTAgMjUwTDMwMCAxNTBMMzUwIDEwMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSIyNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTUwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjI1MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMzUwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjkwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5XaW5nIEF0dGFjazwvdGV4dD4KPC9zdmc+",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxwYXRoIGQ9Ik01MCAyNTBMMTAwIDE1MEwxNTAgMjUwTDMwMCAxNTBMMzUwIDEwMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSIyNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTUwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjI1MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxNTAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMzUwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjkwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5XaW5nIEF0dGFjazwvdGV4dD4KPC9zdmc+",
      type: "drill",
      description: t("training.imageUpload.item2.description")
    },
    {
      id: 3,
      name: t("training.imageUpload.item3.name"),
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxyZWN0IHg9IjEwMCIgeT0iMTUwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjU5ZTBiIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1kYXNoYXJyYXk9IjEwLDEwIi8+CjxjaXJjbGUgY3g9IjE0MCIgY3k9IjIwMCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjE4MCIgY3k9IjIwMCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjIyMCIgY3k9IjIwMCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjI2MCIgY3k9IjIwMCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPjwvc3ZnPg==",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMjJjNTVlIi8+CjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjMwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmNTllMGIiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWRhc2hhcnJheT0iNCw0Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNjAiIHI9IjMiIGZpbGw9IiNlZjQ0NDQiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjYwIiByPSIzIiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjkwIiBjeT0iNjAiIHI9IjMiIGZpbGw9IiNlZjQ0NDQiLz4KPC9zdmc+",
      type: "tactical",
      description: t("training.imageUpload.item3.description")
    },
    {
      id: 4,
      name: t("training.imageUpload.item4.name"),
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxsaW5lIHgxPSIzNzUiIHkxPSIyNzUiIHgyPSIzNzUiIHkyPSIyNTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iMzc1IiB5MT0iMjc1IiB4Mj0iMzUwIiB5Mj0iMjc1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMzc1IiBjeT0iMjc1IiByPSIyNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjM2MCIgY3k9IjI3NSIgcj0iNCIgZmlsbD0iIzM5OGNmNCIvPjxjaXJjbGUgY3g9IjM0MCIgY3k9IjI0MCIgcj0iNCIgZmlsbD0iIzM5OGNmNCIvPjxjaXJjbGUgY3g9IjMyMCIgY3k9IjIwMCIgcj0iNCIgZmlsbD0iIzM5OGNmNCIvPjxjaXJjbGUgY3g9IjMwMCIgY3k9IjE2MCIgcj0iNCIgZmlsbD0iIzM5OGNmNCIvPgo8cGF0aCBkPSJNMzYwIDI3NSAzNDAgMjQwIDMyMCAyMDAgMzAwIDE2MCIgc3Ryb2tlPSIjMzk4Y2Y0IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPgo8L3N2Zz4=",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMjJjNTVlIi8+CjxsaW5lIHgxPSIxNDAiIHkxPSI5MCIgeDI9IjE0MCIgeTI9IjgwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiLz4KPGxpbmUgeDE9IjE0MCIgeTE9IjkwIiB4Mj0iMTMwIiB5Mj0iOTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPgo8Y2lyY2xlIGN4PSIxNDAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPgo8Y2lyY2xlIGN4PSIxMzQiIGN5PSI5MCIgcj0iMiIgZmlsbD0iIzM5OGNmNCIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjgwIiByPSIyIiBmaWxsPSIjMzk4Y2Y0Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjY1IiByPSIyIiBmaWxsPSIjMzk4Y2Y0Ii8+CjxwYXRoIGQ9Ik0xMzQgOTAgMTIwIDgwIDEwMCA2NSIgc3Ryb2tlPSIjMzk4Y2Y0IiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIHN0cm9rZS1kYXNoYXJyYXk9IjIsMyIvPgo8L3N2Zz4=",
      type: "set_piece",
      description: t("training.imageUpload.item4.description")
    },
    {
      id: 5,
      name: t("training.imageUpload.item5.name"),
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMTAiIGZpbGw9IiMzOThjZjQiLz4KPGNpcmNsZSBjeD0iMjUwIiBjeT0iMTAwIiByPSIxMCIgZmlsbD0iIzM5OGNmNCIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjEwIiBmaWxsPSIjMzk4Y2Y0Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwIDI1MCAyMDAiIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtZGFzaGFycmF5PSI4LDgiLz4KPHBhdGggZD0iTTI1MCAxMDAgMjAwIDIwMCIgc3Ryb2tlPSIjMjJjNTVlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1kYXNoYXJyYXk9IjgsOCIvPgo8cGF0aCBkPSJNMjAwIDIwMCAxNTAgMTAwIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iOCw4Ii8+Cjwvc3ZnPg==",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMjJjNTVlIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzAiIHI9IjQiIGZpbGw9IiMzOThjZjQiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMzAiIHI9IjQiIGZpbGw9IiMzOThjZjQiLz4KPGNpcmNsZSBjeD0iNzUiIGN5PSI3MCIgcj0iNCIgZmlsbD0iIzM5OGNmNCIvPgo8cGF0aCBkPSJNNTAgMzAgMTAwIDMwIDc1IDcwIDUwIDMwIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWRhc2hhcnJheT0iNCw0Ii8+Cjwvc3ZnPg==",
      type: "drill",
      description: t("training.imageUpload.item5.description")
    },
    {
      id: 6,
      name: t("training.imageUpload.item6.name"),
      url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjJjNTVlIi8+CjxyZWN0IHg9IjE2MCIgeT0iNjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iMTIiIGZpbGw9IiNmNTllMGIiLz4KPGN5bGluZGVyIGN4PSIxNjAiIGN5PSIxNjAiIHJ4PSI4IiByeT0iNCIgaGVpZ2h0PSIzMCIgZmlsbD0iI2Y5NzMxNiIvPgo8cGF0aCBkPSJNMTY1IDE2MCAyMDAsMTYwIDIwNSwxNjAiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGNpcmNsZSBjeD0iMTQwIiBjeT0iMjQwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjI0MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPgo8Y2lyY2xlIGN4PSIyMjAiIGN5PSIyNDAiIHI9IjgiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iMjYwIiBjeT0iMjQwIiByPSI4IiBmaWxsPSIjZWY0NDQ0Ii8+Cjwvc3ZnPg==",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMjJjNTVlIi8+CjxyZWN0IHg9IjYwIiB5PSIyMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiLz4KPGNpcmNsZSBjeD0iNzUiIGN5PSI2MCIgcj0iNCIgZmlsbD0iI2Y1OWUwYiIvPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjgwIiByPSIzIiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjcwIiBjeT0iODAiIHI9IjMiIGZpbGw9IiNlZjQ0NDQiLz4KPGNpcmNsZSBjeD0iOTAiIGN5PSI4MCIgcj0iMyIgZmlsbD0iI2VmNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxMTAiIGN5PSI4MCIgcj0iMyIgZmlsbD0iI2VmNDQ0NCIvPgo8L3N2Zz4=",
      type: "gk_training",
      description: t("training.imageUpload.item6.description")
    }
  ];

  // Smart filtering logic
  const filteredImages = useMemo(() => {
    return libraryImages.filter(image => {
      // Type filter
      const matchesType = selectedType === "all" || image.type === selectedType;
      
      // Search filter
      const matchesSearch = searchQuery === "" || 
        image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  }, [searchQuery, selectedType]);

  // Filter dropdown always offers the full canonical category list (not just
  // types currently present in the library), so a category like "Fitness"
  // is selectable even before any image has been tagged with it.
  const availableTypes = useMemo(() => {
    return TRAINING_IMAGE_TYPES.map(({ value }) => ({
      value,
      label: typeLabels[value] ?? value
    }));
  }, [typeLabels]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("training.imageUpload.toast.invalidFileTypeTitle"),
        description: t("training.imageUpload.toast.invalidFileTypeDescription"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("training.imageUpload.toast.fileTooLargeTitle"),
        description: t("training.imageUpload.toast.fileTooLargeDescription"),
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

      // Use the helper function to handle both patterns
      handleImageSelect(data.filePath, 'upload', file.name);
      setUploadDialogOpen(false);

      toast({
        title: t("training.imageUpload.toast.uploadSuccessTitle"),
        description: t("training.imageUpload.toast.uploadSuccessDescription"),
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t("training.imageUpload.toast.uploadFailedTitle"),
        description: t("training.imageUpload.toast.uploadFailedDescription"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLibrarySelect = (image: typeof libraryImages[0]) => {
    handleImageSelect(image.url, 'library', image.name);
    toast({
      title: t("training.imageUpload.toast.imageSelectedTitle"),
      description: translateWithParams(t, "training.imageUpload.toast.imageSelectedDescription", { name: image.name }),
    });
  };

  const handleCreateNew = () => {
    // Opens the Interactive Tactical Board in a new tab. When the user saves
    // a drawing there, it posts the result back to this tab (see the
    // "message" listener above) instead of requiring a manual re-upload.
    // The token lets this specific widget claim the result, since a training
    // session can have several of these upload widgets mounted at once.
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingBoardTokenRef.current = token;
    const tacticalBoardUrl = `/interactive-tactical-board?returnTo=training-image&token=${token}`;
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
      case 'fitness':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // The image's "type" is either provenance ('library' / 'upload' / 'created')
  // or, for a board saved from the interactive tactical board, one of the
  // library's own categories (chosen in its save dialog) - show whichever
  // applies so a categorized "Created" image displays its real category.
  const getImageOriginLabel = (type: string) => {
    if (type === 'library') return t("training.imageUpload.fromLibrary");
    if (type === 'upload') return t("training.imageUpload.uploaded");
    if (typeLabels[type]) return typeLabels[type];
    return t("training.imageUpload.created");
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
                {getImageOriginLabel(displayImage.type)}
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
        <Label className="text-base font-medium">{t("training.imageUpload.label")}</Label>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Image className="w-4 h-4 me-2" />
              {displayImage ? t("training.imageUpload.changeImage") : t("training.imageUpload.addImage")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={direction}>
            <DialogHeader>
              <DialogTitle>{t("training.imageUpload.dialogTitle")}</DialogTitle>
            </DialogHeader>

            <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full" dir={direction}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {t("training.imageUpload.tabs.library")}
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {t("training.imageUpload.tabs.upload")}
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4" />
                  {t("training.imageUpload.tabs.create")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="space-y-4">
                <div className="space-y-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("training.imageUpload.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ps-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={t("training.imageUpload.filterByType")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("training.imageUpload.allTypes")}</SelectItem>
                          {availableTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {translateWithParams(t, "training.imageUpload.resultsSummary", { count: filteredImages.length.toString(), total: libraryImages.length.toString() })}
                      {searchQuery && translateWithParams(t, "training.imageUpload.matchingQuery", { query: searchQuery })}
                      {selectedType !== "all" && translateWithParams(t, "training.imageUpload.inType", { type: typeLabels[selectedType] ?? selectedType })}
                    </span>
                    {(searchQuery || selectedType !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedType("all");
                        }}
                      >
                        <X className="h-4 w-4 me-1" />
                        {t("training.imageUpload.clearFilters")}
                      </Button>
                    )}
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                    {filteredImages.length > 0 ? (
                      filteredImages.map((image) => (
                        <Card key={image.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleLibrarySelect(image)}>
                          <CardContent className="p-4">
                            <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                              <img
                                src={image.thumbnail}
                                alt={image.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
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
                                  <Tag className="h-3 w-3 me-1" />
                                  {typeLabels[image.type] ?? image.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{image.description}</p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLibrarySelect(image);
                                }}
                              >
                                <Check className="w-4 h-4 me-2" />
                                {t("training.imageUpload.select")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8">
                        <div className="text-muted-foreground">
                          <FolderOpen className="h-8 w-8 mx-auto mb-2" />
                          {searchQuery || selectedType !== "all" ?
                            t("training.imageUpload.noResultsMatch") :
                            t("training.imageUpload.noResults")
                          }
                        </div>
                        {(searchQuery || selectedType !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedType("all");
                            }}
                          >
                            {t("training.imageUpload.clearFilters")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {t("training.imageUpload.uploadFromComputer")}
                </div>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t("training.imageUpload.uploadTitle")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("training.imageUpload.uploadFormats")}
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
                      {t("training.imageUpload.uploading")}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {t("training.imageUpload.createDescription")}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paintbrush className="w-5 h-5" />
                      {t("training.imageUpload.interactiveBoard")}
                    </CardTitle>
                    <CardDescription>
                      {t("training.imageUpload.interactiveBoardDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          {t("training.imageUpload.dragDrop")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          {t("training.imageUpload.drawingTools")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          {t("training.imageUpload.formationTemplates")}
                        </div>
                      </div>
                      <Button onClick={handleCreateNew} className="w-full">
                        <Paintbrush className="w-4 h-4 me-2" />
                        {t("training.imageUpload.openTacticalBoard")}
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
                    {getImageOriginLabel(currentImage.type)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageSelect?.('', '', '')}
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