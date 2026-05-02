import http from "./httpService";
import { 
  LoginRequest, 
  SignupRequest, 
  AddUserPayload, 
  CreateGroupData, 
  UpdateGroupData,
} from "@/types";




export function userLogin(data: LoginRequest) {
  return http.post(`/login`, data);
}

export function userSignup(data: SignupRequest) {
  return http.post(`/register`, data);
}

export function verifyUser(token: string | null){
  return http.patch(`/verify?token=${token}`);
}

export function updateProfile(data: FormData){
  return http.put("/profile", data)
}

export function getReceivers() {
  return http.get(`/users/receivers`);
}

export function Chats(sender?: string, receiver?: string, groupId?: string) {
  const queryParams = new URLSearchParams();
  if(sender) queryParams.append('sender', sender);
  if(receiver) queryParams.append('receiver', receiver);
  if(groupId) queryParams.append('groupId', groupId);
  return http.get(`/chats?${queryParams.toString()}`);
}

export function addUser(data: AddUserPayload){
return http.post(`/users/receivers`, data)
}

export function deleteConversation(receiverId: string) {
  return http.delete(`/users/receivers/${receiverId}`);
}

export function upload(data:any ){
    return http.post(`/upload`, data)
}

// Group APIs
export function getGroups(){
  return http.get(`/groups`);
}

export function createGroup(data: CreateGroupData){
  return http.post(`/groups`, data);
}

export function addGroupMember(groupId: string, data: AddUserPayload){
  return http.post(`/groups/${groupId}/members`, data);
}

export function removeGroupMember(groupId: string, memberId: string){
  return http.delete(`/groups/${groupId}/members/${memberId}`);
}

export function getGroupDetails(groupId: string){
  return http.get(`/groups/${groupId}`)
}

export function getGroupMembers(groupId: string){
  return http.get(`/groups/${groupId}/members`);
}

export function updateGroupMemberRole(groupId: string, memberId: string, role: "admin" | "participant"){
  return http.put(`/groups/${groupId}/members/${memberId}/role`, { role });
}

export function leaveGroup(groupId: string){
  return http.post(`/groups/${groupId}/leave`);
}

export function updateGroup(groupId: string, data: UpdateGroupData){
  return http.put(`/groups/${groupId}`, data);
}

export function getSongs(searchQuery: string){
  return http.get(`/music?searchQuery=${searchQuery}`)
}
