import React, { useState, useEffect } from 'react';
import { File as FileIcon, Upload, Trash2, Loader2, Download, Paperclip, FolderOpen } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { apiClient } from '../../services/apiClient';
import { Resource, Asset } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { AssetSelectorModal } from '../AssetSelectorModal';

interface ResourcesManagerProps {
    lessonId: string;
}

export const ResourcesManager: React.FC<ResourcesManagerProps> = ({ lessonId }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

    const fetchResources = async () => {
        try {
            const data = await resourceService.getResourcesByLesson(lessonId);
            setResources(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [lessonId]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            await resourceService.addResource(lessonId, file, title || file.name);
            setFile(null);
            setTitle('');
            fetchResources();
        } catch (e) {
            alert("Unggah gagal");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Hapus resource ini?")) return;
        try {
            await resourceService.deleteResource(id);
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            alert("Gagal menghapus");
        }
    };

    const handleAssetSelect = async (asset: Asset) => {
        setIsAssetModalOpen(false);
        setUploading(true);
        try {
            await apiClient.post('/assignments/resources/link', {
                lessonId,
                title: title || asset.name,
                fileUrl: asset.fileUrl,
                fileType: asset.fileType,
                fileSize: asset.fileSize,
            });
            setTitle('');
            fetchResources();
        } catch (e) {
            alert('Gagal menautkan aset');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
            <h4 className="font-semibold text-sm flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-indigo-500" />
                Resource yang Dapat Diunduh
            </h4>

            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <div className="space-y-2">
                    {resources.map(res => (
                        <div key={res.id} className="flex items-center justify-between p-2 bg-white border rounded text-sm group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="truncate">{res.title}</span>
                                {res.fileType && <span className="text-xs text-slate-400 uppercase">.{res.fileType}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => window.open(res.fileUrl, '_blank')}>
                                    <Download className="h-3 w-3 text-slate-500" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(res.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {resources.length === 0 && <p className="text-xs text-muted-foreground italic">Belum ada resource terlampir.</p>}
                </div>
            )}

            <div className="flex gap-2 pt-2 items-end">
                <div className="flex-1 space-y-1">
                    <Input
                        type="file"
                        className="text-xs h-8 file:mr-2 file:py-0 file:px-2 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>
                <div className="w-1/3">
                    <Input
                        placeholder="Nama Tampil (Opsional)"
                        className="h-8 text-xs"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsAssetModalOpen(true)} className="h-8" title="Pilih dari Repositori Aset">
                    <FolderOpen className="h-3 w-3" />
                </Button>
                <Button size="sm" onClick={handleUpload} disabled={!file || uploading} className="h-8">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                </Button>
            </div>

            <AssetSelectorModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSelect={handleAssetSelect}
            />
        </div>
    );
};
