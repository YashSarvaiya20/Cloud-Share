import React, { useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Receipt, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import apiEndpoint from '../util/apiEndpoint';

const Transactions=()=>{
    const [transactions, setTransactions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const { getToken } = useAuth();
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await getToken();
                if (!token) {
                    throw new Error('User not authenticated');
                }
                const response = await axios.get(apiEndpoint.GET_TRANSACTIONS, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const transactionsData = Array.isArray(response.data)
                    ? response.data
                    : (Array.isArray(response.data?.transactions) ? response.data.transactions : []);
                setTransactions(transactionsData);
                setError(null);
            } catch (error) {
                setError('Failed to fetch transactions. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [getToken]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric',hour:'2-digit',minute:'2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    const formateAmount = (amount) => {
        return `₹${Number(amount || 0).toFixed(2)}`;
    }
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    return (
        <DashboardLayout activeMenu="Transactions">
            <div className='space-y-6 p-1 md:p-2'>
                <section className='glass-card p-6 md:p-7'>
                    <div className='flex items-center gap-2'>
                        <Receipt className='text-indigo-600'/>
                        <h1 className='section-title'>Transactions History</h1>
                    </div>
                    <p className='section-subtitle mt-1'>Track payments, plans, and credit top-ups.</p>
                </section>

                {error && (
                    <div className='border border-red-100 bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-2 text-sm font-medium'>
                        <AlertCircle size={20}/>
                       <span>{error}</span> 
                    </div>
                )}

                {loading ? (
                    <div className='surface-card p-5'>
                        <div className='mb-4 flex items-center gap-2 text-sm font-medium text-slate-600'>
                            <Loader2 className='animate-spin text-indigo-500' size={18}/>
                            <span>Loading transactions...</span>
                        </div>
                        <div className='space-y-3'>
                            <div className='skeleton h-14 w-full' />
                            <div className='skeleton h-14 w-full' />
                            <div className='skeleton h-14 w-[92%]' />
                        </div>
                    </div>
                ):safeTransactions.length === 0 ? (
                    <div className='glass-card p-10 text-center'>
                       <Receipt size={48} className='mx-auto mb-4 text-indigo-300'/>
                       <h3 className='text-lg font-semibold text-slate-700 mb-2'>No transactions found.</h3>
                       <p className='text-sm text-slate-500'>You have not made any purchases yet. Visit Subscription to buy credits.</p>
                    </div>
                ) : (
                    <div className='glass-card overflow-hidden px-3 py-3'>
                        <table className='min-w-full border-separate border-spacing-y-2'>
                            <thead>
                                <tr>
                                    <th className='text-left text-slate-500 py-2 px-6 uppercase font-semibold text-xs tracking-wider'>Date</th>
                                    <th className='text-left text-slate-500 py-2 px-6 uppercase font-semibold text-xs tracking-wider'>Plan</th>
                                    <th className='text-left text-slate-500 py-2 px-6 uppercase font-semibold text-xs tracking-wider'>Amount</th>
                                    <th className='text-left text-slate-500 py-2 px-6 uppercase font-semibold text-xs tracking-wider'>Credits Added</th>
                                    <th className='text-left text-slate-500 py-2 px-6 uppercase font-semibold text-xs tracking-wider'>Payment ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeTransactions.map((txn) => (
                                    <tr key={txn.id} className='bg-white shadow-[0_8px_25px_-20px_rgba(15,23,42,0.45)] hover:bg-slate-50/70'>
                                        <td className='rounded-l-2xl py-4 px-6 whitespace-nowrap text-sm text-slate-900'>{formatDate(txn.transactionDate)}</td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm text-slate-900'>
                                            <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700'>
                                              <Sparkles size={12} />
                                              {txn.planId==='premium' ? "Premium" :txn.planId==="ultimate" ? "Ultimate" : "Basic"}
                                            </span>
                                        </td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-900'>{formateAmount(txn.amount)}</td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm text-slate-900'>{txn.creditsAdded ?? 0}</td>
                                        <td className='rounded-r-2xl py-4 px-6 whitespace-nowrap text-sm font-medium text-slate-500'>{txn.paymentId?txn.paymentId.substring(0,12)+ "..." : "N/A"}</td>
                                        </tr>
                                ))}
                            </tbody>
                                
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
export default Transactions;