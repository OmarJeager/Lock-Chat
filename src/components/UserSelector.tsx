
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, Users, Mail, Copy, Lock, UserCheck } from "lucide-react";
import { toast } from "sonner";

export interface ChatUser {
  id: string;
  displayName: string;
  email?: string;
}

interface UserSelectorProps {
  users: ChatUser[];
  selectedUser: ChatUser | null;
  onSelectUser: (user: ChatUser | null) => void;
  selectedDecryptUsers: ChatUser[];
  onToggleDecryptUser: (user: ChatUser) => void;
}

export const UserSelector = ({ 
  users, 
  selectedUser, 
  onSelectUser, 
  selectedDecryptUsers, 
  onToggleDecryptUser 
}: UserSelectorProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  };

  const isUserSelectedForDecrypt = (userId: string) => {
    return selectedDecryptUsers.some(user => user.id === userId);
  };

  return (
    <div className="space-y-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => onSelectUser(null)} 
              className={`w-full text-left p-3 rounded-lg flex items-center gap-2 transition-colors ${!selectedUser ? 'bg-blue-100 dark:bg-blue-900/30 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium">General Chat</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Public chat room for all users</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="py-2 px-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
          <Lock className="h-3 w-3" />
          Decrypt Access
        </h3>
        <p className="text-xs text-gray-400 mb-2">Select users who can decrypt your messages</p>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {users.map(user => (
            <TooltipProvider key={`decrypt-${user.id}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleDecryptUser(user)}
                    className={`p-1 rounded-full border-2 transition-all ${
                      isUserSelectedForDecrypt(user.id) 
                        ? 'border-green-500 bg-green-100 dark:bg-green-900/30' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isUserSelectedForDecrypt(user.id) 
                    ? `${user.displayName} can decrypt your messages` 
                    : `${user.displayName} cannot decrypt your messages`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
      
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 mb-1 flex items-center gap-1">
        <User className="h-3 w-3" />
        Direct Messages
      </h3>
      
      {users.map(user => (
        <ContextMenu key={user.id}>
          <ContextMenuTrigger asChild>
            <button 
              onClick={() => onSelectUser(user)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-2 transition-colors ${selectedUser?.id === user.id ? 'bg-blue-100 dark:bg-blue-900/30 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800 shadow-sm">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium">{user.displayName}</span>
                {user.email && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </span>
                )}
              </div>
              {isUserSelectedForDecrypt(user.id) && (
                <div className="ml-auto">
                  <div className="text-green-500 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                    <UserCheck className="h-3 w-3" />
                  </div>
                </div>
              )}
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64">
            <ContextMenuItem 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onSelectUser(user)}
            >
              <User className="h-4 w-4" />
              <span>Message {user.displayName}</span>
            </ContextMenuItem>
            
            <ContextMenuItem 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onToggleDecryptUser(user)}
            >
              <Lock className="h-4 w-4" />
              <span>
                {isUserSelectedForDecrypt(user.id) 
                  ? `Remove decrypt access` 
                  : `Grant decrypt access`}
              </span>
            </ContextMenuItem>
            
            {user.email && (
              <ContextMenuItem 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => copyEmail(user.email || "")}
              >
                <Copy className="h-4 w-4" />
                <span>Copy email address</span>
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ))}
      
      {users.length === 0 && (
        <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No users available yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Users will appear here when they sign up
          </p>
        </div>
      )}
    </div>
  );
};
