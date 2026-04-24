import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/Redux/Hooks/store";
import { selectReciver } from "@/Redux/feature/cartSlice";
import { useReceivers, useAddUser } from "@/hooks/useReceivers";
import {
  useGroups,
  useCreateGroup,
  useAddGroupMember,
} from "@/hooks/useGroups";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { removeUserInfo } from "@/Redux/feature/authSlice";
import { AlertDialogDemo } from "./modals/AlertModal";
import { subscribeOnlineUsers } from "@/services/socketService";
import type { Receiver } from "@/types";

export function Sidebar({ className }: { className?: string }) {
  const [activeState, setActiveState] = useState<string>("");
  const [emailOrMobile, setEmailOrMobile] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"contacts" | "groups">("contacts");
  const [newGroup, setNewGroup] = useState<{
    name: string;
    description?: string;
    isPrivate?: boolean;
    allowMemberInvite?: boolean;
    adminOnlyMessages?: boolean;
  }>({
    name: "",
    description: "",
    isPrivate: false,
    allowMemberInvite: false,
    adminOnlyMessages: false,
  });
  const [showHeaderMenu, setShowHeaderMenu] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<
    Record<string, boolean>
  >({});
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // TanStack Query hooks
  const { data: receivers = [], isLoading: isReceiversLoading } =
    useReceivers();
    console.log("Receivers", receivers)
  const { data: groups = [] } = useGroups();
  const addUserMutation = useAddUser();
  const createGroupMutation = useCreateGroup();
  const addGroupMemberMutation = useAddGroupMember();
  const [onlineSet, setOnlineSet] = useState<Set<string>>(new Set());

  const getReceiverSubtitle = (receiver: Receiver) => {
    const lastMessage = receiver?.lastMessage;
    if (!lastMessage) return receiver?.email;
    if (lastMessage?.content?.trim()) return lastMessage.content;
    if (lastMessage?.fileUrl) return "Attachment";
    return receiver?.email;
  };

  // Presence listener (mounted once)
  useEffect(() => {
    const unsub = subscribeOnlineUsers((ids) => setOnlineSet(ids));
    return () => unsub();
  }, []);

  const handleAddUser = async () => {
    const payload = emailOrMobile.includes("@")
      ? { email: emailOrMobile }
      : { mobile: emailOrMobile };

    addUserMutation.mutate(payload, {
      onSuccess: () => {
        setEmailOrMobile("");
      },
    });
  };

  return (
    <div
      className={cn(
        "pb-12 min-h-full bg-white border-r border-slate-200",
        className
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 mb-1">Chat</h1>
              <p className="text-sm text-slate-600">Your conversations</p>
            </div>
            <div>
              <Popover open={showHeaderMenu} onOpenChange={setShowHeaderMenu}>
                <PopoverTrigger asChild>
                  <Button variant="ghostStrong" size="icon" aria-label="Menu">
                    ⋮
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="space-y-1">
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md transition-colors"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setShowCreateModal(true);
                      }}
                    >
                      Create group
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md transition-colors"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        navigate("/profile");
                      }}
                    >
                      Profile
                    </button>
                    <AlertDialogDemo
                      name="Logout"
                      onClick={() => dispatch(removeUserInfo())}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant={activeTab === "contacts" ? "subtle" : "ghostStrong"}
              size="pillSm"
              onClick={() => setActiveTab("contacts")}
            >
              Contacts
            </Button>
            <Button
              variant={activeTab === "groups" ? "subtle" : "ghostStrong"}
              size="pillSm"
              onClick={() => setActiveTab("groups")}
            >
              Groups
            </Button>
          </div>
        </div>

        {activeTab === "contacts" && (
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Add Contact
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Email or mobile"
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <Button
                onClick={handleAddUser}
                disabled={!emailOrMobile || addUserMutation.isPending}
                size="pillSm"
                variant="gradient"
                className="w-full"
              >
                {addUserMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Add Contact"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {isReceiversLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          )}

          {receivers?.length === 0 && !isReceiversLoading && (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">👥</span>
              </div>
              <p className="text-sm text-slate-600">No contacts yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Add contacts to start chatting
              </p>
            </div>
          )}

          {activeTab === "contacts" && receivers && receivers.length > 0 && (
            <div className="p-2">
              <div className="space-y-1 overflow-auto">
                {receivers.map((receiver) => (
                  <div
                    key={receiver?._id}
                    className={`relative w-full rounded-lg transition-all duration-200 ${
                      activeState === receiver?._id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      navigate("/chat");
                      dispatch(
                        selectReciver({ ...receiver, selectionType: "user" })
                      );
                      setActiveState(receiver?._id);
                    }}
                  >
                    <div className="flex items-center gap-3 p-3 cursor-pointer">
                      {!receiver?.profilePic ? (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {receiver?.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={receiver?.profilePic}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-sm truncate ${
                            activeState === receiver?._id
                              ? "text-blue-700"
                              : "text-slate-800"
                          }`}
                        >
                          {receiver?.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {getReceiverSubtitle(receiver)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            onlineSet.has(receiver?._id)
                              ? "bg-green-500"
                              : "bg-slate-300"
                          }`}
                        ></div>
                      </div>
                    </div>
                    {activeState === receiver?._id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups List */}
          {activeTab === "groups" && groups && groups.length > 0 && (
            <div className="p-2 mt-2">
              <h3 className="px-1 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Groups
              </h3>
              <div className="space-y-1">
                {groups.map((group) => (
                  <div
                    key={group?._id}
                    className={`relative w-full rounded-lg transition-all duration-200 ${
                      activeState === group?._id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      navigate("/chat");
                      dispatch(
                        selectReciver({
                          _id: group._id,
                          name: group.name,
                          email: null,
                          mobile: null,
                          selectionType: "group",
                        })
                      );
                      setActiveState(group?._id);
                    }}
                  >
                    <div className="flex items-center gap-3 p-3 cursor-pointer">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {group?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-sm truncate ${
                            activeState === group?._id
                              ? "text-blue-700"
                              : "text-slate-800"
                          }`}
                        >
                          {group?.name}
                        </h3>
                        {group?.description && (
                          <p className="text-xs text-slate-500 truncate">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {activeState === group?._id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreateModal(false)}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Create group
                </h3>
                <button
                  className="text-slate-500"
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Group name"
                    value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newGroup.description}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!newGroup.isPrivate}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            isPrivate: e.target.checked,
                          })
                        }
                      />{" "}
                      Private
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!newGroup.allowMemberInvite}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            allowMemberInvite: e.target.checked,
                          })
                        }
                      />{" "}
                      Allow invites
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!newGroup.adminOnlyMessages}
                        onChange={(e) =>
                          setNewGroup({
                            ...newGroup,
                            adminOnlyMessages: e.target.checked,
                          })
                        }
                      />{" "}
                      Admin only messages
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Select participants
                  </h4>
                  <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
                    {(receivers || []).map((r) => (
                      <label
                        key={r._id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedMemberIds[r._id]}
                          onChange={(e) =>
                            setSelectedMemberIds((prev) => ({
                              ...prev,
                              [r._id]: e.target.checked,
                            }))
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {r.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {r.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  variant="ghostStrong"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  size="pillSm"
                  disabled={
                    !newGroup.name.trim() || createGroupMutation.isPending
                  }
                  onClick={async () => {
                    if (!newGroup.name.trim()) return;

                    const memberIds = Object.keys(selectedMemberIds).filter(
                      (k) => selectedMemberIds[k]
                    );
                    const selectedContacts = (receivers || []).filter((r) =>
                      memberIds.includes(r._id)
                    );
                    const memberEmails = selectedContacts
                      .map((c) => c.email)
                      .filter(Boolean) as string[];

                    createGroupMutation.mutate(
                      {
                        name: newGroup.name.trim(),
                        description: newGroup.description || undefined,
                        isPrivate: newGroup.isPrivate,
                        allowMemberInvite: newGroup.allowMemberInvite,
                        adminOnlyMessages: newGroup.adminOnlyMessages,
                        memberEmails,
                      },
                      {
                        onSuccess: async (res) => {
                          const groupId =
                            (res as any)?.data?.group?._id ||
                            (res as any)?.data?._id;
                          // Add mobile-only users separately
                          const mobileOnly = selectedContacts.filter(
                            (c) => !c.email && c.mobile
                          );
                          if (groupId && mobileOnly.length > 0) {
                            await Promise.all(
                              mobileOnly.map((c) =>
                                addGroupMemberMutation.mutateAsync({
                                  groupId,
                                  payload: { mobile: c.mobile },
                                })
                              )
                            );
                          }
                          setNewGroup({
                            name: "",
                            description: "",
                            isPrivate: false,
                            allowMemberInvite: false,
                            adminOnlyMessages: false,
                          });
                          setSelectedMemberIds({});
                          setShowCreateModal(false);
                          setActiveTab("groups");
                        },
                      }
                    );
                  }}
                >
                  {createGroupMutation.isPending ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
