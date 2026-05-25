
import React from 'react';
import { Filter, X, ArrowUp, ArrowDown, Check, BookOpen } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { cn } from '../../../../lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../ui/Popover";

interface UserFilterControlsProps {
    roleFilter: string;
    setRoleFilter: (role: string) => void;
    sortBy: string;
    setSortBy: (key: string) => void;
    sortDir: 'asc' | 'desc';
    setSortDir: (dir: 'asc' | 'desc') => void;
    hasEnrollments: boolean;
    setHasEnrollments: (has: boolean) => void;
    onClear: () => void;
}

export const UserFilterControls: React.FC<UserFilterControlsProps> = ({
    roleFilter,
    setRoleFilter,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    hasEnrollments,
    setHasEnrollments,
    onClear
}) => {
    const hasActiveFilters = roleFilter !== 'all' || sortBy !== 'created_at' || hasEnrollments;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn("gap-2 border-dashed", hasActiveFilters && "border-indigo-300 bg-indigo-50 text-indigo-700")}>
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-indigo-200 text-indigo-800 hover:bg-indigo-300 border-0">
                            !
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900">Role</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {['all', 'student', 'instructor', 'admin'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium capitalize border transition-all flex items-center justify-between",
                                        roleFilter === role 
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {role}
                                    {roleFilter === role && <Check className="h-3 w-3 ml-1" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900">Enrollment Status</h4>
                        <button
                            onClick={() => setHasEnrollments(!hasEnrollments)}
                            className={cn(
                                "w-full px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center justify-between",
                                hasEnrollments 
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <BookOpen className="h-3 w-3" /> Has Enrolled Courses
                            </span>
                            {hasEnrollments && <Check className="h-3 w-3" />}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900">Sort By</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setSortBy('created_at')}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-all text-center",
                                    sortBy === 'created_at' ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-white border-slate-200 text-slate-500"
                                )}
                            >
                                Joined Date
                            </button>
                            <button
                                onClick={() => setSortBy('full_name')}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-all text-center",
                                    sortBy === 'full_name' ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-white border-slate-200 text-slate-500"
                                )}
                            >
                                Name
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900">Order</h4>
                        <div className="flex bg-slate-100 p-1 rounded-md">
                            <button
                                onClick={() => setSortDir('asc')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium rounded-sm transition-all",
                                    sortDir === 'asc' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <ArrowUp className="h-3 w-3" /> Ascending
                            </button>
                            <button
                                onClick={() => setSortDir('desc')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium rounded-sm transition-all",
                                    sortDir === 'desc' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <ArrowDown className="h-3 w-3" /> Descending
                            </button>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onClear}
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                        >
                            <X className="h-3 w-3 mr-2" /> Clear Filters
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
