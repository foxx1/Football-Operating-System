import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  name: string;
  type: 'player' | 'staff';
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  name,
  type
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete <strong>{name}</strong>? This {type} will be permanently removed from your database.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Warning: This process cannot be undone.
          </p>
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Delete {type === 'player' ? 'Player' : 'Staff Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}