import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import {  createContext,  useCallback } from "react";
import { useState } from "react";
import apiEndpoint from "../util/apiEndpoint.js";
import React from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";

 export const UserCreditsContext=createContext();

 export const UserCreditsProvider=({children})=> {
    const [credits,setCredits]=useState(5);
    const [loading,setLoading]=useState(false);
    const {getToken,isSignedIn}=useAuth();

    //Function to fetch user credits from anywhere in the app

    const fetchUserCredits=useCallback(async()=>{
        if(!isSignedIn) return;
        setLoading(true);
        try{
            const token=await getToken();
            if (!token) return;
          const response= await axios.get(apiEndpoint.GET_CREDITS,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
                });
                if(response.status === 200){
                setCredits(response.data.credits);
                }else {
                    toast.error("Failed to fetch user credits");
                }
        }catch(error){
            console.error("Error fetching user credits:",error);
        }finally{
            setLoading(false);   
        }
},[getToken,isSignedIn]);

     const updateCredits=useCallback((newCredits)=>{
        console.log("Updating credits to:",newCredits);
        setCredits(newCredits);
    }, []);

    const contextVAlue={
        credits,
        setCredits,
        fetchUserCredits,
        updateCredits
    }
    useEffect(()=>{
        if(isSignedIn) fetchUserCredits();
    }, [fetchUserCredits,isSignedIn]);
   
    return(
        <UserCreditsContext.Provider value={contextVAlue}>
            {children}
        </UserCreditsContext.Provider>
    )
 }