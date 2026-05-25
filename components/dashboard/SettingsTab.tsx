


import React, { useState, useEffect } from 'react';
import { Loader2, Camera, User as UserIcon, Lock, Save, ShieldCheck, Sparkles, Key, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authService } from '../../services/authService';
import { courseService } from '../../services/courseService'; // Reuse upload logic
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export const SettingsTab: React.FC = () => {
    const { user, setUser } = useStore();
    
    // Profile State
    const [profileForm, setProfileForm] = useState({ fullName: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    
    // Security State
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [securitySaving, setSecuritySaving] = useState(false);

    // AI Config State
    const [geminiKey, setGeminiKey] = useState('');
    const [aiSaving, setAiSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({ fullName: user.name });
            setPreviewUrl(user.avatarUrl || null);
            setGeminiKey(user.geminiApiKey || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setProfileSaving(true);
        try {
            let avatarUrl = user.avatarUrl;
            
            // Upload new avatar if selected
            if (avatarFile) {
                avatarUrl = await courseService.uploadFile(avatarFile, 'avatars');
            }

            await authService.updateProfile(user.id, { 
                fullName: profileForm.fullName,
                avatarUrl
            });
            
            setUser({ 
                ...user, 
                name: profileForm.fullName,
                avatarUrl
            });
            
            alert("Profile updated successfully!");
        } catch (error) { 
            console.error(error);
            alert("Failed to update profile"); 
        } finally { 
            setProfileSaving(false); 
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setSecuritySaving(true);
        try {
            await authService.updatePassword(passwordForm.newPassword);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            alert("Password updated successfully");
        } catch (error: any) {
            alert(error.message || "Failed to update password");
        } finally {
            setSecuritySaving(false);
        }
    };

    const handleUpdateAiConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAiSaving(true);
        try {
            await authService.updateProfile(user.id, {
                geminiApiKey: geminiKey
            });
            setUser({
                ...user,
                geminiApiKey: geminiKey
            });
            alert("AI Configuration updated!");
        } catch (e) {
            alert("Failed to update AI settings");
        } finally {
            setAiSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-16">
            
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-ueu-blue/10 rounded-2xl">
                        <Settings className="h-6 w-6 text-ueu-blue" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-ueu-navy tracking-tight">Pengaturan Profil</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Kelola preferensi akun dan detail pribadi Anda dengan aman.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[40px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                        <CardContent className="pt-12 pb-10 flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-3">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-ueu-navy to-ueu-blue flex items-center justify-center text-white font-black text-4xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div 
                                        className="absolute inset-0 bg-ueu-navy/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer rounded-full backdrop-blur-[2px]" 
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                    >
                                        <Camera className="h-10 w-10 text-white animate-pulse" />
                                    </div>
                                </div>
                                <input 
                                    id="avatar-upload" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div className="absolute -bottom-1 -right-1 bg-accent text-white p-3 rounded-2xl shadow-xl border-4 border-white cursor-pointer hover:scale-110 hover:-rotate-12 transition-all" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                    <Camera className="h-5 w-5" />
                                </div>
                            </div>
                            
                            <div className="mt-8 text-center space-y-1">
                                <h3 className="text-xl font-black text-ueu-navy">{user.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{user.email}</p>
                                <div className="pt-4">
                                    <Badge className={cn(
                                        "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                        user.role === 'admin' ? "bg-ueu-navy text-white" : 
                                        user.role === 'instructor' ? "bg-ueu-blue text-white" : 
                                        "bg-accent text-white"
                                    )}>
                                        {user.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-none shadow-xl shadow-blue-900/10 bg-ueu-navy text-white overflow-hidden p-8 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-ueu-blue/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative z-10 space-y-4">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Sparkles className="h-6 w-6 text-ueu-blue" />
                            </div>
                            <h4 className="font-black text-lg">Keamanan Akun</h4>
                            <p className="text-white/60 text-sm leading-relaxed font-medium">
                                Pastikan password Anda kuat dan rutin diperbarui untuk menjaga integritas data pembelajaran Anda.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Section */}
                    <Card className="rounded-[40px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-8 px-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-ueu-navy/10 rounded-2xl text-ueu-navy">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-ueu-navy">Informasi Pribadi</CardTitle>
                                    <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Identitas akademik resmi Anda.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="grid gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] ml-1">Nama Lengkap</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-ueu-blue transition-all" />
                                            <Input 
                                                className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-ueu-blue transition-all font-bold text-ueu-navy"
                                                value={profileForm.fullName} 
                                                onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} 
                                                placeholder="Masukkan nama lengkap"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide px-1">Nama ini akan tercetak permanen pada sertifikat kelulusan.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] ml-1">Alamat Email</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input 
                                                value={user.email} 
                                                disabled 
                                                className="pl-12 h-14 rounded-2xl bg-slate-100 border-none text-slate-400 font-bold cursor-not-allowed opacity-70" 
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide px-1">Email terverifikasi tidak dapat diubah secara mandiri.</p>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end p-8">
                            <Button 
                                type="submit" 
                                form="profile-form" 
                                disabled={profileSaving} 
                                className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-2xl px-10 h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 transition-all active:scale-95"
                            >
                                {profileSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* AI Configuration Section (Instructor Only) */}
                    {user.role === 'instructor' && (
                        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden border-l-[12px] border-l-accent">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-8 px-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-accent/10 rounded-2xl text-accent">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black text-ueu-navy">Konfigurasi AI Assistant</CardTitle>
                                        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Personalisasi batas pembuatan kursus AI.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form id="ai-form" onSubmit={handleUpdateAiConfig} className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] ml-1">Gemini API Key</label>
                                        <div className="relative group">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-accent transition-all" />
                                            <Input 
                                                type="password"
                                                className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-accent transition-all font-bold"
                                                placeholder="Masukkan Google Gemini API Key Anda"
                                                value={geminiKey}
                                                onChange={(e) => setGeminiKey(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end p-8">
                                <Button 
                                    type="submit" 
                                    form="ai-form" 
                                    disabled={aiSaving} 
                                    className="bg-accent hover:bg-accent/90 text-white rounded-2xl px-10 h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/10 transition-all active:scale-95"
                                >
                                    {aiSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> Simpan API Key</>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Security Section */}
                    <Card className="rounded-[40px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-8 px-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-ueu-blue/10 rounded-2xl text-ueu-blue">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-ueu-navy">Keamanan Akun</CardTitle>
                                    <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Perbarui akses login Anda.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form id="security-form" onSubmit={handleUpdatePassword} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] ml-1">Password Baru</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-ueu-blue transition-all" />
                                            <Input 
                                                type="password"
                                                className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-ueu-blue transition-all font-bold"
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Min. 6 karakter"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] ml-1">Konfirmasi Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-ueu-blue transition-all" />
                                            <Input 
                                                type="password"
                                                className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-ueu-blue transition-all font-bold"
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Ulangi password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end p-8">
                            <Button 
                                type="submit" 
                                form="security-form" 
                                disabled={securitySaving || !passwordForm.newPassword} 
                                className="bg-white hover:bg-slate-50 text-ueu-navy border border-slate-200 rounded-2xl px-10 h-14 font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
                            >
                                {securitySaving ? (
                                    <div className="w-5 h-5 border-2 border-ueu-navy/20 border-t-ueu-navy rounded-full animate-spin"></div>
                                ) : (
                                    <><Lock className="mr-2 h-4 w-4 text-ueu-blue" /> Perbarui Password</>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};