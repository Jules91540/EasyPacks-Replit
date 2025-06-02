import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface AutoRefreshProps {
  enabled?: boolean;
  interval?: number;
}

export function AutoRefresh({ enabled = true, interval = 1000 }: AutoRefreshProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const refreshInterval = setInterval(() => {
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      // Refresh conversations
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // Refresh notifications
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/social'] });
      
      // Refresh friend requests
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [enabled, interval, queryClient]);

  return null; // This component doesn't render anything
}