import React, { useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Receipt } from 'lucide-react';
import { AlertCircle, Loader2 } from 'lucide-react';
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
                const token = await getToken({ template: 'codehooks' });
                const response = await axios.get(apiEndpoint.GET_TRANSACTIONS, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setTransactions(response.data?.transactions || []);
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
        return `₹${(amount / 100).toFixed(2)}`;
    }
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    return (
        <DashboardLayout activeMenu="Transactions">
            <div className='p-6'>
                <div className='flex items-center gap-2 mb-6'>
                    <Receipt className='text-blue-600'/>
                    <h1 className='text-2xl font-bold'>Transactions History</h1>
                </div>
                {error && (
                    <div className='bg-red-50 text-red-700 mb-6 p-4 rounded flex items-center'>
                        <AlertCircle size={20}/>
                       <span>{error}</span> 
                    </div>
                )}

                {loading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Loader2 className='animate-spin mr-2' size={24}/>
                        <span>Loading transactions...</span>
                    </div>
                ):safeTransactions.length === 0 ? (
                    <div className='text-center text-gray-50 p-8 rounded-lg'>
                       <Receipt size={48} className='mx-auto mb-4 text-gray-400'/>
                       <h3 className='text-lg font-medium text-gray-700 mb-2'>No transactions found.</h3>
                       <p className='text-gray-500'>You haven't made any transactions yet. Visit the Subscription page to buy credits.</p>
                    </div>
                ) : (
                    // Render transactions list here
                    <div className='overflow-x-auto'>
                        <table className='min-w-full bg-white rounded-lg overflow-hidden shadow'>
                            <thead className='bg-gray-100'>
                                <tr>
                                    <th className='text-left text-gray-500 py-3 px-6 uppercase font-medium text-sm'>Date</th>
                                    <th className='text-left text-gray-500 py-3 px-6 uppercase font-medium text-sm'>Plan</th>
                                    <th className='text-left text-gray-500 py-3 px-6 uppercase font-medium text-sm'>Amount</th>
                                    <th className='text-left text-gray-500 py-3 px-6 uppercase font-medium text-sm'>Credits Added</th>
                                    <th className='text-left text-gray-500 py-3 px-6 uppercase font-medium text-sm'>Payment ID</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {safeTransactions.map((txn) => (
                                    <tr key={txn.id} className='hover:bg-gray-50'>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm text-gray-900'>{formatDate(txn.createdAt)}</td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm text-gray-900'>{txn.planName==='premium'
                                            ? "Premium Plan"
                                        :txn.planName==="ultimate" ? "Ultimate Plan" : "Basic Plan"}</td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm text-gray-900'>{formateAmount(txn.amount)}</td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm text-gray-900'>{txn.credits}</td>
                                        <td className='py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-500'>{txn.paymentId?txn.paymentId.substring(0,12)+ "..." : "N/A"}</td>
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