import React, { useState, useEffect, useRef } from 'react';
import {
    Folder,
    File,
    UploadCloud,
    MoreVertical,
    Trash2,
    Edit,
    Plus,
    Grid as GridIcon,
    List as ListIcon,
    ChevronRight,
    FolderOpen,
    Image as ImageIcon,
    Video,
    FileText,
    Loader2,
    Copy,
    Search,
    Filter
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { assetService } from '../../../services/assetService';
import { Asset, AssetFolder } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card } from '../../ui/Card';
import { UserPlus, Lock, Globe } from 'lucide-react';
import { ShareAssetDialog } from './ShareAssetDialog';
import { useStore } from '../../../store/useStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "../../ui/DropdownMenu";

export const AssetsRepository: React.FC = () => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folders, setFolders] = useState<AssetFolder[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'video' | 'document'
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'date' | 'size'
    const [shareDialog, setShareDialog] = useState<{ isOpen: boolean, item: Asset | AssetFolder | null, type: 'asset' | 'folder' }>({ isOpen: false, item: null, type: 'asset' });
    const user = useStore(state => state.user);

    // Breadcrumbs track path
    const [path, setPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Repository' }]);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        loadContents(currentFolderId);
    }, [currentFolderId]);

    const handleCreateFolder = async () => {
        const name = prompt('Enter folder name:');
        if (!name) return;
        try {
            const newFolder = await assetService.createFolder(name, currentFolderId);
            setFolders([...folders, newFolder]);
        } catch (err) {
            alert('Failed to create folder');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                await assetService.uploadAsset(files[i], currentFolderId);
            }
            loadContents(currentFolderId);
        } catch (err) {
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleNavigateToFolder = (folder: AssetFolder) => {
        setCurrentFolderId(folder.id);
        setPath([...path, { id: folder.id, name: folder.name }]);
    };

    const handleNavigateToBreadcrumb = (index: number) => {
        const target = path[index];
        setCurrentFolderId(target.id);
        setPath(path.slice(0, index + 1));
    };

    const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this folder and all its contents?')) return;
        try {
            await assetService.deleteFolder(id);
            setFolders(folders.filter(f => f.id !== id));
        } catch (err) {
            alert('Failed to delete folder');
        }
    };

    const handleDeleteAsset = async (asset: Asset, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await assetService.deleteAsset(asset);
            setAssets(assets.filter(a => a.id !== asset.id));
        } catch (err) {
            alert('Failed to delete asset');
        }
    };

    const handleRenameFolder = async (id: string, oldName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const name = prompt('Enter new folder name:', oldName);
        if (!name || name === oldName) return;
        try {
            const updated = await assetService.renameFolder(id, name);
            setFolders(folders.map(f => f.id === id ? updated : f));
        } catch (err) {
            alert('Failed to rename folder');
        }
    };

    const handleRenameAsset = async (id: string, oldName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const name = prompt('Enter new file name:', oldName);
        if (!name || name === oldName) return;
        try {
            const updated = await assetService.renameAsset(id, name);
            setAssets(assets.map(a => a.id === id ? updated : a));
        } catch (err) {
            alert('Failed to rename asset');
        }
    };

    const copyToClipboard = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
    };

    const getFileIcon = (type: string) => {
        if (!type) return <File className="h-8 w-8 text-slate-400" />;
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(t)) return <ImageIcon className="h-8 w-8 text-blue-500" />;
        if (['mp4', 'webm', 'mov'].includes(t)) return <Video className="h-8 w-8 text-rose-500" />;
        if (['pdf'].includes(t)) return <FileText className="h-8 w-8 text-red-500" />;
        return <File className="h-8 w-8 text-slate-400" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen px-3 sm:px-4 lg:px-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#0078C1] bg-opacity-10 rounded-2xl">
                            <FolderOpen className="h-6 w-6 text-[#0078C1]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#003366]">Repositori Aset</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-0 sm:ml-12">Kelola berkas dan media pembelajaran Anda secara terpusat untuk kemudahan penyisipan materi.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={handleCreateFolder}
                        className="w-full sm:w-auto h-12 rounded-xl border-slate-200 text-slate-600 font-bold bg-white shadow-sm hover:text-[#0078C1] transition-all"
                    >
                        <Plus className="mr-2 h-5 w-5 text-[#0078C1]" /> Folder Baru
                    </Button>
                    <Button
                        className="w-full sm:w-auto bg-[#003366] hover:bg-[#0078C1] text-white rounded-xl h-12 px-6 shadow-md shadow-[#003366]/10 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                        {uploading ? 'Mengunggah...' : 'Unggah Berkas'}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white flex flex-col flex-1 min-h-[600px]">
                {/* Toolbar & Breadcrumbs */}
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-[#F8FAFC]/50">
                    <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar">
                        {path.map((item, index) => (
                            <React.Fragment key={item.id ?? 'root'}>
                                {index > 0 && <ChevronRight className="h-4 w-4 text-slate-300 mx-2 flex-shrink-0" />}
                                <button
                                    onClick={() => handleNavigateToBreadcrumb(index)}
                                    className={cn(
                                        "text-sm font-bold tracking-tight rounded-md px-2 py-1 transition-all",
                                        index === path.length - 1 
                                            ? "text-[#003366] bg-slate-100 pointer-events-none" 
                                            : "text-slate-400 hover:text-[#0078C1] hover:bg-white"
                                    )}
                                >
                                    {item.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 sm:ml-6">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                viewMode === 'grid' ? "bg-white text-[#0078C1] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <GridIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                viewMode === 'list' ? "bg-white text-[#0078C1] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative flex-1 w-full sm:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari aset berdasarkan nama atau format..."
                            className="pl-11 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-[#0078C1] focus:ring-[#0078C1] rounded-2xl shadow-inner font-medium text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 h-12 border border-transparent hover:border-slate-100 transition-all">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:inline">Filter:</span>
                            <select
                                className="text-sm bg-transparent outline-none border-none text-[#003366] font-bold cursor-pointer pr-4"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">Semua Format</option>
                                <option value="image">Gambar</option>
                                <option value="video">Video</option>
                                <option value="document">Dokumen</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 h-12 border border-transparent hover:border-slate-100 transition-all">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:inline">Urutkan:</span>
                            <select
                                className="text-sm bg-transparent outline-none border-none text-[#003366] font-bold cursor-pointer pr-4"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name">Nama (A-Z)</option>
                                <option value="date">Terbaru</option>
                                <option value="size">Ukuran</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#0078C1] rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Memuat repositori...</p>
                        </div>
                    ) : folders.length === 0 && assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                                <FolderOpen className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Folder ini kosong</h3>
                            <p className="text-sm max-w-xs text-center mt-2">Unggah berkas atau buat sub-folder untuk mengorganisir aset pembelajaran Anda.</p>
                            <Button 
                                className="mt-8 bg-[#003366] hover:bg-[#0078C1] text-white rounded-full px-8 animate-bounce-subtle"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Unggah Berkas Pertama
                            </Button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" : "space-y-3"}>

                            {/* Folders */}
                            {filteredFolders.map(folder => (
                                <div
                                    key={folder.id}
                                    onDoubleClick={() => handleNavigateToFolder(folder)}
                                    className={cn(
                                        "group relative transition-all duration-300",
                                        viewMode === 'grid'
                                            ? "p-6 rounded-[24px] bg-white border border-transparent hover:border-[#0078C1]/20 hover:bg-[#F8FAFC] hover:shadow-lg cursor-pointer"
                                            : "flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer shadow-sm"
                                    )}
                                >
                                    <div className={viewMode === 'grid' ? "flex flex-col items-center text-center gap-4 w-full" : "flex items-center gap-4"}>
                                        <div className={cn(
                                            "relative",
                                            viewMode === 'grid' ? "h-16 w-16" : "h-10 w-10 flex items-center justify-center shrink-0"
                                        )}>
                                            <Folder className={cn(
                                                "w-full h-full text-amber-400 fill-amber-400 transition-transform group-hover:scale-110 duration-300",
                                                viewMode === 'list' && "h-8 w-8"
                                            )} />
                                            {folder.visibility === 'public' ? (
                                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm ring-2 ring-white">
                                                    <Globe className="h-3 w-3 text-[#0078C1]" />
                                                </div>
                                            ) : (
                                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm ring-2 ring-white">
                                                    <Lock className="h-3 w-3 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className={viewMode === 'grid' ? "w-full" : "flex-1"}>
                                            <span className={cn(
                                                "font-bold text-[#003366] transition-colors group-hover:text-[#0078C1]",
                                                viewMode === 'grid' ? "text-sm break-words line-clamp-2" : "text-sm"
                                            )}>
                                                {folder.name}
                                            </span>
                                            {viewMode === 'list' && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-0.5 ml-0.5">
                                                    {folder.visibility || 'private'} • Folder
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "transition-all duration-300",
                                        viewMode === 'grid' 
                                            ? "absolute top-3 right-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0" 
                                            : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={e => e.stopPropagation()}>
                                                    <MoreVertical className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-none shadow-xl">
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={(e) => { e.stopPropagation(); handleNavigateToFolder(folder); }}>
                                                    <FolderOpen className="mr-3 h-5 w-5 text-[#0078C1]" /> Buka Folder
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={(e) => handleRenameFolder(folder.id, folder.name, e)}>
                                                    <Edit className="mr-3 h-5 w-5 text-emerald-500" /> Ganti Nama
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={(e) => { e.stopPropagation(); setShareDialog({ isOpen: true, item: folder, type: 'folder' }); }}>
                                                    <UserPlus className="mr-3 h-5 w-5 text-[#0EA5E9]" /> Kelola Akses
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-2" />
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-red-500 focus:bg-red-50 hover:bg-red-50" onClick={(e) => handleDeleteFolder(folder.id, e)}>
                                                    <Trash2 className="mr-3 h-5 w-5" /> Hapus Folder
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            {/* Assets */}
                            {filteredAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    className={cn(
                                        "group relative transition-all duration-300",
                                        viewMode === 'grid'
                                            ? "p-6 rounded-[24px] bg-white border border-transparent hover:border-[#0078C1]/20 hover:bg-[#F8FAFC] hover:shadow-lg cursor-pointer"
                                            : "flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer shadow-sm"
                                    )}
                                >
                                    <div className={viewMode === 'grid' ? "flex flex-col items-center text-center gap-4 w-full" : "flex items-center gap-4"}>
                                        <div className={cn(
                                            "relative overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center shrink-0",
                                            viewMode === 'grid' ? "h-24 w-full" : "h-12 w-12"
                                        )}>
                                            {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(asset.fileType?.toLowerCase() || '') ? (
                                                <img src={asset.fileUrl} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                            ) : (
                                                <div className="transform group-hover:scale-110 transition-transform duration-300">
                                                    {getFileIcon(asset.fileType)}
                                                </div>
                                            )}
                                            
                                            {viewMode === 'grid' && (
                                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md p-1 px-1.5 rounded-lg shadow-sm border border-slate-200">
                                                    {asset.visibility === 'public' ? <Globe className="h-3 w-3 text-[#0078C1]" /> : <Lock className="h-3 w-3 text-slate-400" />}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className={viewMode === 'grid' ? "w-full" : "flex-1"}>
                                            <span className={cn(
                                                "font-bold text-[#003366] transition-colors group-hover:text-[#0078C1]",
                                                viewMode === 'grid' ? "text-sm break-words line-clamp-2" : "text-sm"
                                            )}>
                                                {asset.name}
                                            </span>
                                            <div className="flex items-center justify-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                    {formatSize(asset.fileSize)} {viewMode === 'list' && `• ${new Date(asset.createdAt).toLocaleDateString('id-ID')}`}
                                                </span>
                                                {viewMode === 'list' && (
                                                    <div className="bg-slate-200 h-1 w-1 rounded-full"></div>
                                                )}
                                                {viewMode === 'list' && (
                                                    <span className="text-[10px] font-black text-[#0078C1] uppercase tracking-widest block">
                                                        {asset.visibility || 'private'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "transition-all duration-300",
                                        viewMode === 'grid' 
                                            ? "absolute top-3 right-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0" 
                                            : "opacity-0 group-hover:opacity-100 flex items-center gap-2"
                                    )}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white shadow-sm hover:bg-slate-50 transition-all font-bold" onClick={e => e.stopPropagation()}>
                                                    <MoreVertical className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-none shadow-xl">
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={() => window.open(asset.fileUrl, '_blank')}>
                                                    <File className="mr-3 h-5 w-5 text-teal-500" /> Lihat Berkas
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={(e) => copyToClipboard(asset.fileUrl, e)}>
                                                    <Copy className="mr-3 h-5 w-5 text-indigo-500" /> Salin Tautan
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={(e) => handleRenameAsset(asset.id, asset.name, e)}>
                                                    <Edit className="mr-3 h-5 w-5 text-emerald-500" /> Ganti Nama
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-slate-600" onClick={(e) => { e.stopPropagation(); setShareDialog({ isOpen: true, item: asset, type: 'asset' }); }}>
                                                    <UserPlus className="mr-3 h-5 w-5 text-[#0EA5E9]" /> Kelola Akses
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-2" />
                                                <DropdownMenuItem className="rounded-xl py-3 font-bold text-red-500 focus:bg-red-50 hover:bg-red-50" onClick={(e) => handleDeleteAsset(asset, e)}>
                                                    <Trash2 className="mr-3 h-5 w-5" /> Hapus Berkas
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}
                </div>
                
                {/* File Count Footer */}
                <div className="px-8 py-4 bg-[#F8FAFC]/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                    <div className="flex items-center gap-4">
                        <span>Total: {folders.length} Folder</span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                        <span>{assets.length} Berkas</span>
                    </div>
                </div>
            </Card>

            <ShareAssetDialog 
                isOpen={shareDialog.isOpen} 
                onClose={() => setShareDialog(prev => ({ ...prev, isOpen: false }))} 
                item={shareDialog.item} 
                type={shareDialog.type}
                onVisibilityChanged={(newVis) => {
                    // Update local state optimistic
                    if (shareDialog.type === 'folder') {
                        setFolders(folders.map(f => f.id === shareDialog.item?.id ? { ...f, visibility: newVis } : f));
                    } else {
                        setAssets(assets.map(a => a.id === shareDialog.item?.id ? { ...a, visibility: newVis } : a));
                    }
                }}
            />
        </div>
    );
};
