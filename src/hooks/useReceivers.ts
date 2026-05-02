import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReceivers, addUser, deleteConversation } from '@/services/apiService';
import { Receivers } from '@/types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export const useReceivers = () => {
  return useQuery({
    queryKey: ['receivers'],
    queryFn: async () => {
      const response = await getReceivers();
      if (response?.data) {
        const data = response.data as { receivers: Receivers };
        return data.receivers;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email?: string; mobile?: string }) => {
      const response = await addUser(payload);
      return response;
    },
    onSuccess: (response) => {
      if (response?.data) {
        console.log("Response", response);
        queryClient.invalidateQueries({ queryKey: ['receivers'] });
        toast.success(`${(response?.data as { message: string })?.message}`);
      }
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        toast.error(`${error.response?.data?.message}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const response = await deleteConversation(receiverId);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['receivers'] });
      toast.success(`${(response?.data as { message?: string })?.message || "Conversation deleted"}`);
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        toast.error(`${error.response?.data?.message || "Failed to delete conversation"}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });
};
