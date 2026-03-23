import React from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import MyFiles from './pages/MyFiles.jsx';
import Subscpription from './pages/Subscription.jsx';
import Transactions from './pages/Transactions.jsx';
import PublicFileView from './pages/PublicFileViex.jsx';
import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { RedirectToSignIn, SignedIn } from '@clerk/clerk-react';
import { SignedOut } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { User } from 'react-feather';
import { UserCreditsProvider } from './context/UserCreditsContext.jsx';
const App=()=>{
  return(
    <UserCreditsProvider>
   <BrowserRouter>
   <Toaster/>
    <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/dashboard' element={
        <>
        <SignedIn><Dashboard/></SignedIn>
        <SignedOut><RedirectToSignIn/></SignedOut>
        </>
      }/>
      <Route path='/upload' element={
        <>
        <SignedIn><Upload/></SignedIn>
        <SignedOut><RedirectToSignIn/></SignedOut>
        </>
      }/>
      <Route path='/myfiles' element={
        <>
        <SignedIn><MyFiles/></SignedIn>
        <SignedOut><RedirectToSignIn/></SignedOut>
        </>
      }/>
      <Route path='/subscription' element={
        <>
        <SignedIn><Subscpription/></SignedIn>
        <SignedOut><RedirectToSignIn/></SignedOut>
        </>
      }/>
      <Route path='/transactions' element={
        <>
        <SignedIn><Transactions/></SignedIn>
        <SignedOut><RedirectToSignIn/></SignedOut>
        </>
      }/>
      <Route path='file/:fileId' element={
        <>
          <PublicFileView/>
        </>
      }/>
      <Route path='/*' element={<RedirectToSignIn/>}/>
    </Routes>
   </BrowserRouter>
   </UserCreditsProvider>
  )
}
export default App;   