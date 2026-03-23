import React, { use } from 'react';
import TestimonialSection from '../components/landing/TestimonialSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import FooterSection from '../components/landing/FooterSection';
import HeroSection from '../components/landing/HeroSection';
import CTASection from '../components/landing/CTASection';
import { features, testimonials } from '../assets/data';
import { pricingPlans } from '../assets/data';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
const Landing=()=>{
    const {openSignIn,openSignUp}=useClerk();
    const {isSignedIn}=useUser();
    const navigate=useNavigate();

    useEffect(()=>{
      if(isSignedIn){
        navigate('/dashboard');
      }
    }, [isSignedIn, navigate]);
    return (
        <div className='landing-page bg-gradient-to-b from bg-gray-50 to-gray-100'>
          
           <HeroSection openSignIn={openSignIn} openSignUp={openSignUp} />

            <FeaturesSection features={features}/>

            {/* pricing section */}
            <PricingSection pricingPlans={pricingPlans} openSignUp={openSignUp} />

            {/* Testimonial section */}
            <TestimonialSection testimonials={testimonials}/>

            {/* CTA section */}
            <CTASection openSignUp={openSignUp}/>
            {/* Footer section */}
            <FooterSection/>
        </div>
    )
}
export default Landing; 