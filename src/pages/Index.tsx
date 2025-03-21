
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LockIcon, MessageSquareIcon, ShieldIcon } from "lucide-react";

const Index = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SafeChat Crypt</h1>
          <div className="space-x-2">
            {currentUser ? (
              <Link to="/chat">
                <Button variant="default" className="hover-scale">Go to Chat</Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="outline" className="hover-scale">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" className="hover-scale">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="reveal-item" style={{ animationDelay: "0.1s" }}>
              <p className="inline-block text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full px-3 py-1 mb-4">
                Secure Communication Made Simple
              </p>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white reveal-item" style={{ animationDelay: "0.2s" }}>
              End-to-End <span className="text-blue-600 dark:text-blue-400">Encrypted</span> Messaging
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 reveal-item" style={{ animationDelay: "0.3s" }}>
              SafeChat Crypt provides a secure platform for encrypted communications. Every message is automatically encrypted before sending and decrypted when received.
            </p>
            <div className="flex flex-wrap gap-4 reveal-item" style={{ animationDelay: "0.4s" }}>
              <Link to="/signup">
                <Button size="lg" className="hover-scale">
                  Get Started
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg" className="hover-scale">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-2xl shadow-xl p-6 border border-white/50 dark:border-slate-800/50 reveal-item" style={{ animationDelay: "0.5s" }}>
            <div className="aspect-video bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <MessageSquareIcon className="h-16 w-16 text-blue-500 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Securely Chat Anywhere
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All messages are encrypted and only readable by intended recipients
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white reveal-item">
            Why Choose SafeChat Crypt?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-list">
            <div className="glass-panel rounded-xl p-6 hover-scale reveal-item">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <LockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                End-to-End Encryption
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Every message is encrypted before it leaves your device and can only be decrypted by the intended recipient.
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-6 hover-scale reveal-item">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <ShieldIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Privacy Focused
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                We don't have access to your conversations. Your privacy is our priority.
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-6 hover-scale reveal-item">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquareIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Simple Interface
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Easy to use interface without compromising on security features. Just type and send.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="container mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} SafeChat Crypt. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
