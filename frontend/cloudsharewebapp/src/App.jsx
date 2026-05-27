import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import { SignedOut } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { UserCreditsProvider } from './context/UserCreditsContext.jsx';
import { Navigate, useLocation } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Upload = lazy(() => import('./pages/Upload.jsx'));
const MyFiles = lazy(() => import('./pages/MyFiles.jsx'));
const Subscpription = lazy(() => import('./pages/Subscription.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const PublicFileView = lazy(() => import('./pages/PublicFileViex.jsx'));
const ShareFileView = lazy(() => import('./pages/ShareFileView.jsx'));
const SignInPage = lazy(() => import('./pages/SignInPage.jsx'));
const SignUpPage = lazy(() => import('./pages/SignUpPage.jsx'));

const RouteFallback = () => (
  <div className="app-shell-bg flex min-h-screen items-center justify-center p-6">
    <div className="glass-card w-full max-w-md p-5">
      <div className="skeleton h-5 w-1/2" />
      <div className="skeleton mt-3 h-4 w-full" />
      <div className="skeleton mt-2 h-4 w-4/5" />
    </div>
  </div>
);

const PageTransition = ({ children }) => <>{children}</>;

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
        <Route path='/' element={<PageTransition><Suspense fallback={<RouteFallback/>}><Landing/></Suspense></PageTransition>}/>
        <Route path='/sign-in' element={
          <>
            <SignedOut><PageTransition><Suspense fallback={<RouteFallback/>}><SignInPage/></Suspense></PageTransition></SignedOut>
            <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
          </>
        }/>
        <Route path='/sign-up' element={
          <>
            <SignedOut><PageTransition><Suspense fallback={<RouteFallback/>}><SignUpPage/></Suspense></PageTransition></SignedOut>
            <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
          </>
        }/>
        <Route path='/dashboard' element={
          <>
          <SignedIn><PageTransition><Suspense fallback={<RouteFallback/>}><Dashboard/></Suspense></PageTransition></SignedIn>
          <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        }/>
        <Route path='/upload' element={
          <>
          <SignedIn><PageTransition><Suspense fallback={<RouteFallback/>}><Upload/></Suspense></PageTransition></SignedIn>
          <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        }/>
        <Route path='/myfiles' element={
          <>
          <SignedIn><PageTransition><Suspense fallback={<RouteFallback/>}><MyFiles/></Suspense></PageTransition></SignedIn>
          <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        }/>
        <Route path='/subscription' element={
          <>
          <SignedIn><PageTransition><Suspense fallback={<RouteFallback/>}><Subscpription/></Suspense></PageTransition></SignedIn>
          <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        }/>
        <Route path='/transactions' element={
          <>
          <SignedIn><PageTransition><Suspense fallback={<RouteFallback/>}><Transactions/></Suspense></PageTransition></SignedIn>
          <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        }/>
        <Route path='/share/:token' element={<PageTransition><Suspense fallback={<RouteFallback/>}><ShareFileView/></Suspense></PageTransition>} />
        <Route path='file/:fileId' element={<PageTransition><Suspense fallback={<RouteFallback/>}><PublicFileView/></Suspense></PageTransition>} />
        <Route path='/*' element={<Navigate to="/sign-in" replace />}/>
    </Routes>
  );
};

const App=()=>{
  return(
    <UserCreditsProvider>
   <BrowserRouter>
   <Toaster/>
    <AnimatedRoutes/>
   </BrowserRouter>
   </UserCreditsProvider>
  )
}
export default App;   