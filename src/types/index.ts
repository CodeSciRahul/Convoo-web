// =============================================================================
// USER & AUTHENTICATION TYPES
// =============================================================================

export interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  profilePic?: string;
  isVerified: boolean;
  googleId: string | null;
  facebookId: string | null;
  linkedinId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  _id: string | null;
  name: string | null;
  email: string | null;
  mobile: string | null;
  profilePic?: string;
  isVerified: boolean;
  googleId: string | null;
  facebookId: string | null;
  linkedinId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateProfileRequest {
  name: string,
  email: string,
  profilePic: string
  mobile: string
}

export interface AppInfo {
  user: AuthUser | null;
  token: string | null;
  theme: 'light' | 'dark';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  mobile: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface SignupResponse {
  message: string;
  id: string;
}

export interface LoginFormInputs {
  email: string;
  password: string;
}

export interface SignupFormInputs {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

// =============================================================================
// RECEIVER & CONTACT TYPES
// =============================================================================

export interface Receiver {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  profilePic?: string;
  lastMessage?: {
    _id: string;
    content?: string;
    fileUrl?: string | null;
    fileType?: string | null;
    createdAt?: string;
    messageType?: "private" | "group" | null;
  } | null;
}

export type Receivers = Receiver[];

export interface ReceiverState {
  _id: string | null;
  name: string | null;
  email: string | null;
  mobile: string | null;
  selectionType?: "user" | "group" | null;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface Reaction {
  _id: string
  user: {
    _id: string;
    name: string;
    email: string;
  };
  emoji: string;
  timestamp: Date;
}

export interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  timestamp: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  groupId?: string
  messageType?: "private" | "group" | null
  replyTo?: Message | null
  reactions?: Reaction[] | null;
}

export interface ServerMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  receiver: {
    _id: string;
    name: string;
    email: string;
  };
  content?: string;
  fileUrl?: string;
  fileType?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  groupId?: string
  messageType?: "private" | "group" | null
  replyTo?: ServerMessage | null
  reactions?: Reaction[] | null;
  deleted?: boolean | null;
  __v: number;
}

// =============================================================================
// GROUP TYPES
// =============================================================================

export interface Group {
  _id: string;
  name: string;
  description?: string | null;
  profilePicture?: string | null;
  settings?: GroupSettings;
  createdAt?: string;
  updatedAt?: string;
  members?: GroupMember[];
}

export interface GroupSettings {
  isPrivate?: boolean;
  allowMemberInvite?: boolean;
  adminOnlyMessages?: boolean;
}

export interface GroupMember {
  _id: string;
  user: User;
  role: "admin" | "participant";
  joinedAt: string;
}

export interface GroupDetails {
  _id: string;
  name: string;
  description?: string;
  profilePicture?: string;
  settings: GroupSettings;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export type Groups = Group[];

export interface CreateGroupData {
  name: string;
  description?: string;
  profilePicture?: string | null;
  isPrivate?: boolean;
  allowMemberInvite?: boolean;
  adminOnlyMessages?: boolean;
  memberEmails?: string[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  profilePicture?: string;
  settings?: GroupSettings;
}

export interface AddUserPayload {
  email?: string;
  mobile?: string;
  role?: "admin" | "participant";
}

// =============================================================================
// MUTATION TYPES
// =============================================================================

export interface AddGroupMemberParams {
  groupId: string;
  payload: AddUserPayload;
}

export interface RemoveGroupMemberParams {
  groupId: string;
  memberId: string;
}

export interface UpdateGroupMemberRoleParams {
  groupId: string;
  memberId: string;
  role: "admin" | "participant";
}

export interface UpdateGroupParams {
  groupId: string;
  data: UpdateGroupData;
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

export interface ProtectedRouteProps {
  isAuthenticated: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
}

export interface AddMemberInlineProps {
  onAdd: (payload: AddUserPayload) => void;
}

// =============================================================================
// REDUX STATE TYPES
// =============================================================================

export interface AuthState {
  user: AuthUser;
  token: string | null;
}

export interface CartState {
  _id: string | null;
  name: string | null;
  email: string | null;
  mobile: string | null;
  selectionType?: "user" | "group" | null;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ReceiversResponse {
  receivers: Receivers;
}

export interface GroupMembersResponse {
  members: GroupMember[];
}

export interface GroupDetailsResponse {
  group: GroupDetails;
}

// =============================================================================
// FORM STATE TYPES
// =============================================================================

export interface GroupFormData {
  name: string;
  description: string;
  settings: {
    isPrivate: boolean;
    allowMemberInvite: boolean;
    adminOnlyMessages: boolean;
  };
}

export interface NewGroupFormData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  allowMemberInvite?: boolean;
  adminOnlyMessages?: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type SelectionType = "user" | "group";

export type GroupRole = "admin" | "participant";

export type TabType = "contacts" | "groups";

// =============================================================================
// COMPONENT STATE TYPES
// =============================================================================

export interface ChatState {
  messages: Message[];
  message: string;
  file: File | null;
  isFileUploading: boolean;
  isGroupMenuOpen: boolean;
  isGroupInfoOpen: boolean;
  isSettingsOpen: boolean;
  updateGroupData: GroupFormData;
}

export interface SidebarState {
  activeState: string;
  emailOrMobile: string;
  receivers: Receivers | undefined;
  isloading: boolean;
  isaddLoading: boolean;
  groups: Groups;
  activeTab: TabType;
  isCreateLoading: boolean;
  newGroup: NewGroupFormData;
  showHeaderMenu: boolean;
  showCreateModal: boolean;
  selectedMemberIds: Record<string, boolean>;
}

export interface UsersState {
  emailOrMobile: string;
  receivers: Receivers | undefined;
  isloading: boolean;
  isaddLoading: boolean;
}


// music type response
export interface MusicState {
  id: string,
  title: string,
  thumbnail: string,
  channelTitle: string
}

export type MusicSyncAction = "select" | "play" | "pause" | "seek";

export interface MusicSyncState {
  roomId: string;
  song: MusicState | null;
  isPlaying: boolean;
  /**
   * Playback position (seconds) at `updatedAtMs`.
   */
  positionSec: number;
  /**
   * Server timestamp (ms) when state was updated.
   */
  updatedAtMs: number;
  /**
   * What caused the last update.
   */
  action: MusicSyncAction;
}
