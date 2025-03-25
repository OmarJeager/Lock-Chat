import React, { useState, useEffect, useRef } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  encryptMessage, 
  decryptMessage, 
  isEncrypted, 
  canUserDecrypt, 
  EncryptionData 
} from "@/lib/encryption";
import { 
  ref, 
  push, 
  onValue, 
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  get,
  equalTo,
  set
} from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Lock, 
  LockOpen, 
  Send, 
  LogOut, 
  AlertTriangle, 
  User, 
  Users, 
  Search,
  UserCheck,
  UserX,
  Trash,
  Trash2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserSelector, ChatUser } from "@/components/UserSelector";
import { ZAxis } from "recharts";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  timestamp: number;
  isEncrypted: boolean;
  allowedUsers?: string[];
}

const Chat = () => {
  const { currentUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [selectedDecryptUsers, setSelectedDecryptUsers] = useState<ChatUser[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [viewedProfile, setViewedProfile] = useState<ChatUser | null>(null);
  
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
              isEncrypted: value.isEncrypted || false,
              allowedUsers: value.allowedUsers || [],
              seen: value.seen || false, // Include the seen property
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
        set(userRef, userData);
      } catch (error) {
        console.error("Error registering user:", error);
      }
    }
  }, [currentUser]);
  
  const handleToggleDecryptUser = (user: ChatUser) => {
    setSelectedDecryptUsers(prevUsers => {
      const userExists = prevUsers.some(u => u.id === user.id);
      
      if (userExists) {
        toast.info(`${user.displayName} can no longer decrypt your messages`);
        return prevUsers.filter(u => u.id !== user.id);
      } else {
        toast.success(`${user.displayName} can now decrypt your messages`);
        return [...prevUsers, user];
      }
    });
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser) return;
    
    try {
      // Get allowed user IDs from selected decrypt users
      const allowedUserIds = selectedDecryptUsers.map(user => user.id);
      
      // Only encrypt if the message is not already encrypted
      if (!isEncrypted(message)) {
        const encryptionData = encryptMessage(message, allowedUserIds);
        
        await push(ref(database, "messages"), {
          text: encryptionData.text,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || "Anonymous",
          receiverId: selectedUser ? selectedUser.id : null,
          timestamp: serverTimestamp(),
          isEncrypted: encryptionData.isEncrypted,
          allowedUsers: encryptionData.allowedUsers
        });
      } else {
        // Message is already encrypted, just send it
        await push(ref(database, "messages"), {
          text: message,
          _senderId: currentUser.uid,
          get senderId() {
            return this._senderId;
          },
          set senderId(value) {
            this._senderId = value;
          },
          senderName: currentUser.displayName || "Anonymous",
          receiverId: selectedUser ? selectedUser.id : null,
          timestamp: serverTimestamp(),
          isEncrypted: true,
          allowedUsers: allowedUserIds
        });
      }
      
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
  
  const toggleDecrypt = (messageId: string, messageText: string, isMessageEncrypted: boolean, allowedUsers?: string[]) => {
    // Check if current user is allowed to decrypt this message
    if (currentUser && allowedUsers && allowedUsers.length > 0) {
      const canDecrypt = canUserDecrypt(currentUser.uid, allowedUsers);
      
      if (!canDecrypt && isMessageEncrypted) {
        toast.error("You don't have permission to decrypt this message");
        return;
      }
    }
    
    if (decryptedMessages[messageId]) {
      const updatedDecrypted = { ...decryptedMessages };
      delete updatedDecrypted[messageId];
      setDecryptedMessages(updatedDecrypted);
    } else {
      const decrypted = isMessageEncrypted 
        ? decryptMessage(messageText)
        : encryptMessage(messageText).text;
      
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
    setViewedProfile(user); // Set the profile being viewed
  };
  
  const getDecryptStatusIcon = (msg: Message) => {
    if (!msg.isEncrypted) return null;
    
    if (!msg.allowedUsers || msg.allowedUsers.length === 0) {
      return null;
    }
    
    const isCurrentUserAllowed = currentUser && canUserDecrypt(currentUser.uid, msg.allowedUsers);
    
    if (msg.senderId === currentUser?.uid) {
      if (msg.allowedUsers.length > 0) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="ml-2 px-1.5 py-0">
                  <UserCheck className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs">{msg.allowedUsers.length}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {msg.allowedUsers.length} {msg.allowedUsers.length === 1 ? 'person' : 'people'} can decrypt
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="ml-2">
                {isCurrentUserAllowed ? (
                  <UserCheck className="h-3 w-3 text-green-500" />
                ) : (
                  <UserX className="h-3 w-3 text-red-500" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isCurrentUserAllowed 
                ? "You can decrypt this message" 
                : "You cannot decrypt this message"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };
  
  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    if (!currentUser) return;
  
    try {
      const messageRef = ref(database, `messages/${messageId}`);
      if (deleteForEveryone) {
        // Delete the message for everyone
        await set(messageRef, null);
        toast.success("Message deleted for everyone");
      } else {
        // Mark the message as deleted for the current user
        await set(ref(database, `messages/${messageId}/deletedFor/${currentUser.uid}`), true);
        toast.success("Message deleted for you");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleSignalMessage = async (messageId: string) => {
    if (!currentUser) return;
  
    try {
      const messageRef = ref(database, `messages/${messageId}/signaled`);
      await set(messageRef, true);
      toast.success("Message signaled");
    } catch (error) {
      console.error("Error signaling message:", error);
      toast.error("Failed to signal message");
    }
  };

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    messages.forEach(async (msg) => {
      if (
        msg.receiverId === currentUser.uid && // Message is for the current user
        !msg.seen // Message has not been marked as seen
      ) {
        try {
          const messageRef = ref(database, `messages/${msg.id}/seen`);
          await set(messageRef, true); // Mark the message as seen
        } catch (error) {
          console.error("Error updating seen status:", error);
        }
      }
    });
  }, [messages, currentUser, selectedUser]);

  // Function to view the current user's profile
const handleViewMyProfile = () => {
  setViewedProfile({
    id: currentUser.uid,
    displayName: currentUser.displayName || "Anonymous",
    email: currentUser.email,
  });
};

// JSX for the profile view
const renderProfileView = () => {
  if (!viewedProfile) return null;

  return (
    <Card className="glass-panel p-4 mb-4">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div>
            <strong>Name:</strong> {viewedProfile.displayName}
          </div>
          <div>
            <strong>Email:</strong> {viewedProfile.email}
          </div>
        </div>
      </CardContent>
      {viewedProfile.id === currentUser.uid && (
        <CardFooter>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardFooter>
      )}
    </Card>
  );
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
            <Button variant="outline" size="sm" onClick={handleViewMyProfile} className="hover-scale">
              <User className="h-4 w-4 mr-2" />
              My Profile
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
        
        {renderProfileView()}

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
                <UserSelector 
                  users={users} 
                  selectedUser={selectedUser} 
                  onSelectUser={handleSelectUser}
                  selectedDecryptUsers={selectedDecryptUsers}
                  onToggleDecryptUser={handleToggleDecryptUser}
                />
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
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm">
                          <Lock className="h-4 w-4 text-blue-500" />
                          <span>{selectedDecryptUsers.length} allowed to decrypt</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {selectedDecryptUsers.length === 0 
                          ? "All users can decrypt your messages" 
                          : `${selectedDecryptUsers.length} users can decrypt your messages`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    const canDecrypt = !msg.allowedUsers || msg.allowedUsers.length === 0 || 
                                      (currentUser && canUserDecrypt(currentUser.uid, msg.allowedUsers));
                    
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
                            <span className="text-xs text-gray-500 flex items-center">
                              {formatTime(msg.timestamp)}
                              {getDecryptStatusIcon(msg)}
                              {msg.seen && msg.senderId === currentUser?.uid && (
                                <span className="text-xs text-green-500">Seen</span>
                              )}
                            </span>
                          </div>
                          
                          <div className={`
                            flex items-center gap-2
                            ${isCurrentUser 
                              ? 'flex-row-reverse' 
                              : 'flex-row'
                            }
                          `}>
                            <div 
                              className={`
                                px-4 py-2 rounded-2xl break-words
                                ${isCurrentUser 
                                  ? 'bg-blue-500 text-white rounded-tr-none' 
                                  : 'bg-gray-200 dark:bg-gray-700 rounded-tl-none'
                                }
                                ${!canDecrypt && msg.isEncrypted && !isDecrypted
                                  ? 'opacity-60'
                                  : ''
                                }
                              `}
                            >
                              {displayText}
                            </div>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7" 
                                    onClick={() => toggleDecrypt(msg.id, msg.text, msg.isEncrypted, msg.allowedUsers)}
                                    disabled={!canDecrypt && msg.isEncrypted}
                                  >
                                    {isDecrypted ? (
                                      <LockOpen className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Lock className={`h-4 w-4 ${!canDecrypt ? 'text-red-500' : 'text-gray-500'}`} />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {!canDecrypt && msg.isEncrypted
                                    ? "You don't have permission to decrypt this message"
                                    : isDecrypted 
                                      ? "Encrypt message" 
                                      : "Decrypt message"
                                  }
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteMessage(msg.id, false)} // Delete for yourself
                          >
                            <Trash className="h-4 w-4 text-gray-500" />
                          </Button>
                          {msg.senderId === currentUser?.uid && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteMessage(msg.id, true)} // Delete for everyone
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSignalMessage(msg.id)}
                          >
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          </Button>
                        </div>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="submit" className="hover-scale">
                        <Send className="h-4 w-4 mr-1" /> Send
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {selectedDecryptUsers.length === 0 
                        ? "Message will be encrypted for all users" 
                        : `Message will be encrypted for ${selectedDecryptUsers.length} selected users`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </form>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Chat;