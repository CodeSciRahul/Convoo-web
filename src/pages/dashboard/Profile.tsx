import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppSelecter, useAppDispatch } from "@/Redux/Hooks/store";
import { FaArrowLeft, FaCamera, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useUpdateProfile } from "@/hooks/useUsers";
import { setUpdatedProfile, setTheme } from "@/Redux/feature/authSlice";
import { AuthUser } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Helmet } from "react-helmet-async";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const { isPending } = updateProfile;
  const dispatch = useAppDispatch();
  const user = useAppSelecter((state) => state.auth.user);
  const theme = useAppSelecter((state) => state.auth.theme)

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    profilePic: user?.profilePic || "",
  });
  const [profilePic, setProfilePic] = useState<File | undefined>(undefined);

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: theme === "dark",
    showOnlineStatus: true,
    readReceipts: true,
  });

  const handleSave = () => {
    const formData = new FormData();

    formData.append("name", profileData.name);
    formData.append("email", profileData.email);
    profilePic && formData.append("profilePic", profilePic);
    formData.append("mobile", profileData.mobile);

    updateProfile.mutate(formData, {
      onSuccess(data) {
        dispatch(setUpdatedProfile(data?.data as AuthUser));
        setIsEditing(false);
      },
    });
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      profilePic: user?.profilePic || "",
    });
    setProfilePic(undefined);
    setIsEditing(false);
  };

  const handleProfilePictureChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const temporaryImageUrl = URL.createObjectURL(file);
      setProfileData({ ...profileData, profilePic: temporaryImageUrl });
    }
  };

  const profileTitle = user?.name ? `${user.name} | Profile | Convoo` : "Profile | Convoo";
  const profileDescription = user?.name
    ? `Manage ${user.name}'s account settings on Convoo.`
    : "Manage your account settings on Convoo.";

  return (
    <>
      <Helmet>
        <title>{profileTitle}</title>
        <meta name="description" content={profileDescription} />
        <meta property="og:title" content={profileTitle} />
        <meta property="og:description" content={profileDescription} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="ghostStrong"
            size="sm"
            className="rounded-full p-2"
          >
            <FaArrowLeft className="text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Profile</h1>
            <p className="text-sm text-slate-600">
              Manage your account settings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  Profile Information
                </h2>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghostStrong"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FaEdit size={14} />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSave}
                      variant="gradient"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={isPending}
                    >
                      {!isPending ? (
                        <>
                          <FaSave size={14} />
                          Save
                        </>
                      ) : (
                        <Spinner />
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="ghostStrong"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FaTimes size={14} />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Picture */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  {!profileData?.profilePic ? (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-2xl">
                        {user?.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={profileData?.profilePic}
                      alt=""
                      className="w-20 h-20 rounded-full"
                    />
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                      <FaCamera className="text-white text-xs" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {user?.name}
                  </h3>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                  <p className="text-xs text-slate-500">
                    Member since{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name
                  </label>
                  <Input
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    disabled={!isEditing}
                    type="email"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile
                  </label>
                  <Input
                    value={profileData.mobile}
                    onChange={(e) =>
                      setProfileData({ ...profileData, mobile: e.target.value })
                    }
                    disabled={!isEditing}
                    type="tel"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Account Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      Email Notifications
                    </div>
                    <div className="text-xs text-slate-500">
                      Receive notifications via email
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onChange={(checked) =>
                      setSettings({ ...settings, notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      Dark Mode
                    </div>
                    <div className="text-xs text-slate-500">
                      Switch to dark theme
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onChange={(checked) => {
                      setSettings({ ...settings, darkMode: checked });
                      const theme = settings.darkMode ? "light" : "dark"
                      dispatch(setTheme(theme))
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      Show Online Status
                    </div>
                    <div className="text-xs text-slate-500">
                      Let others see when you're online
                    </div>
                  </div>
                  <Switch
                    checked={settings.showOnlineStatus}
                    onChange={(checked) =>
                      setSettings({ ...settings, showOnlineStatus: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      Read Receipts
                    </div>
                    <div className="text-xs text-slate-500">
                      Show when messages are read
                    </div>
                  </div>
                  <Switch
                    checked={settings.readReceipts}
                    onChange={(checked) =>
                      setSettings({ ...settings, readReceipts: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <Button
                  variant="ghostStrong"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    toast.success("Change password functionality coming soon!")
                  }
                >
                  Change Password
                </Button>
                <Button
                  variant="ghostStrong"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    toast.success("Download data functionality coming soon!")
                  }
                >
                  Download My Data
                </Button>
                <Button
                  variant="ghostStrong"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() =>
                    toast.error("Delete account functionality coming soon!")
                  }
                >
                  Delete Account
                </Button>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Email Verified</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      user?.isVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user?.isVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Account Type</span>
                  <span className="text-xs text-slate-500">Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Last Active</span>
                  <span className="text-xs text-slate-500">Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Profile;
