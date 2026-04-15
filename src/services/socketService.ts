import io, { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import properties from "@/config/properties";
import { Reaction, Message } from "@/types";
import { MusicState, MusicSyncState } from "@/types";

// Socket setup
export const socket: Socket = io(properties.PRIVATE_SOCKET_BASE_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 5000,
});

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
        replyTo: messageData.replyTo
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

  playMusic: (senderId: string, receiverId: string, music: MusicState) => {
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
};

// Socket event listeners setup
export const setupSocketListeners = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  // Handle private messages
  socket.on("receive_message", (newMessage: any) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        _id: newMessage._id,
        senderId: newMessage.sender._id,
        senderName: newMessage.sender.name,
        receiverId: newMessage.receiver._id,
        content: newMessage.content,
        fileUrl: newMessage.fileUrl,
        fileType: newMessage.fileType,
        timestamp: newMessage.createdAt,
        groupId: newMessage.groupId,
        messageType: newMessage.messageType,
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

  // Handle group messages
  socket.on("receive_group_message", (newMessage: any) => {
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
        groupId: newMessage.groupId,
        messageType: newMessage.messageType,
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

  // Handle reaction added
  socket.on("message_reaction_added", (updatedMessage: any) => {
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
  socket.on("message_reaction_removed", (updatedMessage: any) => {
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
};


export const setUpMusicListeners = (
  onState: (state: MusicSyncState) => void
 ) => {
  socket.on("music:state", (state: MusicSyncState) => {
    onState(state);
  });
}

export const cleanupSocketMusicListerns = () => {
  socket.off("music:state")
}

// Cleanup socket listeners
export const cleanupSocketListeners = () => {
  socket.off("receive_message");
  socket.off("receive_group_message");
  socket.off("message_reaction_added");
  socket.off("message_reaction_removed");
};
