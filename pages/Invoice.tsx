
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Printer, BookOpen } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import { Transaction } from '../types';
import { Button } from '../components/ui/Button';
import { useCurrency } from '../hooks/useCurrency';

export const Invoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const { formatAmount } = useCurrency();

    useEffect(() => {
        const fetchTx = async () => {
            if (!id) return;
            try {
                const data = await paymentService.getTransactionById(id);
                setTransaction(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTx();
    }, [id]);

    if (loading) return <LoadingScreen />;
    if (!transaction) return <div className="p-8 text-center">Invoice not found</div>;

    const currencyCode = transaction.currencyCode === 'IDR' ? 'IDR' : 'USD';

    const handlePrint = () => {
        window.print();
    };

    return (
        <PageWrapper className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:p-0">
            {/* No-Print Header */}
            <div className="max-w-3xl mx-auto mb-6 flex justify-end print:hidden">
                <Button onClick={handlePrint} className="bg-slate-900 text-white hover:bg-slate-800">
                    <Printer className="h-4 w-4 mr-2" /> Print Invoice
                </Button>
            </div>

            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden print:shadow-none print:rounded-none">
                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white p-2 rounded-lg print:bg-indigo-600 print:text-white">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-slate-900">Esa Unggul</span>
                        </div>
                        <div className="text-right">
                            <h1 className="text-xl font-bold text-slate-300 uppercase tracking-widest mb-1">Invoice</h1>
                            <p className="font-mono text-sm text-slate-500">#{transaction.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex justify-between mb-12">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                            <p className="font-bold text-slate-900">{transaction.userName}</p>
                            <p className="text-sm text-slate-500">{transaction.userEmail}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details</h3>
                            <div className="text-sm text-slate-600">
                                <p><span className="text-slate-400 mr-2">Date:</span> {new Date(transaction.createdAt).toLocaleDateString()}</p>
                                <p><span className="text-slate-400 mr-2">Status:</span> <span className="uppercase font-bold text-slate-900">{transaction.status}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Description</th>
                                    <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Type</th>
                                    <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-600">
                                {transaction.items?.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0">
                                        <td className="py-4 font-medium text-slate-900">{item.title}</td>
                                        <td className="py-4 text-right capitalize text-slate-500">{item.itemType}</td>
                                        <td className="py-4 text-right font-medium text-slate-900">{formatAmount(item.priceCurrency ?? item.price, currencyCode)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total */}
                    <div className="flex justify-end border-t border-slate-900 pt-6">
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
                            <p className="text-3xl font-bold text-slate-900">{formatAmount(transaction.totalAmountCurrency ?? transaction.totalAmount, currencyCode)}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-8 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 font-medium">Thank you for learning with Esa Unggul.</p>
                    <p className="text-xs text-slate-400 mt-2">Universitas Esa Unggul • Jakarta, Indonesia • support@esaunggul.ac.id</p>
                </div>
            </div>
        </PageWrapper>
    );
};
