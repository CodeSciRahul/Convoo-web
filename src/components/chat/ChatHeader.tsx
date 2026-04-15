import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Play, Pause } from 'lucide-react';
import { useGetMusics } from '@/hooks/useSongs';
import { MusicState, MusicSyncState } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { setUpMusicListeners } from '@/services/socketService';
import { socketHandlers } from '@/services/socketService';
import { useAppSelecter } from '@/Redux/Hooks/store';

interface ChatHeaderProps {
  selectedReceiverName: string | null;
  selectionType: "user" | "group" | null;
  isGroupMenuOpen: boolean;
  setIsGroupMenuOpen: (open: boolean) => void;
  onGroupInfoClick: () => void;
  onSettingsClick: () => void;
  onLeaveGroup: () => void;
  isAdmin: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedReceiverName,
  selectionType,
  isGroupMenuOpen,
  setIsGroupMenuOpen,
  onGroupInfoClick,
  onSettingsClick,
  onLeaveGroup,
  isAdmin
}) => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [selectedSong, setSelectedSong] = useState<MusicState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const senderId = useAppSelecter((state) => state.auth.user?._id)
  const receiverId = useAppSelecter((state) => state?.cart?._id)

  const playerRef = useRef<any>(null);

  const debouncedQuery = useDebounce(query, 500);

  const { data: Songs = [], isLoading } = useGetMusics(debouncedQuery, focus, debouncedQuery);

  // 🔥 Load YouTube API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      // @ts-ignore
      playerRef.current = new window.YT.Player("yt-player", {
        height: "0",
        width: "0",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
      });
    };
  }, []);

  const applyMusicState = (state: MusicSyncState) => {
    setSelectedSong(state.song);
    setIsPlaying(state.isPlaying);

    if (!playerRef.current || !state.song) return;

    try {
      const currentId = playerRef.current.getVideoData?.()?.video_id;
      if (currentId !== state.song.id) {
        playerRef.current.loadVideoById(state.song.id, state.positionSec || 0);
      } else if (typeof state.positionSec === "number") {
        // Keep both clients aligned when one seeks/pauses/plays
        playerRef.current.seekTo(state.positionSec, true);
      }

      if (state.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // If YT isn't ready yet, next state update will retry.
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
  };

  const handleSelectSong = (song: MusicState) => {
    if (!senderId || !receiverId) return;
    setQuery("");
    socketHandlers.playMusic(senderId, receiverId, song);
  };

  useEffect(() => {
    setUpMusicListeners(applyMusicState);
    return () => {
      // no-op; cleanup in socketService if you want globally
    };
  }, [])

  const togglePlay = () => {
    if (!playerRef.current || !selectedSong) return;

    const positionSec = Number(playerRef.current.getCurrentTime?.() || 0);
    if (!senderId || !receiverId) return;

    if (isPlaying) socketHandlers.pauseMusic(senderId, receiverId, positionSec);
    else socketHandlers.resumeMusic(senderId, receiverId, positionSec);
  };

  return (
    <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center gap-3">

        {/* Back Button */}
        <Button
          onClick={() => navigate("/users")}
          variant="ghostStrong"
          size="sm"
          className="block sm:hidden rounded-full p-2"
        >
          <FaArrowLeft className="text-slate-600" />
        </Button>

        <div className='flex w-full justify-between items-center'>

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {selectedReceiverName
                  ? selectedReceiverName.charAt(0).toUpperCase()
                  : "?"}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedReceiverName || "Select a receiver"}
              </h3>
              <p className="text-sm text-slate-500">Online</p>
            </div>

            {/* Group Menu */}
            {selectionType === 'group' && (
              <div className="ml-auto">
                <Popover open={isGroupMenuOpen} onOpenChange={setIsGroupMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghostStrong" size="icon">⋮</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="end">
                    <div className="space-y-1">
                      <button onClick={onGroupInfoClick} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md">
                        Group info
                      </button>
                      {isAdmin && (
                        <button onClick={onSettingsClick} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md">
                          Settings
                        </button>
                      )}
                      <button onClick={onLeaveGroup} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                        Leave group
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 relative">

            {/* 🔍 Search */}
            <div className="relative">
              <input
                value={query}
                onFocus={() => setFocus(true)}
                onBlur={() => setTimeout(() => setFocus(false), 200)}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search song..."
                className="border rounded-full px-4 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {focus && (
                <div className="absolute top-10 left-0 w-64 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">

                  {isLoading ? (
                    <div className="p-2 text-sm text-gray-500">Loading...</div>
                  ) : Songs.length > 0 ? (
                    Songs.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer"
                      >
                        <img src={song.thumbnail} className="w-10 h-10 rounded" />
                        <span className="text-sm truncate">{song.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No songs found</div>
                  )}

                </div>
              )}
            </div>

            {/* 🎧 Cassette Player */}
            <div className="relative">
              {isPlaying && (
                <div className="absolute inset-0 rounded-full bg-purple-400/30 animate-spin"></div>
              )}

              <button
                onClick={togglePlay}
                disabled={!selectedSong}
                className={`relative w-12 h-12 rounded-full overflow-hidden shadow-lg 
                transition-all duration-300 ${
                  isPlaying ? "scale-105" : "hover:scale-105"
                }`}
              >
                {selectedSong?.thumbnail && (
                  <img
                    src={selectedSong.thumbnail}
                    className={`absolute inset-0 w-full h-full object-cover ${
                      isPlaying ? "animate-spin-slow" : ""
                    }`}
                  />
                )}

                <div className="absolute inset-0 bg-black/40"></div>

                <div className="relative flex items-center justify-center w-full h-full">
                  {isPlaying ? (
                    <Pause className="text-white w-5 h-5" />
                  ) : (
                    <Play className="text-white w-5 h-5 ml-[2px]" />
                  )}
                </div>
              </button>
            </div>

            {/* 🎯 Hidden YouTube Player */}
            <div id="yt-player" className="hidden"></div>

          </div>
        </div>
      </div>
    </div>
  );
};