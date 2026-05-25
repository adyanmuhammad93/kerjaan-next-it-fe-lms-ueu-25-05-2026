
import React from 'react';
import { Eye, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

export const ImpersonationBanner: React.FC = () => {
    const { user, originalAdminUser, stopImpersonation } = useStore();
    const navigate = useNavigate();

    if (!originalAdminUser) return null;

    const handleStop = () => {
        stopImpersonation();
        // Redirect to admin dashboard
        navigate('/dashboard');
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white z-[100] px-4 py-3 shadow-lg-up">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold">Impersonating User:</span> {user?.name} ({user?.role})
                    </div>
                </div>
                <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-white text-amber-600 hover:bg-amber-50 border-0"
                    onClick={handleStop}
                >
                    <X className="h-4 w-4 mr-2" /> Stop Impersonating
                </Button>
            </div>
        </div>
    );
};
