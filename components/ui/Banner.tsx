
import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BannerProps {
    variant?: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description?: string;
    className?: string;
}

export const Banner: React.FC<BannerProps> = ({ variant = 'info', title, description, className }) => {
    const styles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-green-50 border-green-200 text-green-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        error: "bg-red-50 border-red-200 text-red-800"
    };

    const icons = {
        info: Info,
        success: CheckCircle,
        warning: AlertCircle,
        error: XCircle
    };

    const Icon = icons[variant];

    return (
        <div className={cn("border-l-4 p-4 rounded-r-md flex gap-3", styles[variant], className)}>
            <div className="shrink-0 mt-0.5">
                <Icon className="h-5 w-5 opacity-80" />
            </div>
            <div>
                <h4 className="font-semibold text-sm">{title}</h4>
                {description && <p className="text-sm mt-1 opacity-90">{description}</p>}
            </div>
        </div>
    );
};
