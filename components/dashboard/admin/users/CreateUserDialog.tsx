
import React, { useState } from 'react';
import { User, GraduationCap, Shield, Check, Lock, Mail, Loader2 } from 'lucide-react';
import { authService } from '../../../../services/authService';
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

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange, onSuccess }) => {
    const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', role: 'student' as 'student'|'instructor'|'admin' });
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.email || !createForm.password || !createForm.fullName) return;
        
        setIsCreating(true);
        try {
            await apiClient.post('/users', {
                email: createForm.email,
                password: createForm.password,
                fullName: createForm.fullName,
                role: createForm.role
            });
            setCreateForm({ fullName: '', email: '', password: '', role: 'student' });
            onOpenChange(false);
            onSuccess();
            alert("User created successfully.");
        } catch (e: any) {
            alert(e.message || "Failed to create user");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Add a new user to the platform.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-9"
                                placeholder="e.g. Jane Doe"
                                value={createForm.fullName} 
                                onChange={(e) => setCreateForm({...createForm, fullName: e.target.value})} 
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-9"
                                type="email"
                                placeholder="e.g. jane@example.com"
                                value={createForm.email} 
                                onChange={(e) => setCreateForm({...createForm, email: e.target.value})} 
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-9"
                                type="password"
                                placeholder="••••••••"
                                value={createForm.password} 
                                onChange={(e) => setCreateForm({...createForm, password: e.target.value})} 
                                required
                                minLength={6}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium">Assign Role</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['student', 'instructor', 'admin'].map((role) => (
                                <div 
                                    key={role}
                                    onClick={() => setCreateForm({...createForm, role: role as any})}
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-3 text-center transition-all hover:shadow-md relative overflow-hidden group",
                                        createForm.role === role 
                                            ? "border-indigo-600 bg-indigo-50" 
                                            : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                                    )}
                                >
                                    {createForm.role === role && (
                                        <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5">
                                            <Check className="h-2 w-2 text-white" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "mb-2 mx-auto w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                        createForm.role === role ? "bg-indigo-200 text-indigo-700" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                    )}>
                                        {role === 'student' && <User className="h-5 w-5" />}
                                        {role === 'instructor' && <GraduationCap className="h-5 w-5" />}
                                        {role === 'admin' && <Shield className="h-5 w-5" />}
                                    </div>
                                    <div className={cn(
                                        "font-semibold capitalize text-xs",
                                        createForm.role === role ? "text-indigo-900" : "text-slate-600"
                                    )}>{role}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isCreating} className="bg-indigo-600 hover:bg-indigo-700">Create Account</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
