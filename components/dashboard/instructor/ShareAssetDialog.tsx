import React, { useState, useEffect } from 'react';
import { assetService } from '../../../services/assetService';
import { Asset, AssetFolder } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Trash2, UserPlus, Globe, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { authService } from '../../../services/authService';
import { cn } from '../../../lib/utils';

interface ShareAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Asset | AssetFolder | null;
  type: 'asset' | 'folder';
  onVisibilityChanged?: (newVisibility: 'public' | 'private') => void;
}

export const ShareAssetDialog: React.FC<ShareAssetDialogProps> = ({ isOpen, onClose, item, type, onVisibilityChanged }) => {
  const user = useStore(state => state.user);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]); // Search results
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // New Share form state
  const [permissions, setPermissions] = useState<string[]>(['view']);
  const [expiresAt, setExpiresAt] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      loadShares();
    } else {
      setShares([]);
      setSearchQuery('');
      setUsers([]);
      setSelectedUserId('');
    }
  }, [isOpen, item]);

  const loadShares = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const data = await assetService.getShares(item.id, type);
      setShares(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    try {
      const response = await authService.getPaginatedUsers(1, 20, searchQuery, { role: 'instructor,admin' });
      setUsers(response.data.filter((u: any) => u.id !== user?.id)); // exclude self
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVisibility = async (newVis: 'public' | 'private') => {
    if (!item) return;
    try {
      await assetService.updateVisibility(item.id, type, newVis);
      if (onVisibilityChanged) onVisibilityChanged(newVis);
    } catch (err) {
      alert('Failed to update visibility');
    }
  };

  const handleAddShare = async () => {
    if (!item || !selectedUserId) return;
    setSharing(true);
    try {
      await assetService.addShare({
        assetId: type === 'asset' ? item.id : undefined,
        folderId: type === 'folder' ? item.id : undefined,
        sharedWithUserId: selectedUserId,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      setSelectedUserId('');
      setSearchQuery('');
      setUsers([]);
      loadShares();
    } catch (err) {
        alert('Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await assetService.removeShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err) {
      alert('Failed to revoke share');
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  if (!item) return null;

  const isOwnerOrAdmin = user?.role === 'admin' || user?.id === item.createdBy;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white w-full rounded-[32px] shadow-2xl border-0 overflow-hidden text-slate-800 p-0">
        <DialogHeader className="p-8 pb-4 bg-[#F8FAFC]/50 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-[#0078C1] bg-opacity-10 rounded-xl">
              <UserPlus className="h-5 w-5 text-[#0078C1]" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#003366]">
              Bagikan {type === 'folder' ? 'Folder' : 'Berkas'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 font-medium ml-11">
            Kelola akses kolaborasi untuk <span className="text-[#0078C1] font-bold">{item.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 flex flex-col gap-8 max-h-[70vh] overflow-y-auto">
          {/* Visibility Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white border border-[#0078C1]/10 rounded-[24px] shadow-sm gap-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-2xl shadow-inner transition-colors duration-500",
                item.visibility === 'public' ? 'bg-[#0078C1]/10 text-[#0078C1]' : 'bg-slate-100 text-slate-400'
              )}>
                {item.visibility === 'public' ? <Globe className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#003366] text-lg leading-none">
                  Akses {item.visibility === 'public' ? 'Publik' : 'Privat'}
                </span>
                <span className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
                  {item.visibility === 'public' 
                    ? 'Siapa pun dengan tautan ini atau akses ke platform dapat melihat aset ini.' 
                    : 'Hanya Anda dan pengguna yang diberikan izin secara eksplisit yang dapat mengakses.'}
                </span>
              </div>
            </div>
            {isOwnerOrAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleToggleVisibility(item.visibility === 'public' ? 'private' : 'public')}
                className="h-10 rounded-xl font-bold border-slate-200 text-[#003366] hover:bg-[#F8FAFC] transition-all whitespace-nowrap min-w-[140px]"
              >
                Ubah ke {item.visibility === 'public' ? 'Privat' : 'Publik'}
              </Button>
            )}
          </div>

          {/* Explicit Shares */}
          {isOwnerOrAdmin && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0078C1]"></div>
                <h4 className="font-bold text-[#003366] text-sm uppercase tracking-widest">Berikan Akses Spesifik</h4>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input 
                    placeholder="Cari nama atau email rekan pengajar..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-[#0078C1] focus:ring-[#0078C1] rounded-2xl shadow-inner font-medium text-slate-600 pl-4"
                  />
                </div>
                <Button 
                  onClick={handleSearchUsers}
                  className="h-12 rounded-2xl px-6 bg-[#003366] hover:bg-[#0078C1] text-white font-bold transition-all shadow-md shadow-[#003366]/10"
                >
                  Cari Pengguna
                </Button>
              </div>

              {users.length > 0 && (
                <div className="border border-slate-100 rounded-[20px] p-2 max-h-56 overflow-y-auto bg-[#F8FAFC] shadow-inner divide-y divide-slate-100">
                  {users.map((u) => (
                    <div 
                      key={u.id} 
                      className={cn(
                        "p-4 rounded-xl cursor-pointer text-sm flex items-center justify-between transition-all group",
                        selectedUserId === u.id ? 'bg-white border border-[#0078C1]/20 shadow-sm ring-1 ring-[#0078C1]/5' : 'hover:bg-white/60'
                      )}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <div className="flex flex-col">
                        <div className="font-bold text-[#003366] group-hover:text-[#0078C1] transition-colors">{u.full_name}</div>
                        <div className="text-slate-400 font-medium text-xs">{u.email}</div>
                      </div>
                      {selectedUserId === u.id && (
                        <div className="bg-[#0078C1] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Dipilih</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedUserId && (
                <div className="bg-[#F8FAFC] p-6 rounded-[24px] border border-[#0078C1]/10 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Hak Akses Tersedia</span>
                    <div className="flex flex-wrap gap-2">
                      {['view', 'download', 'edit', 'delete', 'share'].map(p => (
                        <label 
                          key={p} 
                          className={cn(
                            "flex items-center gap-2.5 text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-all border font-bold shadow-sm",
                            permissions.includes(p) 
                              ? "bg-white border-[#0078C1] text-[#0078C1] ring-2 ring-[#0078C1]/5" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                          )}
                        >
                          <input 
                            type="checkbox" 
                            checked={permissions.includes(p)} 
                            onChange={() => togglePermission(p)} 
                            className="h-4 w-4 accent-[#0078C1] rounded border-slate-300 transition-colors" 
                          />
                          <span className="capitalize">{p === 'view' ? 'Lihat' : p === 'edit' ? 'Edit' : p === 'delete' ? 'Hapus' : p === 'share' ? 'Bagikan' : 'Unduh'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Masa Berlaku (Opsional)</span>
                    <Input 
                      type="date" 
                      value={expiresAt} 
                      onChange={e => setExpiresAt(e.target.value)} 
                      className="h-12 bg-white border-slate-100 focus:border-[#0078C1] focus:ring-[#0078C1] rounded-2xl font-bold text-[#003366] max-w-sm" 
                    />
                  </div>
                  <Button 
                    onClick={handleAddShare} 
                    disabled={sharing} 
                    className="w-full h-12 bg-[#003366] hover:bg-[#0078C1] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#003366]/10"
                  >
                    {sharing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />} Konfirmasi Berbagi
                  </Button>
                </div>
              )}

              <div className="pt-6 border-t border-slate-50">
                 <div className="flex items-center gap-2 mb-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    <h4 className="font-bold text-[#003366] text-sm uppercase tracking-widest">Kolaborator Aktif</h4>
                 </div>
                 
                 {loading ? (
                    <div className="flex items-center justify-center py-8">
                       <Loader2 className="h-8 w-8 animate-spin text-[#0078C1] opacity-20" />
                    </div>
                 ) : shares.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                      <p className="text-sm font-bold text-slate-400 italic">Belum ada kolaborator yang ditambahkan secara manual.</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                      {shares.map(s => (
                        <div key={s.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 border border-slate-50 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 gap-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#003366] text-base group-hover:text-[#0078C1] transition-colors">{s.sharedWithName}</span>
                            <span className="text-xs text-slate-400 font-medium">{s.sharedWithEmail}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-wrap gap-1.5">
                              {s.permissions.map((p: string) => (
                                <span key={p} className="text-[10px] bg-[#F8FAFC] border border-slate-100 text-[#0078C1] px-2.5 py-1 rounded-lg capitalize font-black tracking-wider shadow-sm">
                                  {p}
                                </span>
                              ))}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                              onClick={() => handleRevoke(s.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-[#F8FAFC]/30 flex justify-end">
           <Button 
             onClick={onClose} 
             className="px-8 h-12 bg-white border-slate-200 text-[#003366] hover:bg-slate-50 transition-all rounded-2xl font-bold shadow-sm"
           >
             Selesai
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
