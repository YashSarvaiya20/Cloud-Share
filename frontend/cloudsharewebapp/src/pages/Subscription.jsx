import React, { useEffect, useRef, useContext, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Check, CreditCard, AlertCircle } from 'react-feather';
import { Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { UserCreditsContext } from '../context/UserCreditsContext';
import apiEndpoint from '../util/apiEndpoint';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';

const Subscription = () => {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { credits, fetchUserCredits, updateCredits } = useContext(UserCreditsContext);
  const { getToken } = useAuth();
  const razorpayScriptRef = useRef(null);

  const {user}=useUser();
    const plans = [
  {
    id: "basic",
    name: "Basic",
    credits: 100,
    price: 0,
    features: [
      "Upload up to 100 files",
      "Access to basic features",
      "Community support",
    ],
    recommended: false,
  },
  {
    id: "premium",
    name: "Premium",
    credits: 500,
    price: 500, // INR
    features: [
      "Upload up to 500 files",
      "Access to all basic features",
      "Priority support",
    ],
    recommended: false,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    credits: 5000,
    price: 2500, // INR
    features: [
      "Upload up to 5000 files",
      "Access to all premium features",
      "Priority support",
      "Advanced analytics",
    ],
    recommended: true,
  },
];
    useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        setRazorpayLoaded(true);
      };

      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        setMessage(
          "Payment gateway failed to load. Please refresh the page and try again."
        );
        setMessageType("error");
      };

      document.body.appendChild(script);
      razorpayScriptRef.current = script;
    } else {
      setRazorpayLoaded(true);
    }

    // cleanup
    return () => {
      if (razorpayScriptRef.current) {
        document.body.removeChild(razorpayScriptRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (fetchUserCredits) {
      fetchUserCredits();
    }
  }, [fetchUserCredits]);

    const handlePurchase = async (plan) => {
        if(!razorpayLoaded){
            setMessage('Payment gateway is still loading. Please try again.');
            setMessageType('error');
            return;
        }
        if (plan.price === 0) {
            setMessage('The Basic plan is already included with your account.');
            setMessageType('info');
            return;
        }
        setProcessingPayment(true);
        setMessage('');
       try{
        // Simulate API call to create order and get Razorpay options
        const token = await getToken();
        if (!token) {
          throw new Error('User not authenticated');
        }
        const response=await axios.post(apiEndpoint.CREATE_ORDER,{
            planId:plan.id,
            amount:plan.price,
            currency:'INR',
            credits:plan.credits
        },{
            headers:{
                Authorization:`Bearer ${token}`
            }
         }
        );

        if (!response.data?.success || !response.data?.orderId) {
          throw new Error(response.data?.message || 'Failed to create payment order');
        }
       
      const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: plan.price * 100,
          currency: 'INR',
          name: 'CloudShare',
          description: `Purchase ${plan.name} credits`,
          order_id: response.data.orderId,
          handler: async function (response) {
              try {
                  // Simulate API call to verify payment
                  const verifyToken = await getToken();
                  const verifyResponse = await axios.post(apiEndpoint.VERIFY_PAYMENT, {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      planId: plan.id
                  },{
                      headers:{
                          Authorization:`Bearer ${verifyToken}`
                      }
                  });
                  if (verifyResponse.data.success) {
                      const updatedCredits = verifyResponse.data.newCreditBalance ?? verifyResponse.data.credits;
                      if (typeof updatedCredits === 'number') {
                        updateCredits(updatedCredits);
                      }
                      await fetchUserCredits();
                      setMessage(`Payment successful! ${plan.name} plan activated. Credits updated.`);
                      setMessageType('success');
                  }else{
                      setMessage(verifyResponse.data?.message || 'Payment verification failed. Please contact support if you were charged.');
                      setMessageType('error');
                  }
              } catch(error){
                    setMessage(error?.response?.data?.message || 'Failed to process payment. Please try again.');
                  setMessageType('error');
              } 
          },
            prefill: {
                name:user.fullName,
                email:user.primaryEmailAddress
            },
            theme: {
                color: '#3B82F6'
            }
      };
      if(window.Razorpay){
          const rzp = new window.Razorpay(options);
          rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }
       }catch(error){
        setMessage(error?.response?.data?.message || error?.message || 'Failed to initiate payment. Please try again later.');
        setMessageType('error');
       }finally{
         setProcessingPayment(false);
       }
    };

    return (
       <DashboardLayout activeMenu="Subscription">
            <div className='space-y-6 p-1 md:p-2'>
            <section className='glass-card p-6 md:p-7'>
              <h1 className='section-title mb-1'>Subscription Plans</h1>
              <p className='section-subtitle'>Choose a plan that scales with your workflow.</p>

              <div className='mt-5 grid gap-3 sm:grid-cols-2'>
                <div className='surface-card p-4'>
                  <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    <CreditCard size={14} />
                    Current Credits
                  </div>
                  <p className='mt-2 text-2xl font-bold text-slate-900'>{credits}</p>
                </div>
                <div className='surface-card p-4'>
                  <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    <ShieldCheck size={14} />
                    Billing
                  </div>
                  <p className='mt-2 text-sm font-semibold text-slate-800'>Secure Razorpay checkout</p>
                </div>
              </div>
            </section>

            {message&& (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium ${messageType === 'error' ? 'border-red-100 bg-red-50 text-red-700' : messageType==='success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-indigo-100 bg-indigo-50 text-indigo-700'}`}>
                    {messageType === 'error' && <AlertCircle size={20}/>}
                    {message}
                </div>
            )}

            <div className='grid gap-6 lg:grid-cols-3'>
                {plans.map((plan)=>(
                    <div key={plan.id} className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${plan.recommended ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-[0_20px_35px_-25px_rgba(79,70,229,0.7)]' : 'border-slate-200 bg-white hover:border-indigo-100 hover:shadow-[0_20px_35px_-25px_rgba(59,130,246,0.4)]'}`}>
                        {plan.recommended && (
                          <div className='absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white'>
                            <Sparkles size={12} /> Recommended
                          </div>
                        )}

                        <h3 className='text-xl font-bold text-slate-900 mb-2'>{plan.name}</h3>
                        <div className='mb-4'>
                            <span className='text-3xl font-bold text-slate-900'>₹{plan.price}</span>
                            <span className=' text-slate-500'> for {plan.credits} credits</span>
                        </div>

                        <ul className='mb-6 space-y-2.5'>
                            {plan.features.map((feature,index)=>(
                                <li key={index} className='flex items-center text-sm text-slate-700'>
                                    <Check size={18} className='text-green-500 mr-2 flex-shrink-0'/>
                                   <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button onClick={() => handlePurchase(plan)} disabled={processingPayment} className={`w-full ${plan.recommended ? 'btn-primary' : 'btn-secondary'} disabled:opacity-50`}>
                            {processingPayment ? (
                                <>
                                <Loader2 size={16} className='animate-spin' />
                                        <span>Processing...</span>  
                                </>
                            ) : (
                                <span>Purchase Plan</span>
                            )}
                        </button>
                    </div>
                ))}
                </div>

                <div className='surface-card p-5'>
                  <h3 className='font-semibold text-slate-900 mb-2'>How credits work</h3>
                  <p className='text-sm text-slate-600'>
                        Each file upload consumes 1 credit.New users start with 5 free credits.
                        Credits never expire and can be used at any time. If you run out of credits, you can purchase more through one of our plans above.
                    </p>
                </div>

            </div>
        </DashboardLayout>
    )
}
export default Subscription;