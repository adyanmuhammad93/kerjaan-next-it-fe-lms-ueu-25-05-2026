import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, LogOut, BookOpen, Globe, Compass, BarChart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/Command";
import { Badge } from './ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { useCurrency } from '../hooks/useCurrency';
import { Notifications } from './Notifications';

export const Navbar: React.FC = () => {
  const { user, cart, courses } = useStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { currency, setCurrency, allCurrencies } = useCurrency();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const publishedCourses = courses.filter(c => c.isPublished);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center px-6">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6 lg:gap-12">
            <Link 
              to="/" 
              className="flex items-center gap-4 focus-visible:ring-2 focus-visible:ring-ueu-blue rounded-2xl p-1 transition-all hover:opacity-80"
            >
              {/* Logo Gabungan */}
              <img
                src="/ueu-asu-logo.svg"
                alt="Universitas Esa Unggul powered by Arizona State University"
                className="h-12 w-auto max-w-[220px] sm:max-w-[260px]"
              />
            </Link>

            {/* Link Navigasi */}
            <div className="hidden xl:flex items-center gap-2">
              <Link to="/browse">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/5 h-11 px-6 rounded-2xl transition-all">
                  Program Studi
                </Button>
              </Link>
              <Link to="/admission">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/5 h-11 px-6 rounded-2xl transition-all">
                  Pendaftaran
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Dock */}
          <div className="flex-1 max-w-sm ml-8 hidden lg:block">
            <button
              type="button"
              className="flex h-12 w-full items-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 px-5 text-slate-600 transition-all hover:bg-slate-100 hover:text-ueu-navy focus-visible:ring-2 focus-visible:ring-ueu-blue/40 focus-visible:ring-offset-2 outline-none"
              onClick={() => setOpen(true)}
              aria-label="Buka pencarian program"
            >
              <Search className="h-4 w-4 text-ueu-blue" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cari Program...</span>
              <kbd className="ml-auto pointer-events-none inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-mono text-[9px] border border-slate-100 shadow-sm font-black">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Utilities */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-2xl text-ueu-navy hover:text-ueu-blue" onClick={() => setOpen(true)} aria-label="Buka pencarian program">
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 rounded-2xl gap-3 px-4 text-ueu-navy hover:bg-slate-50 hover:text-ueu-navy border border-transparent hover:border-slate-100 transition-all" aria-label={`Pilih mata uang, saat ini ${currency.code}`}>
                  <Globe className="h-4 w-4 text-ueu-blue" aria-hidden="true" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{currency.code}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-[28px] p-2 bg-white shadow-2xl border-slate-100">
                {allCurrencies.map((c) => (
                  <DropdownMenuItem key={c.code} onSelect={() => setCurrency(c.code)} className="rounded-2xl py-3 px-4 cursor-pointer focus:bg-ueu-blue/5 outline-none transition-all mb-1 last:mb-0">
                    <span className="text-xs font-black text-ueu-navy uppercase tracking-widest">{c.code}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/checkout" className="relative group">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all" aria-label={`Keranjang belanja, ${cart.length} item`}>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {cart.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-white shadow-sm" />
                )}
              </Button>
            </Link>

            <div className="w-[1px] h-6 bg-slate-100 mx-2 hidden sm:block" />

            {user ? (
              <div className="flex items-center gap-3">
                <Notifications />
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="h-11 w-11 rounded-2xl border border-slate-100 hover:border-ueu-blue/30 transition-all overflow-hidden bg-slate-50 flex-shrink-0 shadow-sm relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ueu-blue/40 focus-visible:ring-offset-2" aria-label="Buka menu akun">
                            {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={`Avatar ${user.name}`} className="h-full w-full object-cover" />
                            ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-black text-ueu-navy uppercase tracking-widest">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 rounded-[40px] shadow-2xl border-slate-100 overflow-hidden p-0 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="px-8 py-8 bg-slate-50/80 border-b border-slate-100">
                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-black text-ueu-navy uppercase tracking-widest leading-none">{user.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="p-3">
                            <DropdownMenuItem asChild>
                                <Link to="/dashboard" className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500 hover:bg-ueu-blue/5 hover:text-ueu-blue rounded-[24px] outline-none transition-all group">
                                    <BarChart className="h-4 w-4 transition-transform group-hover:scale-110" /> Dashboard
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={logout} className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[3px] text-red-500 hover:bg-red-50 rounded-[24px] outline-none cursor-pointer transition-all">
                                <LogOut className="h-4 w-4" /> Keluar
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" className="h-11 px-6 rounded-2xl text-ueu-navy hover:bg-slate-50 hover:text-ueu-navy font-black text-[10px] uppercase tracking-widest transition-all">
                    Masuk
                  </Button>
                </Link>
                <Link to="/admission">
                  <Button className="h-11 px-8 rounded-2xl bg-ueu-blue text-white hover:bg-ueu-navy hover:shadow-xl hover:shadow-blue-900/10 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    Daftar Baru
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Command Palette Bahasa Indonesia */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari program studi..." aria-label="Cari program studi" className="h-14 border-none" />
        <CommandList className="max-h-[350px] p-2">
          <CommandEmpty>Hasil tidak ditemukan.</CommandEmpty>
          <CommandGroup heading="Akses Cepat">
            <CommandItem onSelect={() => runCommand(() => navigate('/browse'))} className="rounded-xl py-3 px-4 aria-selected:bg-[#D7E8CD] aria-selected:text-ueu-navy">
              <Compass className="mr-3 h-5 w-5 text-ueu-blue" aria-hidden="true" />
              <span className="font-bold text-slate-700 group-aria-selected:text-ueu-navy">Jelajahi Semua Program</span>
            </CommandItem>
          </CommandGroup>
          {publishedCourses.length > 0 && (
            <CommandGroup heading="Program Akademik">
              {publishedCourses.map((course) => (
                 <CommandItem 
                    key={course.id} 
                    onSelect={() => runCommand(() => navigate(`/course/${course.id}`))}
                    className="rounded-xl py-3 px-4 aria-selected:bg-[#D7E8CD] aria-selected:text-ueu-navy mb-1"
                  >
                    <BookOpen className="mr-3 h-5 w-5 text-ueu-blue opacity-100" aria-hidden="true" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-800">{course.title}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{course.category}</span>
                    </div>
                 </CommandItem> 
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};