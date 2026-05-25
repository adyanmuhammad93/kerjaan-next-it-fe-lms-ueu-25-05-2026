
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../services/apiClient';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { cn } from '../../../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/Dialog";

interface EditUserDialogProps {
    user: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose, onSuccess }) => {
    const [editForm, setEditForm] = useState({ fullName: '', role: 'student' as 'student'|'instructor'|'admin' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setEditForm({ 
                fullName: user.full_name || '', 
                role: user.role || 'student' 
            });
        }
    }, [user]);

    const handleSaveEdit = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await apiClient.patch(`/users/${user.id}`, {
                fullName: editForm.fullName,
                role: editForm.role
            });
            onSuccess();
            onClose();
        } catch (e) {
            alert("Failed to update user");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Update profile details and role assignment.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input 
                            value={editForm.fullName} 
                            onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['student', 'instructor', 'admin'].map((role) => (
                                <div 
                                    key={role}
                                    onClick={() => setEditForm({...editForm, role: role as any})}
                                    className={cn(
                                        "cursor-pointer rounded-md border p-3 text-center text-sm capitalize transition-all",
                                        editForm.role === role 
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" 
                                            : "hover:bg-slate-50 border-slate-200"
                                    )}
                                >
                                    {role}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveEdit} isLoading={isSaving}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
