
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Prerequisite, Course, Module, Lesson } from '../../types';
import { CheckCircle, Calendar, Percent, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PrerequisiteSelectorProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    course: Course;
    targetId: string; // The ID of the module/lesson we are adding rules to
    targetType: 'module' | 'lesson';
    existingRules: Prerequisite[];
    onSave: (rules: Prerequisite[]) => void;
}

export const PrerequisiteSelector: React.FC<PrerequisiteSelectorProps> = ({
    open, onOpenChange, course, targetId, targetType, existingRules, onSave
}) => {
    const [rules, setRules] = useState<Prerequisite[]>(existingRules || []);
    const [mode, setMode] = useState<'list' | 'add'>('list');
    
    // Form State
    const [type, setType] = useState<'completion' | 'grade' | 'date'>('completion');
    const [selectedTarget, setSelectedTarget] = useState('');
    const [minScore, setMinScore] = useState(70);
    const [date, setDate] = useState('');

    const flattenSyllabus = () => {
        const items: { id: string; title: string; type: 'module' | 'lesson'; parentId?: string }[] = [];
        let targetFound = false;

        // Iterate course to only show items BEFORE the current target to prevent circular logic
        for (const mod of course.syllabus) {
            if (targetType === 'module' && mod.id === targetId) {
                targetFound = true;
                break;
            }
            
            items.push({ id: mod.id, title: `Module: ${mod.title}`, type: 'module' });

            for (const lesson of mod.lessons) {
                if (targetType === 'lesson' && lesson.id === targetId) {
                    targetFound = true;
                    break;
                }
                items.push({ id: lesson.id, title: `Lesson: ${lesson.title}`, type: 'lesson', parentId: mod.id });
            }
            if (targetFound) break;
        }
        return items;
    };

    const eligibleItems = flattenSyllabus();

    const handleAddRule = () => {
        const newRule: Prerequisite = { type };
        
        if (type === 'completion' || type === 'grade') {
            if (!selectedTarget) return;
            const item = eligibleItems.find(i => i.id === selectedTarget);
            newRule.targetId = selectedTarget;
            newRule.targetTitle = item?.title;
        }

        if (type === 'grade') {
            newRule.minScore = Number(minScore);
        }

        if (type === 'date') {
            if (!date) return;
            newRule.date = new Date(date).toISOString();
        }

        setRules([...rules, newRule]);
        setMode('list');
        // Reset form
        setSelectedTarget('');
        setMinScore(70);
        setDate('');
    };

    const handleRemoveRule = (index: number) => {
        const newRules = [...rules];
        newRules.splice(index, 1);
        setRules(newRules);
    };

    const handleSave = () => {
        onSave(rules);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Batasan Akses</DialogTitle>
                    <DialogDescription>
                        Tentukan kondisi yang harus dipenuhi sebelum mahasiswa dapat mengakses konten ini.
                    </DialogDescription>
                </DialogHeader>

                {mode === 'list' ? (
                    <div className="space-y-4">
                        {rules.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed text-slate-500 text-sm">
                                Belum ada batasan. Konten terbuka untuk diakses.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {rules.map((rule, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                {rule.type === 'completion' && <CheckCircle className="h-4 w-4" />}
                                                {rule.type === 'grade' && <Percent className="h-4 w-4" />}
                                                {rule.type === 'date' && <Calendar className="h-4 w-4" />}
                                            </div>
                                            <div className="text-sm">
                                                {rule.type === 'completion' && <span>Harus menyelesaikan <strong>{rule.targetTitle || 'Item Tidak Dikenal'}</strong></span>}
                                                {rule.type === 'grade' && <span>Nilai minimal {rule.minScore}% pada <strong>{rule.targetTitle}</strong></span>}
                                                {rule.type === 'date' && <span>Tersedia setelah <strong>{rule.date ? new Date(rule.date).toLocaleDateString() : 'N/A'}</strong></span>}
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleRemoveRule(idx)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button onClick={() => setMode('add')} className="w-full border-dashed" variant="outline">
                            Tambah Syarat
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-2">
                            {['completion', 'grade', 'date'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t as any)}
                                    className={cn(
                                        "p-2 text-xs font-medium border rounded-md capitalize transition-all",
                                        type === t ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white hover:bg-slate-50"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {type === 'completion' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Konten Wajib</label>
                                <select 
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedTarget}
                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                >
                                    <option value="">Pilih modul atau pelajaran...</option>
                                    {eligibleItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {type === 'grade' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Kuis/Tugas Wajib</label>
                                    <select 
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={selectedTarget}
                                        onChange={(e) => setSelectedTarget(e.target.value)}
                                    >
                                        <option value="">Pilih item...</option>
                                        {/* Filter specifically for lessons that are quizzes/assignments */}
                                        {eligibleItems.filter(i => i.title.toLowerCase().includes('quiz') || i.title.toLowerCase().includes('assignment')).map(item => (
                                            <option key={item.id} value={item.id}>{item.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nilai Minimum (%)</label>
                                    <Input type="number" min="0" max="100" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
                                </div>
                            </>
                        )}

                        {type === 'date' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tersedia Mulai</label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setMode('list')}>Batal</Button>
                            <Button onClick={handleAddRule}>Tambah Aturan</Button>
                        </div>
                    </div>
                )}

                {mode === 'list' && (
                    <DialogFooter>
                        <Button onClick={handleSave}>Simpan Perubahan</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
