
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Users } from "lucide-react";

interface ChatUser {
  id: string;
  displayName: string;
  email?: string;
}

interface UserSelectorProps {
  users: ChatUser[];
  selectedUser: ChatUser | null;
  onSelectUser: (user: ChatUser | null) => void;
}

export const UserSelector = ({ users, selectedUser, onSelectUser }: UserSelectorProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-1">
      <button 
        onClick={() => onSelectUser(null)} 
        className={`w-full text-left p-2 rounded flex items-center gap-2 transition-colors ${!selectedUser ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
        <Users className="h-4 w-4" />
        <span>General Chat</span>
      </button>
      
      {users.map(user => (
        <button 
          key={user.id}
          onClick={() => onSelectUser(user)}
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
  );
};
