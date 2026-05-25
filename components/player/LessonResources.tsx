import React, { useEffect, useState } from 'react';
import { Download, File, Loader2 } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types';
import { Button } from '../ui/Button';

export const LessonResources: React.FC<{ lessonId: string }> = ({ lessonId }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await resourceService.getResourcesByLesson(lessonId);
                setResources(data);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [lessonId]);

    if (loading) return <div className="p-4"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>;
    if (resources.length === 0) return null;

    return (
        <div className="mt-8 border rounded-lg bg-slate-50/50 p-4">
            <h4 className="font-semibold text-sm mb-3 text-slate-700">Resources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                                <File className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium truncate">{res.title}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-indigo-600" onClick={() => window.open(res.fileUrl, '_blank')}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};