import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ListInputProps { 
    label: string;
    placeholder: string;
    items?: string[];
    onChange: (items: string[]) => void;
}

export const ListInput: React.FC<ListInputProps> = ({ label, placeholder, items = [], onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault();
        if (inputValue.trim()) {
            onChange([...items, inputValue.trim()]);
            setInputValue('');
        }
    };

    const handleDelete = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    return (
        <div className="space-y-4">
            <label className="text-[13px] font-bold text-ueu-navy ml-1">{label}</label>
            <div className="flex gap-3">
                <Input 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    placeholder={placeholder}
                    className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-medium placeholder:text-slate-300"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAdd(e);
                        }
                    }}
                />
                <Button 
                    type="button" 
                    onClick={handleAdd} 
                    className="h-14 px-8 rounded-2xl bg-slate-100 text-ueu-navy font-bold hover:bg-slate-200 transition-all"
                    variant="ghost"
                >
                    Tambah
                </Button>
            </div>
            <ul className="space-y-3">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-violet-100 group">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                            <span>{item}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => handleDelete(idx)} 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </li>
                ))}
                {items.length === 0 && (
                    <li className="p-8 border-2 border-dashed border-slate-100 rounded-[28px] text-center">
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Belum ada item ditambahkan</p>
                    </li>
                )}
            </ul>
        </div>
    );
};
