import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export default function MentionInput({ value, onChange, placeholder, className, onKeyDown }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Query users when @ is typed
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users/search', mentionQuery],
    queryFn: async () => {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      return response.json();
    },
    enabled: mentionQuery.length > 0 && showSuggestions,
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if we're typing after @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z]*)$/);
    
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowSuggestions(true);
    } else {
      setMentionQuery('');
      setShowSuggestions(false);
    }
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ symbol before cursor
    const atMatch = textBeforeCursor.match(/@([a-zA-Z]*)$/);
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, textBeforeCursor.length - atMatch[0].length);
      const mention = `@${user.firstName} ${user.lastName}`;
      const newValue = beforeAt + mention + textAfterCursor;
      
      onChange(newValue);
      setShowSuggestions(false);
      setMentionQuery('');
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = beforeAt.length + mention.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setMentionQuery('');
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={3}
      />
      
      {showSuggestions && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {users.map((user: User) => (
            <div
              key={user.id}
              onClick={() => insertMention(user)}
              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-white text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-gray-400 text-xs">
                  @{user.firstName.toLowerCase()}{user.lastName.toLowerCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}