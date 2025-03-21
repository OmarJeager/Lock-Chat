
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
  limitToLast,
  get,
  equalTo
} from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, LockOpen, Send, LogOut, AlertTriangle, User, Users, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserSelector } from "@/components/UserSelector";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  timestamp: number;
  isEncrypted: boolean;
}

interface ChatUser {
  id: string;
  displayName: string;
  email?: string;
}

const Chat = () => {
  const { currentUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const testDbAccess = async () => {
      if (!currentUser) return;
      
      try {
        const testRef = ref(database, 'messages');
        await get(testRef);
        setDbError(null);
      } catch (error: any) {
        console.error("Database access error:", error);
        if (error.message && error.message.includes("PERMISSION_DENIED")) {
          setDbError("You don't have permission to access the chat. Please check Firebase database rules.");
        }
      }
    };
    
    testDbAccess();
  }, [currentUser]);
  
  // Fetch available users
  useEffect(() => {
    if (!currentUser) return;
    
    const usersRef = ref(database, "users");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const loadedUsers: ChatUser[] = [];
        
        if (data) {
          Object.entries(data).forEach(([id, value]: [string, any]) => {
            if (id !== currentUser.uid) {
              loadedUsers.push({
                id,
                displayName: value.displayName || "Anonymous",
                email: value.email
              });
            }
          });
          
          setUsers(loadedUsers);
          
          // If no user is selected and we have users, select the first one
          if (!selectedUser && loadedUsers.length > 0) {
            setSelectedUser(loadedUsers[0]);
          }
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, selectedUser]);
  
  // Listen for messages
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    
    const messagesRef = query(
      ref(database, "messages"),
      orderByChild("timestamp"),
      limitToLast(100)
    );
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const loadedMessages: Message[] = [];
        
        if (data) {
          Object.entries(data).forEach(([id, value]: [string, any]) => {
            const msg = {
              id,
              text: value.text,
              senderId: value.senderId,
              senderName: value.senderName,
              receiverId: value.receiverId,
              timestamp: value.timestamp,
              isEncrypted: value.isEncrypted || false
            };
            
            // Only show messages that are either from/to the current user and selected user
            if (
              selectedUser && 
              ((msg.senderId === currentUser.uid && msg.receiverId === selectedUser.id) ||
              (msg.senderId === selectedUser.id && msg.receiverId === currentUser.uid))
            ) {
              loadedMessages.push(msg);
            } else if (!selectedUser && !msg.receiverId) {
              // Show all messages in the general chat if no user is selected
              loadedMessages.push(msg);
            }
          });
          
          loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(loadedMessages);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading messages:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Database read error:", error);
      if (error.message && error.message.includes("PERMISSION_DENIED")) {
        setDbError("You don't have permission to read messages. Please check Firebase database rules.");
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, navigate, selectedUser]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);
  
  useEffect(() => {
    // Register user in the database for user selection
    if (currentUser && currentUser.uid) {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const userData = {
        displayName: currentUser.displayName || "Anonymous",
        email: currentUser.email,
        lastActive: serverTimestamp()
      };
      
      try {
        // This is set, not push, because we want to update the user data if it already exists
        const { set } = require("firebase/database");
        set(userRef, userData);
      } catch (error) {
        console.error("Error registering user:", error);
      }
    }
  }, [currentUser]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser) return;
    
    try {
      const shouldEncrypt = !isEncrypted(message);
      const textToSend = shouldEncrypt ? encryptMessage(message) : message;
      
      await push(ref(database, "messages"), {
        text: textToSend,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Anonymous",
        receiverId: selectedUser ? selectedUser.id : null,
        timestamp: serverTimestamp(),
        isEncrypted: shouldEncrypt
      });
      
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      if (error.message && error.message.includes("PERMISSION_DENIED")) {
        toast.error("Permission denied: Update Firebase database rules to allow writes");
        setDbError("You don't have permission to send messages. Please check Firebase database rules.");
      } else {
        toast.error("Failed to send message");
      }
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
      const updatedDecrypted = { ...decryptedMessages };
      delete updatedDecrypted[messageId];
      setDecryptedMessages(updatedDecrypted);
    } else {
      const decrypted = isMessageEncrypted 
        ? decryptMessage(messageText)
        : encryptMessage(messageText);
      
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
  
  const handleSelectUser = (user: ChatUser | null) => {
    setSelectedUser(user);
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
        {dbError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              {dbError}
              <p className="mt-2 text-sm">
                Please update your Firebase Realtime Database rules in the Firebase Console to:
                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {`{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}`}
                </pre>
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-4 max-w-4xl mx-auto w-full">
          <div className="w-1/4">
            <Card className="glass-panel h-full">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  <button 
                    onClick={() => handleSelectUser(null)} 
                    className={`w-full text-left p-2 rounded flex items-center gap-2 transition-colors ${!selectedUser ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <Users className="h-4 w-4" />
                    <span>General Chat</span>
                  </button>
                  
                  {users.map(user => (
                    <button 
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left p-2 rounded flex items-center gap-2 transition-colors ${selectedUser?.id === user.id ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{user.displayName}</span>
                    </button>
                  ))}
                  
                  {users.length === 0 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No users available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="flex-1 glass-panel flex flex-col overflow-hidden animate-fade-in">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedUser ? (
                    <>
                      <Avatar>
                        <AvatarFallback>{getInitials(selectedUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <span>{selectedUser.displayName}</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      <span>General Chat</span>
                    </>
                  )}
                </div>
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
                      {selectedUser 
                        ? `Start a conversation with ${selectedUser.displayName} by sending an encrypted message.`
                        : 'Start a conversation in the general chat by sending an encrypted message.'
                      }
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
                  placeholder={`Type a message to ${selectedUser ? selectedUser.displayName : 'everyone'}...`}
                  className="flex-1 glass-input"
                />
                <Button type="submit" className="hover-scale">
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Chat;
