import { useQuery } from "@tanstack/react-query";
import { getSongs } from "@/services/apiService";
import { MusicState } from "@/types";

export const useGetMusics = (searchQuery: string, isEnabled: boolean, debouncedValue: string) => {
    return useQuery({
        queryKey: ["musics", searchQuery],
        queryFn: async () => {
            const response: any = await getSongs(searchQuery)
            if (response?.data) {
                return (response.data.data || []) as MusicState[]
            }
            return []
        },
        enabled: isEnabled || !!debouncedValue,

    })
}