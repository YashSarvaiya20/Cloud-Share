import React, { useEffect, useRef, useContext, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Check, CreditCard, AlertCircle } from 'react-feather';
import { Loader2 } from 'lucide-react';
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
  const { credits, fetchUserCredits, setCredits } = useContext(UserCreditsContext);
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
        const token=await getToken({ template: 'codehooks' });
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
                  const verifyResponse = await axios.post(apiEndpoint.VERIFY_PAYMENT, {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      planId: plan.id
                  },{
                      headers:{
                          Authorization:`Bearer ${token}`
                      }
                  });
                  if (verifyResponse.data.success) {
                      if(verifyResponse.data.creditsAdded){
                          console.log('Updating credits to:', verifyResponse.data.newCreditBalance);
                          setCredits(verifyResponse.data.newCreditBalance);
                      }else{
                          console.log('Credits not in response, fetching updated credits from server');
                         await fetchUserCredits();
                      }
                      setMessage(`Payment successful! ${plan.name} plan activated.`);
                      setMessageType('success');
                  }else{
                      setMessage('Payment verification failed. Please contact support if you were charged.');
                      setMessageType('error');
                  }
              } catch(error){
                  setMessage('Failed to process payment. Please try again.');
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
        setMessage('Failed to initiate payment. Please try again later.');
        setMessageType('error');
       }finally{
         setProcessingPayment(false);
       }
    };

    return (
       <DashboardLayout activeMenu="Subscription">
            <div className='p-6'>
            <h1 className='text-2xl font-bold mb-4'>Subscription Plans</h1>
            <p className='text-gray-600 mb-6'>Choose a plan that works for you</p>
            {message&& (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${messageType === 'error' ? 'bg-red-50 text-red-700' : messageType==='success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {messageType === 'error' && <AlertCircle size={20}/>}
                    {message}
                </div>
            )}

            <div className='flex flex-col md:flex-row gap-6 mb-8'>
                <div className='bg-blue-50 p-6 rounded-lg'>
                    <div className='flex items-center gap-2 mb-4'>
                        <CreditCard className='text-purple-500'/>
                        <h2 className='text-lg font-medium'>Current Credits: <span className='font-bold text-purple-500'>{credits}</span></h2>
                    </div>
                    <p className='text-sm text-gray-600 mt-2'>You can upload {credits} more files with your current credits.</p>
                </div>
            </div>
            <div className='grid md:grid-cols-2 gap-6'>
                {plans.map((plan)=>(
                    <div key={plan.id} className={`border rounded-xl p-6 ${plan.recommended ? 'border-purple-200 bg-purple-50 shadow-md' : 'border-gray-200 bg-white'}`}>
                        {plan.recommended && <div className='inline-block bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg'>Recommended</div>}
                        <h3 className='text-xl font-bold mb-4'>{plan.name}</h3>
                        <div className='mt-2 mb-4'>
                            <span className='text-3xl font-bold'>₹{plan.price}</span>
                            <span className=' text-gray-500'> for {plan.credits}</span>
                        </div>
                        <ul className='mb-6 space-y-3'>
                            {plan.features.map((feature,index)=>(
                                <li key={index} className='flex items-center'>
                                    <Check size={18} className='text-green-500 mr-2 flex-shrink-0'/>
                                   <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => handlePurchase(plan)} disabled={processingPayment} className={`w-full py-2 rounded-md transition-colors font-medium ${plan.recommended ?  'bg-purple-500 hover:bg-purple-600 text-white':'bg-white border border-purple-500 text-purple-500 hover:bg-purple-50'} disabled:opacity-50 flex items-center justify-center gap-2`}>
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

                <div className='mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200'>
                    <h3 className='font-medium mb-2'>How credits work</h3>
                    <p className='text-sm text-gray-600'>
                        Each file upload consumes 1 credit.New users start with 5 free credits.
                        Credits never expire and can be used at any time. If you run out of credits, you can purchase more through one of our plans above.
                    </p>
                </div>

            </div>
        </DashboardLayout>
    )
}
export default Subscription;