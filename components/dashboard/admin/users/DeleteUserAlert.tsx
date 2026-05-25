
import React, { useState } from 'react';
import { authService } from '../../../../services/authService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../ui/AlertDialog";

interface DeleteUserAlertProps {
    userId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const DeleteUserAlert: React.FC<DeleteUserAlertProps> = ({ userId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            await authService.deleteUser(userId);
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error("Delete user failed:", e);
            alert(`Failed to delete user profile: ${e.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove the user profile and all associated data (courses, progress, certificates, etc.) from the database. 
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                        {loading ? "Deleting..." : "Delete User"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
