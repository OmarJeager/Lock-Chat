
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { encryptMessage, decryptMessage, isEncrypted } from "@/lib/encryption";
import { 
  ref, 
  push, 
  onValue, 
  serverTimestamp,
  query,
  orderByChild,
  limitToLast 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, LockOpen, Send, LogOut } from "lucide-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  isEncrypted: boolean;
}

const Chat = () => {
  const { currentUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    
    // Reference to the messages in the database
    const messagesRef = query(
      ref(database, "messages"),
      orderByChild("timestamp"),
      limitToLast(100)
    );
    
    // Listen for new messages
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages: Message[] = [];
      
      if (data) {
        Object.entries(data).forEach(([id, value]: [string, any]) => {
          loadedMessages.push({
            id,
            text: value.text,
            senderId: value.senderId,
            senderName: value.senderName,
            timestamp: value.timestamp,
            isEncrypted: value.isEncrypted || false
          });
        });
        
        // Sort messages by timestamp
        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
      }
      
      setLoading(false);
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser, navigate]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser) return;
    
    try {
      // Check if the message appears to be already encrypted
      const shouldEncrypt = !isEncrypted(message);
      const textToSend = shouldEncrypt ? encryptMessage(message) : message;
      
      // Push the new message to Firebase
      await push(ref(database, "messages"), {
        text: textToSend,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Anonymous",
        timestamp: serverTimestamp(),
        isEncrypted: shouldEncrypt
      });
      
      // Clear the input
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  const toggleDecrypt = (messageId: string, messageText: string, isMessageEncrypted: boolean) => {
    if (decryptedMessages[messageId]) {
      // If already decrypted, remove the decryption
      const updatedDecrypted = { ...decryptedMessages };
      delete updatedDecrypted[messageId];
      setDecryptedMessages(updatedDecrypted);
    } else {
      // If not decrypted, decrypt it
      const decrypted = isMessageEncrypted 
        ? decryptMessage(messageText)
        : encryptMessage(messageText); // If not encrypted, "decrypt" will actually encrypt
      
      setDecryptedMessages({
        ...decryptedMessages,
        [messageId]: decrypted
      });
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const formatTime = (timestamp: number) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!currentUser) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="w-full py-3 px-4 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">SafeChat Crypt</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Signed in as {currentUser.displayName || currentUser.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="hover-scale">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 flex flex-col">
        <Card className="flex-1 glass-panel flex flex-col overflow-hidden animate-fade-in max-w-4xl mx-auto w-full">
          <CardHeader className="border-b">
            <CardTitle className="text-center">
              Encrypted Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse-soft">Loading conversations...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-sm">
                  <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Start a conversation by sending an encrypted message.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isCurrentUser = msg.senderId === currentUser?.uid;
                  const displayText = decryptedMessages[msg.id] || msg.text;
                  const isDecrypted = !!decryptedMessages[msg.id];
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-3 animate-slide-up`}
                    >
                      {!isCurrentUser && (
                        <Avatar>
                          <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[75%] space-y-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2">
                          {!isCurrentUser && (
                            <span className="text-sm font-medium">{msg.senderName}</span>
                          )}
                          <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                        </div>
                        
                        <div className={`
                          flex items-center gap-2
                          ${isCurrentUser 
                            ? 'flex-row-reverse' 
                            : 'flex-row'
                          }
                        `}>
                          <div className={`
                            px-4 py-2 rounded-2xl break-words
                            ${isCurrentUser 
                              ? 'bg-blue-500 text-white rounded-tr-none' 
                              : 'bg-gray-200 dark:bg-gray-700 rounded-tl-none'
                            }
                          `}>
                            {displayText}
                          </div>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => toggleDecrypt(msg.id, msg.text, msg.isEncrypted)}
                                >
                                  {isDecrypted ? (
                                    <LockOpen className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isDecrypted ? "Encrypt message" : "Decrypt message"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      {isCurrentUser && (
                        <Avatar>
                          <AvatarFallback>{getInitials(currentUser.displayName || "You")}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t p-4">
            <form onSubmit={handleSendMessage} className="w-full flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message... (will be automatically encrypted)"
                className="flex-1 glass-input"
              />
              <Button type="submit" className="hover-scale">
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
