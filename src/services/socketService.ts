import io, { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import properties from "@/config/properties";
import { Reaction, Message } from "@/types";
import { MusicState, MusicSyncState } from "@/types";

type SocketSender = { _id: string; name: string; email: string };
type SocketReceiver = { _id: string; name: string; email: string } | null | undefined;
type SocketReplyTo = {
  _id: string;
  sender: SocketSender;
  receiver?: SocketReceiver;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  groupId?: string;
  messageType?: "private" | "group" | null;
  reactions?: Reaction[] | null;
} | null;

type SocketIncomingMessage = {
  _id: string;
  clientMessageId?: string | null;
  sender: SocketSender;
  receiver?: SocketReceiver;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  groupId?: string;
  messageType?: "private" | "group" | null;
  replyTo?: SocketReplyTo;
  reactions?: Reaction[] | null;
  deleted?: boolean | null;
};

type SocketMessageStatusPayload =
  | { messageId: string; deliveredAt?: string | Date | null; seenAt?: string | Date | null }
  | { messageIds: string[]; deliveredAt?: string | Date | null; seenAt?: string | Date | null };

// Socket setup
export const socket: Socket = io(properties.PUBLIC_SOCKET_BASE_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 5000,
});

// -----------------------------------------------------------------------------
// Presence (online/offline)
// -----------------------------------------------------------------------------

let onlineUserIds = new Set<string>();
const onlineSubscribers = new Set<(ids: Set<string>) => void>();

const notifyOnlineSubscribers = () => {
  const snapshot = new Set(onlineUserIds);
  onlineSubscribers.forEach((cb) => cb(snapshot));
};

socket.on("presence:list", (payload: { onlineUserIds?: string[] }) => {
  onlineUserIds = new Set((payload?.onlineUserIds || []).map(String));
  notifyOnlineSubscribers();
});

socket.on("presence:update", (payload: { userId: string; online: boolean }) => {
  if (!payload?.userId) return;
  const id = String(payload.userId);
  if (payload.online) onlineUserIds.add(id);
  else onlineUserIds.delete(id);
  notifyOnlineSubscribers();
});

export const initPresence = (userId: string) => {
  if (!userId) return;

  const announce = () => {
    socket.emit("presence:online", { userId });
    socket.emit("presence:get");
  };

  if (socket.connected) announce();
  socket.off("connect", announce);
  socket.on("connect", announce);
};

export const subscribeOnlineUsers = (cb: (ids: Set<string>) => void) => {
  onlineSubscribers.add(cb);
  cb(new Set(onlineUserIds));
  return () => {
    onlineSubscribers.delete(cb);
  };
};

export const isUserOnline = (userId: string | null | undefined) => {
  if (!userId) return false;
  return onlineUserIds.has(String(userId));
};

// Socket event handlers
export const socketHandlers = {
  // Send a reaction to a message
  sendReaction: (
    messageId: string,
    emoji: string,
    userId: string,
    setSelectedMessageId: (messageId: string | null) => void,
    groupId?: string
  ) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot add reaction");
      return;
    }
    socket.emit("add_reaction", { messageId, userId, emoji, groupId });
    setSelectedMessageId(null);
  },

  // Remove a reaction from a message
  removeReaction: (
    messageId: string,
    reactionId: string,
    setSelectedMessageId: (messageId: string | null) => void,
    setSelectedReaction: (reactions: Reaction[] | null) => void,
    setIsRemoveReactionOpen: (isRemoveReactionOpen: boolean) => void,
  ) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot remove reaction");
      return;
    }
    socket.emit("remove_reaction", { messageId, reactionId });
    setSelectedMessageId(null);
    setSelectedReaction(null);
    setIsRemoveReactionOpen(false);
  },

  // Send a message
  sendMessage: (
    messageData: {
      senderId: string;
      receiverId?: string;
      groupId?: string;
      content: string;
      messageType: 'private' | 'group';
      replyTo?: string;
      clientMessageId?: string;
    }
  ) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot send message");
      return;
    }

    if (messageData.messageType === 'group') {
      socket.emit("send_group_message", {
        senderId: messageData.senderId,
        groupId: messageData.groupId,
        content: messageData.content,
        messageType: 'group',
        replyTo: messageData.replyTo
      });
    } else {
      socket.emit("send_message", {
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        messageType: 'private',
        replyTo: messageData.replyTo,
        clientMessageId: messageData.clientMessageId
      });
    }
  },

  // Join a room for private chat
  joinRoom: (senderId: string, receiverId: string) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot join room");
      return;
    }
    socket.emit("join_room", { senderId, receiverId });
  },

  // Join a group
  joinGroup: (groupId: string, userId: string) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot join group");
      return;
    }
    socket.emit("join_group", { groupId, userId });
  },

  // Leave a group
  leaveGroup: (groupId: string, userId: string) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot leave group");
      return;
    }
    socket.emit("leave_group", { groupId, userId });
  },

  selectMusic: (senderId: string, receiverId: string, music: MusicState) => {
    if(!socket.connected){
      toast.error("Socket is not connected - Cannot play music");
      return;
    }
    socket.emit("music:select", { senderId, receiverId, song: music })
  },
  pauseMusic: (senderId: string, receiverId: string, positionSec: number) => {
    if(!socket.connected){
      toast.error("Socket is not connected - Cannot pause music");
      return;
    }
    socket.emit("music:pause", { senderId, receiverId, positionSec })
  },
  resumeMusic: (senderId: string, receiverId: string, positionSec: number) => {
    if(!socket.connected){
      toast.error("Socket is not connected - Cannot play music");
      return;
    }
    socket.emit("music:play", { senderId, receiverId, positionSec })
  },
  seekMusic: (senderId: string, receiverId: string, positionSec: number) => {
    if(!socket.connected){
      toast.error("Socket is not connected - Cannot seek music");
      return;
    }
    socket.emit("music:seek", { senderId, receiverId, positionSec })
  }
  ,
  markSeen: (payload: { messageIds: string[]; viewerId: string; otherUserId: string }) => {
    if (!socket.connected) return;
    socket.emit("message:seen", payload);
  },

  deleteMessage: (payload: { messageId: string; requesterId: string }) => {
    if (!socket.connected) {
      toast.error("Socket is not connected - Cannot delete message");
      return;
    }
    socket.emit("message:delete", payload);
  }
};

// Socket event listeners setup
export const setupSocketListeners = (
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  // Handle private messages
  socket.on("receive_message", (newMessage: SocketIncomingMessage) => {
    const mapped = ({
      _id: newMessage._id,
      senderId: newMessage.sender._id,
      senderName: newMessage.sender.name,
      receiverId: newMessage.receiver?._id || "",
      content: newMessage.content,
      fileUrl: newMessage.fileUrl,
      fileType: newMessage.fileType,
      timestamp: newMessage.createdAt,
      deliveredAt: newMessage.deliveredAt ?? null,
      seenAt: newMessage.seenAt ?? null,
      groupId: newMessage.groupId,
      messageType: newMessage.messageType,
      deleted: newMessage.deleted ?? false,
      replyTo: newMessage.replyTo
        ? {
            _id: newMessage.replyTo._id,
            senderId: newMessage.replyTo.sender._id,
            senderName: newMessage.replyTo.sender.name,
            receiverId: newMessage.replyTo.receiver?._id || "",
            content: newMessage.replyTo.content,
            fileUrl: newMessage.replyTo.fileUrl,
            fileType: newMessage.replyTo.fileType,
            timestamp: newMessage.replyTo.createdAt,
            groupId: newMessage.replyTo.groupId,
            messageType: newMessage.replyTo.messageType,
            replyTo: null,
            reactions: newMessage.replyTo.reactions,
          }
        : null,
      reactions: newMessage.reactions,
    } as any) as Message;

    const clientId = newMessage.clientMessageId ? String(newMessage.clientMessageId) : null;
    setMessages((prevMessages) => {
      if (clientId) {
        const idx = prevMessages.findIndex((m) => String(m._id) === clientId);
        if (idx >= 0) {
          const next = [...prevMessages];
          next[idx] = mapped;
          return next;
        }
      }
      return [...prevMessages, mapped];
    });
  });

  // Handle group messages
  socket.on("receive_group_message", (newMessage: SocketIncomingMessage) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        _id: newMessage._id,
        senderId: newMessage.sender._id,
        senderName: newMessage.sender.name,
        receiverId: newMessage.receiver?._id || '',
        content: newMessage.content,
        fileUrl: newMessage.fileUrl,
        fileType: newMessage.fileType,
        timestamp: newMessage.createdAt,
        deliveredAt: newMessage.deliveredAt ?? null,
        seenAt: newMessage.seenAt ?? null,
        groupId: newMessage.groupId,
        messageType: newMessage.messageType,
        deleted: newMessage.deleted ?? false,
        replyTo: newMessage.replyTo ? {
          _id: newMessage.replyTo._id,
          senderId: newMessage.replyTo.sender._id,
          senderName: newMessage.replyTo.sender.name,
          receiverId: newMessage.replyTo.receiver?._id || '',
          content: newMessage.replyTo.content,
          fileUrl: newMessage.replyTo.fileUrl,
          fileType: newMessage.replyTo.fileType,
          timestamp: newMessage.replyTo.createdAt,
          groupId: newMessage.replyTo.groupId,
          messageType: newMessage.replyTo.messageType,
          replyTo: null,
          reactions: newMessage.replyTo.reactions,
        } : null,
        reactions: newMessage.reactions,
      },
    ]);
  });

  // Handle message deleted (soft delete)
  socket.on("message:deleted", (payload: { messageId?: string }) => {
    const id = payload?.messageId ? String(payload.messageId) : null;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id) !== id) return m;
        return {
          ...m,
          deleted: true,
          content: "",
          fileUrl: undefined,
          fileType: undefined,
          reactions: [],
        };
      })
    );
  });

  // Handle reaction added
  socket.on("message_reaction_added", (updatedMessage: { _id: string; reactions?: Reaction[] | null }) => {
    setMessages((prevMessages) => 
      prevMessages.map((msg: Message) => {
        if (updatedMessage?._id === msg?._id) {
          return {
            ...msg,
            reactions: [...updatedMessage?.reactions || []],
          };
        }
        return msg;
      })
    );
  });

  // Handle reaction removed
  socket.on("message_reaction_removed", (updatedMessage: { _id: string; reactions?: Reaction[] | null }) => {
    setMessages((prevMessages) => 
      prevMessages.map((msg: Message) => {
        if (updatedMessage?._id === msg?._id) {
          return {
            ...msg,
            reactions: [...updatedMessage?.reactions || []],
          };
        }
        return msg;
      })
    );
  });

  // Handle delivery/seen status updates
  socket.on("message:status", (payload: SocketMessageStatusPayload) => {
    const ids =
      "messageIds" in payload
        ? payload.messageIds.map(String)
        : payload.messageId
          ? [String(payload.messageId)]
          : [];

    if (ids.length === 0) return;

    const deliveredAt =
      payload.deliveredAt ? new Date(payload.deliveredAt as any).toISOString() : undefined;
    const seenAt =
      payload.seenAt ? new Date(payload.seenAt as any).toISOString() : undefined;

    setMessages((prev) =>
      prev.map((m) => {
        if (!ids.includes(String(m._id))) return m;
        const prevDeliveredAt = (m as any).deliveredAt as string | null | undefined;
        const prevSeenAt = (m as any).seenAt as string | null | undefined;
        return {
          ...m,
          deliveredAt: deliveredAt ?? prevDeliveredAt ?? null,
          seenAt: seenAt ?? prevSeenAt ?? null,
        };
      })
    );
  });
};


export const setUpMusicListeners = (
  onState: (state: MusicSyncState) => void
 ) => { 
  socket.on("music:state", (state: MusicSyncState) => {
    console.log("music:state", state)
    onState(state);
  })
}
export const cleanupSocketMusicListerns = () => {
  socket.off("music:state")
}
// Cleanup socket listenrs
export const cleanupSocketListeners = () => {
  socket.off("receive_message");
  socket.off("receive_group_message");
  socket.off("message_reaction_added");
  socket.off("message_reaction_removed");
  socket.off("message:status");
  socket.off("message:deleted");
}