import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelecter } from "@/Redux/Hooks/store";
import toast from "react-hot-toast";
import { Chats, upload } from "@/services/apiService";
import {
  useGroupDetails,
  useGroupMembers,
  useAddGroupMember,
  useRemoveGroupMember,
  useUpdateGroupMemberRole,
  useLeaveGroup,
  useUpdateGroup,
} from "@/hooks/useGroups";
import { FaPaperclip, FaReply, FaSmile, FaTimes } from "react-icons/fa";
import { LuDelete, LuTrash2 } from "react-icons/lu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, ServerMessage, GroupFormData, GroupMember } from "@/types";
import { EmojiPicker } from "@/components/emojiPicker";
import { Reaction } from "@/types";
import {
  socketHandlers,
  setupSocketListeners,
  cleanupSocketListeners,
} from "@/services/socketService";
import { GroupInfoModal } from "@/components/modals/GroupInfoModal";
import { GroupSettingsModal } from "@/components/modals/GroupSettingsModal";
import { RemoveReactionModal } from "@/components/modals/RemoveReactionModal";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Helmet } from "react-helmet-async";

type ChatMessage = Message & { deleted?: boolean | null };

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isFileUploading, setisFileUploading] = useState<boolean>(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState<boolean>(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [updateGroupData, setUpdateGroupData] = useState<GroupFormData>({
    name: "",
    description: "",
    settings: {
      isPrivate: false,
      allowMemberInvite: false,
      adminOnlyMessages: false,
    },
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<Reaction[] | null>(
    null
  );
  const [isRemoveReactionOpen, setIsRemoveReactionOpen] =
    useState<boolean>(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const selectedMsgRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const selectedReceiverId = useAppSelecter((state) => state.cart._id);
  const selectedReceiverName = useAppSelecter((state) => state?.cart.name);
  const selectionType = useAppSelecter((state) => state?.cart.selectionType);
  const userId = useAppSelecter((state) => state.auth.user?._id);
  const userName = useAppSelecter((state) => state?.auth.user?.name);

  const chatTitle =
    selectionType === "group"
      ? selectedReceiverName
        ? `Group: ${selectedReceiverName} | Convoo`
        : "Group chat | Convoo"
      : selectedReceiverName
        ? `Chat with ${selectedReceiverName} | Convoo`
        : "Chat | Convoo";
  
  console.log("chatTitle", chatTitle);


  const chatDescription =
    selectionType === "group"
      ? selectedReceiverName
        ? `Chat in the “${selectedReceiverName}” group on Convoo.`
        : "Chat with your groups on Convoo."
      : selectedReceiverName
        ? `Chat with ${selectedReceiverName} on Convoo.`
        : "Chat with your contacts on Convoo.";

  const toDayKey = (isoOrDate: string | Date) => {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(d.getTime())) return "invalid";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const dayLabel = (isoOrDate: string | Date) => {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const todayKey = toDayKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = toDayKey(yesterday);
    const key = toDayKey(d);

    if (key === todayKey) return "Today";
    if (key === yesterdayKey) return "Yesterday";

    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  const setMessageRef = (id: string) => (el: HTMLDivElement | null) => {
    selectedMsgRef.current[id] = el;
  };

  const {
    data: chatMessages,
    isLoading: isChatMessagesLoading,
    error: chatMessagesError,
  } = useQuery({
    queryKey: ["chatMessages", userId, selectedReceiverId, selectionType],
    queryFn: () => {
      if (selectionType === "group") {
        return Chats(userId!, undefined, selectedReceiverId!);
      } else {
        return Chats(userId!, selectedReceiverId!);
      }
    },
    enabled: !!userId && !!selectedReceiverId,
  });

  // Update messages when chat data changes
  useEffect(() => {
    if (chatMessages?.data && Array.isArray(chatMessages.data)) {
      setMessages(
        chatMessages.data.map((msg: ServerMessage) => ({
          _id: msg._id,
          senderId: msg?.sender._id,
          senderName: msg?.sender.name,
          receiverId: msg.receiver?._id || "",
          content: msg?.content,
          fileUrl: msg?.fileUrl,
          fileType: msg?.fileType,
          timestamp: msg?.createdAt,
          deliveredAt: (msg as any)?.deliveredAt ?? null,
          seenAt: (msg as any)?.seenAt ?? null,
          groupId: msg?.groupId,
          messageType: msg?.messageType,
          replyTo: msg?.replyTo
            ? {
                _id: msg?.replyTo._id,
                senderId: msg?.replyTo.sender._id,
                senderName: msg?.replyTo.sender.name,
                receiverId: msg?.replyTo.receiver?._id || "",
                content: msg?.replyTo.content,
                fileUrl: msg?.replyTo.fileUrl,
                fileType: msg?.replyTo.fileType,
                timestamp: msg?.replyTo.createdAt,
                groupId: msg?.replyTo.groupId,
                messageType: msg?.replyTo.messageType,
                replyTo: null,
                reactions: msg?.replyTo.reactions,
              }
            : null,
          reactions: msg?.reactions,
          deleted: msg?.deleted,
        }))
      );
    }
  }, [chatMessages]);

  // Handle chat messages error
  useEffect(() => {
    if (chatMessagesError) {
      toast.error("Error fetching chat messages");
    }
  }, [chatMessagesError]);

  const { mutateAsync: uploadFile } = useMutation({
    mutationFn: (formData: FormData) => upload(formData),
    onSuccess: (data) => {
      const uploadedMessage = data.data;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          senderId: userId!,
          senderName: userName!,
          receiverId: selectionType === "group" ? "" : selectedReceiverId!,
          fileUrl: (uploadedMessage as ServerMessage).fileUrl,
          fileType: (uploadedMessage as ServerMessage).fileType,
          timestamp: (uploadedMessage as ServerMessage).createdAt,
          groupId: selectionType === "group" ? selectedReceiverId : undefined,
          messageType: selectionType === "group" ? "group" : "private",
        } as Message,
      ]);
      setFile(null);
      toast.success("File sent successfully!");
    },
    onError: () => {
      toast.error("Error uploading file");
    },
  });

  // Group details query
  const { data: groupDetails } = useGroupDetails(
    selectionType === "group" ? selectedReceiverId : null
  );
  // Group members query
  const { data: groupMembersData } = useGroupMembers(
    selectionType === "group" ? selectedReceiverId : null
  );
  useEffect(() => {
    if (groupDetails) {
      groupDetails?.members?.forEach((member: GroupMember) => {
        if (member?.user?._id === userId && member?.role === "admin") {
          setIsAdmin(true);
          return;
        }
      });
    }
  }, [groupDetails, userId]);
  // Group operations mutations
  const { mutateAsync: addGroupMemberMutation } = useAddGroupMember();
  const { mutateAsync: removeGroupMemberMutation } = useRemoveGroupMember();
  const { mutateAsync: updateGroupMemberRoleMutation } =
    useUpdateGroupMemberRole();
  const { mutateAsync: leaveGroupMutation } = useLeaveGroup();
  const { mutateAsync: updateGroupMutation } = useUpdateGroup();

  // Join a room based on selected receiver
  useEffect(() => {
    if (selectedReceiverId && userId) {
      if (selectionType === "group") {
        socketHandlers.joinGroup(selectedReceiverId, userId);
      } else {
        socketHandlers.joinRoom(userId, selectedReceiverId);
      }
    }

    // Cleanup function to leave group when component unmounts or selection changes
    // return () => {
    //   if (selectedReceiverId && selectionType === 'group') {
    //     socketHandlers.leaveGroup(selectedReceiverId, userId);
    //   }
    // };
  }, [selectedReceiverId, userId, selectionType]);

  // Listen for new messages from the server
  useEffect(() => {
    setupSocketListeners(setMessages);

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  // Mark incoming messages as seen when chat is open (private chats)
  useEffect(() => {
    if (selectionType !== "user") return;
    if (!userId || !selectedReceiverId) return;
    if (!messages || messages.length === 0) return;

    const unseenIncoming = messages
      .filter(
        (m) =>
          m.senderId === selectedReceiverId &&
          m.receiverId === userId &&
          !(m as any).seenAt
      )
      .map((m) => m._id);

    if (unseenIncoming.length === 0) return;
    socketHandlers.markSeen({
      messageIds: unseenIncoming,
      viewerId: userId,
      otherUserId: selectedReceiverId,
    });
  }, [messages, selectionType, userId, selectedReceiverId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
        setSelectedMessageId(null);
      }
    };

    if (isEmojiPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  // Handle file upload using TanStack Query mutation
  const handleFileUpload = async () => {
    if (!file || !selectedReceiverId) {
      toast.error("Select a file and receiver to continue.");
      return;
    }

    setisFileUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sender", userId!);

    if (selectionType === "group") {
      formData.append("groupId", selectedReceiverId);
      formData.append("messageType", "group");
    } else {
      formData.append("receiver", selectedReceiverId);
      formData.append("messageType", "private");
    }

    try {
      await uploadFile(formData);
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      setisFileUploading(false);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedReceiverId) {
      toast.error("Select a receiver to continue chat");
      return;
    }

    // Optimistic UI like WhatsApp/Instagram
    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setMessages((prev) => [
      ...prev,
      ({
        _id: clientMessageId,
        senderId: userId!,
        senderName: userName || "",
        receiverId: selectionType === "group" ? "" : selectedReceiverId!,
        content: message.trim(),
        fileUrl: undefined,
        fileType: undefined,
        timestamp: new Date().toISOString(),
        deliveredAt: null,
        seenAt: null,
        groupId: selectionType === "group" ? selectedReceiverId : undefined,
        messageType: selectionType === "group" ? "group" : "private",
        replyTo: null,
        reactions: [],
      } as any),
    ]);

    socketHandlers.sendMessage({
      senderId: userId!,
      receiverId: selectionType === "group" ? undefined : selectedReceiverId,
      groupId: selectionType === "group" ? selectedReceiverId : undefined,
      content: message.trim(),
      messageType: selectionType === "group" ? "group" : "private",
      replyTo: replyToMessage?._id || undefined,
      clientMessageId,
    });

    setMessage("");
    setReplyToMessage(null);
  };

  // Handle send button click
  const handleSendClick = () => {
    if (file) {
      handleFileUpload();
    } else if (message.trim()) {
      sendMessage();
    } else {
      toast.error("Please type a message or select a file.");
    }
  };

  const scrollToView = (id: string) => {
    const el = selectedMsgRef.current[id];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      el.classList.add("animate-pulse");
      setTimeout(() => {
        el.classList.remove("animate-pulse");
      }, 2000);
    }
  };

  return (
    <>
      <Helmet>
        <title>{chatTitle}</title>
        <meta name="description" content={chatDescription} />
        <meta property="og:title" content={chatTitle} />
        <meta property="og:description" content={chatDescription} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <ChatHeader
        selectedReceiverName={selectedReceiverName}
        selectionType={selectionType || null}
        isGroupMenuOpen={isGroupMenuOpen}
        setIsGroupMenuOpen={setIsGroupMenuOpen}
        onGroupInfoClick={() => {
          setIsGroupMenuOpen(false);
          setIsGroupInfoOpen(true);
        }}
        onSettingsClick={() => {
          setIsGroupMenuOpen(false);
          // Pre-populate update group data
          if (groupDetails) {
            setUpdateGroupData({
              name: groupDetails.name || "",
              description: groupDetails.description || "",
              settings: {
                isPrivate: groupDetails.settings?.isPrivate || false,
                allowMemberInvite:
                  groupDetails.settings?.allowMemberInvite || false,
                adminOnlyMessages:
                  groupDetails.settings?.adminOnlyMessages || false,
              },
            });
          }
          setIsSettingsOpen(true);
        }}
        onLeaveGroup={() => {
          if (!selectedReceiverId) return;
          setIsGroupMenuOpen(false);
          leaveGroupMutation(selectedReceiverId);
        }}
        isAdmin={isAdmin}
      />

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={isGroupInfoOpen}
        onOpenChange={setIsGroupInfoOpen}
        groupDetails={groupDetails}
        groupMembers={groupMembersData || null}
      />

      {/* Settings Modal */}
      <GroupSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        groupMembers={groupMembersData || null}
        updateGroupData={updateGroupData}
        setUpdateGroupData={setUpdateGroupData}
        selectedReceiverId={selectedReceiverId}
        onAddMember={(payload) => {
          if (!selectedReceiverId) return;
          addGroupMemberMutation({ groupId: selectedReceiverId, payload });
        }}
        onRemoveMember={(groupId, memberId) => {
          removeGroupMemberMutation({ groupId, memberId });
        }}
        onUpdateMemberRole={(groupId, memberId, role) => {
          updateGroupMemberRoleMutation({ groupId, memberId, role });
        }}
        onUpdateGroup={(groupId, data) => {
          updateGroupMutation({ groupId, data });
        }}
      />

      {/* Remove Reaction Modal */}
      <RemoveReactionModal
        isOpen={isRemoveReactionOpen}
        onOpenChange={setIsRemoveReactionOpen}
        selectedReaction={selectedReaction}
        selectedMessageId={selectedMessageId}
        userId={userId || null}
        onRemoveReaction={socketHandlers.removeReaction}
        setSelectedMessageId={setSelectedMessageId}
        setSelectedReaction={setSelectedReaction}
        setIsRemoveReactionOpen={setIsRemoveReactionOpen}
      />

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {isChatMessagesLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>Loading messages...</span>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <React.Fragment key={`${msg._id}_${index}`}>
            {(() => {
              const currentKey = toDayKey(msg.timestamp);
              const prev = messages[index - 1];
              const prevKey = prev ? toDayKey(prev.timestamp) : null;
              const show = index === 0 || currentKey !== prevKey;
              if (!show) return null;
              const label = dayLabel(msg.timestamp);
              if (!label) return null;
              return (
                <div className="flex justify-center py-2">
                  <div className="px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-medium shadow-sm">
                    {label}
                  </div>
                </div>
              );
            })()}

            <div
              ref={setMessageRef(msg._id)}
              className={`flex cursor-pointer ${
                msg?.senderId === userId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-center gap-2 group ${
                  msg?.senderId === userId ? "flex-row" : "flex-row-reverse"
                }`}
              >
              <div className="hidden group-hover:block relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyToMessage(msg);
                  }}
                  disabled={!!msg.deleted}
                >
                  <FaReply size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    setSelectedMessageId(msg._id);
                  }}
                  disabled={!!msg.deleted}
                >
                  <FaSmile size={16} />
                </Button>
                {msg?.senderId === userId && !msg.deleted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!userId) return;
                      socketHandlers.deleteMessage({
                        messageId: msg._id,
                        requesterId: userId,
                      });
                    }}
                  >
                    <LuTrash2 size={16} />
                  </Button>
                )}
                {isEmojiPickerOpen && selectedMessageId === msg._id && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-10 right-0 z-50"
                  >
                    <div
                      className="w-64 h-48 overflow-hidden rounded-lg shadow-lg border border-slate-200 bg-white"
                      style={{
                        width: "278px",
                        height: "220px",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          transform: "scale(0.8)",
                          transformOrigin: "top left",
                        }}
                      >
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            socketHandlers.sendReaction(
                              selectedMessageId!,
                              emoji,
                              userId!,
                              setSelectedMessageId,
                              selectionType === "group"
                                ? selectedReceiverId ?? undefined
                                : undefined
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    msg?.senderId === userId
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                  }`}
                >
                  {msg?.senderId !== userId && selectionType === "group" && (
                    <p className="text-xs font-medium text-slate-600 mb-1">
                      {msg.senderName}
                    </p>
                  )}
                  {msg.replyTo && (
                    <div
                      className={`mb-2 p-2 rounded-lg border-l-2 ${
                        msg?.senderId === userId
                          ? "bg-white/20 border-white/40"
                          : "bg-slate-50 border-slate-300"
                      }`}
                      onClick={() => msg.replyTo?._id && scrollToView(msg.replyTo?._id)}
                    >
                      <p
                        className={`text-xs font-medium ${
                          msg?.senderId === userId
                            ? "text-blue-100"
                            : "text-slate-500"
                        }`}
                      >
                        Replying to {msg.replyTo.senderName}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          msg?.senderId === userId
                            ? "text-white/80"
                            : "text-slate-600"
                        }`}
                      >
                        {msg.replyTo.content ||
                          (msg.replyTo.fileUrl && (
                            <img src={msg.replyTo.fileUrl} className="w-20" />
                          ))}
                      </p>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">
                    {msg.deleted ? (
                      <span className="italic opacity-80">
                        This message was deleted
                      </span>
                    ) : (
                      msg?.content
                    )}
                  </p>
                  {!msg.deleted && msg?.fileUrl && (
                    <div className="mt-2">
                      {msg.fileType?.startsWith("image/") ? (
                        <img
                          src={msg.fileUrl}
                          alt="Uploaded file"
                          className="w-32 h-32 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            msg?.senderId === userId
                              ? "bg-white/20 hover:bg-white/30 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          📎 View File
                        </a>
                      )}
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      msg?.senderId === userId
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg?.senderId === userId && selectionType === "user" && (
                      <span className="ml-2 inline-flex items-center">
                        {!(msg as any)?.deliveredAt && !(msg as any)?.seenAt && (
                          <span className="text-blue-100">✓</span>
                        )}
                        {!!(msg as any)?.deliveredAt && !(msg as any)?.seenAt && (
                          <span className="text-blue-100">✓✓</span>
                        )}
                        {!!(msg as any)?.seenAt && (
                          <span className="text-red-300">✓✓</span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
                {msg?.reactions && (
                  <div className="absolute bottom-[-8px] left-3 flex max-w-full">
                    <div className="flex items-center overflow-hidden">
                      {msg?.reactions
                        ?.slice(0, 5)
                        .map((reaction: Reaction, index: number) => (
                          <button
                            key={reaction?._id || index}
                            className="text-slate-500 hover:text-slate-700 transition-colors"
                            onClick={() => {
                              setSelectedMessageId(msg._id);
                              setSelectedReaction(
                                msg?.reactions || ([] as Reaction[])
                              );
                              setIsRemoveReactionOpen(true);
                            }}
                          >
                            {reaction?.emoji}
                          </button>
                        ))}
                      {msg?.reactions?.length > 5 && (
                        <span className="text-slate-400 text-xs ml-1">
                          +{msg.reactions.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </React.Fragment>
        ))}
      </div>

      {/* Input Area */}

      <div className="border-t border-slate-200 relative">
        {replyToMessage && (
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center absolute bottom-16 w-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-1">
                Replying to {replyToMessage.senderName}
              </p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {replyToMessage?.content}
              </p>
            </div>
            <button
              className="text-xs text-red-600 hover:underline ml-2 flex-shrink-0"
              onClick={() => setReplyToMessage(null)}
            >
              <FaTimes />
            </button>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="file-upload"
              className="cursor-pointer p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <FaPaperclip
                className="text-slate-600 hover:text-slate-800"
                size={18}
              />
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="flex-1 relative">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleSendClick()}
              />
            </div>
            <Button
              onClick={handleSendClick}
              disabled={isFileUploading || (!message.trim() && !file)}
              variant="gradient"
              size="pill"
            >
              {isFileUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send"
              )}
            </Button>
          </div>
          {file && (
            <div className="w-fit mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {file.type.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  {file.type.startsWith("video/") && (
                    <video
                      src={URL.createObjectURL(file)}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  {file.type === "application/pdf" && (
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">
                        PDF
                      </span>
                    </div>
                  )}
                  {!file.type.startsWith("image/") &&
                    !file.type.startsWith("video/") &&
                    file.type !== "application/pdf" && (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-slate-600 font-bold text-xs">
                          FILE
                        </span>
                      </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <LuDelete className="text-red-500 text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default Chat;
