import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
}

export default function MentionInput({ value, onChange, placeholder, className }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rechercher les utilisateurs quand on tape @
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users/search', mentionQuery],
    enabled: showSuggestions && mentionQuery.length >= 1,
    queryFn: async () => {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`);
      if (!response.ok) throw new Error('Erreur lors de la recherche');
      return response.json();
    }
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(position);

    // Détecter si on est en train de taper une mention
    const beforeCursor = newValue.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (user: User) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    
    // Remplacer la mention partielle par la mention complète
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = beforeCursor.substring(0, beforeCursor.lastIndexOf('@'));
      const newValue = `${beforeMention}@${user.firstName} ${afterCursor}`;
      onChange(newValue);
      
      // Repositionner le curseur après la mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = beforeMention.length + user.firstName.length + 2;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowSuggestions(false);
    setMentionQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && (e.key === 'Escape')) {
      setShowSuggestions(false);
      setMentionQuery('');
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            rows={3}
          />
        </PopoverTrigger>
        
        {showSuggestions && users.length > 0 && (
          <PopoverContent 
            className="w-80 p-0 bg-black/90 backdrop-blur-lg border-white/20" 
            align="start"
            side="top"
          >
            <Command>
              <CommandList>
                <CommandEmpty>Aucun utilisateur trouvé</CommandEmpty>
                <CommandGroup>
                  {users.map((user: User) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => insertMention(user)}
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/10 text-white"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                          {user.firstName[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-white/60">
                          @{user.firstName}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}