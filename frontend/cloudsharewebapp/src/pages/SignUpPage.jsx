import React from "react";
import { Link } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { Sparkles, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

const SignUpPage = () => {
  return (
    <div className="app-shell-bg min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-card relative overflow-hidden p-7 md:p-10"
        >
          <div className="absolute -left-10 top-20 h-40 w-40 rounded-full bg-purple-500/20 blur-2xl" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles size={14} />
              Back to Home
            </Link>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Create Your CloudShare Account
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              Start uploading and sharing instantly with your secure SaaS workspace.
            </p>

            <div className="surface-card mt-6 flex items-center gap-3 p-3.5">
              <UserPlus size={18} className="text-indigo-500" />
              <p className="text-sm font-medium text-slate-700">Free credits included for every new account</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card flex items-center justify-center p-5 md:p-8"
        >
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                card: "shadow-none border border-slate-200 bg-white",
                headerTitle: "text-slate-900",
                headerSubtitle: "text-slate-500",
                socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50",
                formFieldInput: "border-slate-200 focus:border-indigo-400 focus:ring-indigo-200",
                formButtonPrimary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:opacity-95",
                footerActionText: "text-slate-500",
                footerActionLink: "text-indigo-600 hover:text-indigo-700",
              },
            }}
          />
        </motion.section>
      </div>
    </div>
  );
};

export default SignUpPage;
