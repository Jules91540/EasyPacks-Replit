import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  messageType: "topic" | "reply";
  className?: string;
}

const AVAILABLE_EMOJIS = ["❤️", "👍", "👎", "😂", "😮", "😢", "😡"];

export default function MessageReactions({ messageId, messageType, className = "" }: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { data: reactions = [], isLoading } = useQuery({
    queryKey: [`/api/forum/reactions/${messageId}`],
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const response = await fetch("/api/forum/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          messageId,
          messageType,
          emoji,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de la réaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forum/reactions/${messageId}`] });
      setShowEmojiPicker(false);
    },
  });

  const handleEmojiClick = (emoji: string) => {
    reactionMutation.mutate({ emoji });
  };

  const totalReactions = reactions.reduce((sum: number, r: Reaction) => sum + r.count, 0);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="text-white/50 text-sm">Chargement des réactions...</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Réactions existantes */}
      {reactions.map((reaction: Reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          className={`h-8 px-2 rounded-full transition-all duration-200 ${
            reaction.userReacted
              ? "bg-blue-600/20 border border-blue-500/50 text-white"
              : "bg-white/10 border border-white/20 text-white/80 hover:bg-white/20"
          }`}
          onClick={() => handleEmojiClick(reaction.emoji)}
          disabled={reactionMutation.isPending}
        >
          <span className="text-sm mr-1">{reaction.emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </Button>
      ))}

      {/* Bouton pour ajouter une réaction */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all duration-200"
            disabled={reactionMutation.isPending}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-black/90 border border-white/20">
          <div className="flex gap-1">
            {AVAILABLE_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/20 text-lg"
                onClick={() => handleEmojiClick(emoji)}
                disabled={reactionMutation.isPending}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Compteur total de réactions */}
      {totalReactions > 0 && (
        <div className="text-white/50 text-xs ml-2">
          {totalReactions} {totalReactions === 1 ? "réaction" : "réactions"}
        </div>
      )}
    </div>
  );
}