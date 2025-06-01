import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle authentication errors gracefully
  const isAuthenticated = !!user && !isUnauthorizedError(error as Error);

  return {
    user: isAuthenticated ? user : null,
    isLoading,
    isAuthenticated,
    error,
  };
}
