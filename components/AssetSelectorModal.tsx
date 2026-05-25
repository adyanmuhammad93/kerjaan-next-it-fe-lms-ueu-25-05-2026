import React, { useState, useEffect } from 'react';
import { Asset, AssetFolder } from '../types';
import { assetService } from '../services/assetService';
import {
    Folder,
    File,
    Loader2,
    ChevronRight,
    FolderOpen,
    Image as ImageIcon,
    Video,
    FileText,
    X,
    Search,
    Filter
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AssetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (asset: Asset) => void;
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folders, setFolders] = useState<AssetFolder[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Repository' }]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'video' | 'document'
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'date' | 'size'

    const filteredFolders = folders.filter(folder => {
        if (searchQuery && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== 'all') return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
    });

    const filteredAssets = assets.filter(asset => {
        if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== 'all') {
            const typeStr = (asset.fileType || '').toLowerCase();
            if (filterType === 'image' && !['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(typeStr)) return false;
            if (filterType === 'video' && !['mp4', 'webm', 'mov'].includes(typeStr)) return false;
            if (filterType === 'document' && !['pdf', 'doc', 'docx', 'txt', 'csv'].includes(typeStr)) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'size') return b.fileSize - a.fileSize;
        return 0;
    });

    const loadContents = async (folderId: string | null) => {
        setLoading(true);
        try {
            const [fetchedFolders, fetchedAssets] = await Promise.all([
                assetService.getFolders(folderId),
                assetService.getAssets(folderId)
            ]);
            setFolders(fetchedFolders);
            setAssets(fetchedAssets);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadContents(currentFolderId);
        }
    }, [currentFolderId, isOpen]);

    if (!isOpen) return null;

    const handleNavigateToFolder = (folder: AssetFolder) => {
        setCurrentFolderId(folder.id);
        setPath([...path, { id: folder.id, name: folder.name }]);
    };

    const handleNavigateToBreadcrumb = (index: number) => {
        const target = path[index];
        setCurrentFolderId(target.id);
        setPath(path.slice(0, index + 1));
    };

    const getFileIcon = (type: string) => {
        if (!type) return <File className="h-6 w-6 text-slate-400" />;
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(t)) return <ImageIcon className="h-6 w-6 text-blue-500" />;
        if (['mp4', 'webm', 'mov'].includes(t)) return <Video className="h-6 w-6 text-rose-500" />;
        if (['pdf'].includes(t)) return <FileText className="h-6 w-6 text-red-500" />;
        return <File className="h-6 w-6 text-slate-400" />;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg">Select Asset</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-100">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Toolbar & Breadcrumbs */}
                <div className="px-4 py-2 border-b flex items-center bg-slate-50 text-sm overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {path.map((item, index) => (
                        <React.Fragment key={item.id ?? 'root'}>
                            {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400 mx-1 flex-shrink-0" />}
                            <button
                                onClick={() => handleNavigateToBreadcrumb(index)}
                                className={`hover:text-indigo-600 font-medium transition-colors ${index === path.length - 1 ? 'text-slate-900 pointer-events-none' : 'text-slate-500'}`}
                            >
                                {item.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                <div className="px-4 py-2 border-b flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white">
                    <div className="relative flex-1 w-full sm:max-w-xs md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search assets..."
                            className="pl-9 h-8 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2 h-8">
                            <Filter className="h-3 w-3 text-slate-400" />
                            <select
                                className="text-sm bg-transparent outline-none border-none text-slate-600 font-medium w-28 cursor-pointer"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="image">Images</option>
                                <option value="video">Videos</option>
                                <option value="document">Documents</option>
                            </select>
                        </div>
                        <select
                            className="h-8 text-sm border-slate-200 rounded-md bg-white px-3 border outline-none text-slate-600 font-medium cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="date">Sort by Date</option>
                            <option value="size">Sort by Size</option>
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 flex-1 overflow-y-auto bg-white min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : folders.length === 0 && assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <FolderOpen className="h-12 w-12 text-slate-300 mb-4" />
                            <p className="font-medium text-slate-600">This folder is empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {/* Folders */}
                            {filteredFolders.map(folder => (
                                <div
                                    key={folder.id}
                                    onDoubleClick={() => handleNavigateToFolder(folder)}
                                    className="group flex flex-col items-center justify-center p-4 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all text-center gap-2"
                                >
                                    <Folder className="h-10 w-10 text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-medium text-slate-700 break-words line-clamp-2 w-full">
                                        {folder.name}
                                    </span>
                                </div>
                            ))}

                            {/* Assets */}
                            {filteredAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    onClick={() => onSelect(asset)}
                                    className="group flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all text-center gap-2"
                                >
                                    {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(asset.fileType?.toLowerCase() || '') ? (
                                        <div className="h-12 w-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                            <img src={asset.fileUrl} alt={asset.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        getFileIcon(asset.fileType)
                                    )}
                                    <span className="text-sm font-medium text-slate-700 break-words line-clamp-2 w-full">
                                        {asset.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
