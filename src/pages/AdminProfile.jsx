import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Lock, Save, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import adminService from '../services/adminService';

const AdminProfile = () => {
  const { themeColors } = useTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdminProfile();
      if (res.success) {
        setProfile(res.admin);
        setProfileData({
          name: res.admin.name,
          email: res.admin.email
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const res = await adminService.updateAdminProfile(profileData);
      if (res.success) {
        toast.success("Profile updated successfully!");
        setProfile(res.admin);
        setIsEditingProfile(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));

    // Calculate password strength
    if (name === 'newPassword') {
      let strength = 0;
      if (value.length >= 6) strength += 1;
      if (value.length >= 10) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(Math.min(strength, 4));
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }

    if (passwords.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters long");
    }

    try {
      setIsSubmitting(true);
      await adminService.changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });

      toast.success("Password changed successfully!");
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };



  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2" style={{ borderColor: themeColors.primary, borderRightColor: 'transparent' }}></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-gray-500">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <User size={40} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-600">Profile Not Found</h2>
        <p className="text-gray-400 text-sm mt-1">Unable to load your profile information</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto transition-colors duration-300" style={{ color: themeColors.text }}>
      
      {/* Page Header */}
      <div className="mb-8 border-b pb-6" style={{ borderColor: themeColors.border }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: themeColors.primary }}>
          My Profile
        </h1>
        <p className="mt-1 text-sm opacity-75" style={{ color: themeColors.textSecondary }}>
          Manage your account settings and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Profile Card - Left Column */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border shadow-sm overflow-hidden sticky top-6 transition-all duration-200 hover:shadow-md" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            
            {/* Top decorative banner with theme primary color */}
            <div className="h-28 relative transition-all duration-300" style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primary}dd 100%)` }}>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md shadow-sm transition-all border border-white/20"
                  title="Edit Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              )}
            </div>
            
            {isEditingProfile ? (
              <form onSubmit={submitProfileUpdate} className="px-6 pb-6 -mt-12 relative z-10">
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center border-4 shadow-md mb-6 relative" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.surface }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}12` }}>
                    <User size={36} style={{ color: themeColors.primary }} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: themeColors.textSecondary }}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="w-full border rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 transition-all"
                      style={{ 
                        borderColor: themeColors.border, 
                        backgroundColor: themeColors.background,
                        color: themeColors.text
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: themeColors.textSecondary }}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full border rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 transition-all"
                      style={{ 
                        borderColor: themeColors.border, 
                        backgroundColor: themeColors.background,
                        color: themeColors.text
                      }}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileData({ name: profile.name, email: profile.email });
                    }}
                    className="flex-1 py-2 border rounded-lg text-sm font-medium transition-colors"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile || (!profileData.name || !profileData.email)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors flex justify-center items-center"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    {isUpdatingProfile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/80 border-t-transparent"></div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="px-6 pb-6 text-center -mt-12 relative z-10">
                  <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center border-4 shadow-md mb-3" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.surface }}>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}12` }}>
                      <User size={36} style={{ color: themeColors.primary }} />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border" 
                       style={{ 
                         backgroundColor: `${themeColors.primary}0a`, 
                         color: themeColors.primary, 
                         borderColor: `${themeColors.primary}20` 
                       }}>
                    <Shield size={12} className="mr-1.5" />
                    {profile.role === 'superadmin' ? 'Super Administrator' : profile.role || 'Administrator'}
                  </div>
                </div>

                {/* Account Details */}
                <div className="border-t px-6 py-5" style={{ borderColor: themeColors.border, backgroundColor: `${themeColors.background}30` }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: themeColors.textSecondary }}>Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail size={18} className="mr-3 mt-0.5 flex-shrink-0" style={{ color: themeColors.textSecondary }} />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Email Address</p>
                        <p className="font-semibold break-all text-sm">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Shield size={18} className="mr-3 mt-0.5 flex-shrink-0" style={{ color: themeColors.textSecondary }} />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Permissions</p>
                        <p className="text-sm opacity-90">
                          {profile.role === 'superadmin'
                            ? 'Full system access (Bypasses restriction)'
                            : (profile.permissions?.length
                              ? profile.permissions.slice(0, 3).join(', ') + (profile.permissions.length > 3 ? '...' : '')
                              : 'Standard access')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <CheckCircle size={18} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>Status</p>
                        <p className="inline-flex items-center text-green-500 text-sm font-semibold">
                          Active & Validated
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security Settings - Right Column */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border shadow-sm transition-all" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: `${themeColors.primary}12` }}>
                  <Lock size={18} style={{ color: themeColors.primary }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Security Settings</h2>
                  <p className="text-sm opacity-75" style={{ color: themeColors.textSecondary }}>Update your password to keep your administrator session secure</p>
                </div>
              </div>
            </div>

            <form onSubmit={submitPasswordChange} className="p-6 md:p-8">
              <div className="max-w-lg space-y-6">

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="opacity-60" />
                    </div>
                    <input
                      type="password"
                      name="oldPassword"
                      required
                      value={passwords.oldPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 w-full border rounded-xl py-2.5 px-4 outline-none focus:ring-2 transition-all duration-200"
                      style={{ 
                        borderColor: themeColors.border, 
                        backgroundColor: themeColors.background,
                        color: themeColors.text
                      }}
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="opacity-60" />
                    </div>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 w-full border rounded-xl py-2.5 px-4 outline-none focus:ring-2 transition-all duration-200"
                      style={{ 
                        borderColor: themeColors.border, 
                        backgroundColor: themeColors.background,
                        color: themeColors.text
                      }}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {passwords.newPassword && (
                    <div className="mt-3 bg-gray-50/50 p-2.5 rounded-lg border" style={{ borderColor: themeColors.border }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${passwordStrength === 1 ? 'text-red-500' :
                            passwordStrength === 2 ? 'text-orange-500' :
                              passwordStrength === 3 ? 'text-yellow-600' :
                                passwordStrength === 4 ? 'text-green-500' : 'text-gray-400'
                          }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-70 mt-1.5">
                        Tip: Use uppercase letters, numbers, and symbols (!@#$) for maximum security.
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="opacity-60" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 w-full border rounded-xl py-2.5 px-4 outline-none focus:ring-2 transition-all duration-200"
                      style={{ 
                        borderColor: themeColors.border, 
                        backgroundColor: themeColors.background,
                        color: themeColors.text
                      }}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center font-semibold">
                      <AlertCircle size={12} className="mr-1.5" />
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword || passwords.newPassword !== passwords.confirmPassword}
                    className="flex items-center justify-center px-6 py-2.5 text-white font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/80 border-t-transparent mr-2"></div>
                        Updating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save size={18} className="mr-2" />
                        Update Password
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' })}
                    className="px-6 py-2.5 font-bold rounded-xl border hover:bg-gray-50/50 transition-colors duration-200"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Security Tip Card */}
          <div className="mt-6 bg-blue-50/40 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Security Tip</h4>
                <p className="text-xs text-blue-600/80 mt-0.5">
                  For better security, use a unique password that you don't use on other websites,
                  and avoid common words or personal information.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;