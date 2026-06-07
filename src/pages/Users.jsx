import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Edit, Trash2, ShieldAlert, ShieldCheck, Eye, ChevronLeft, ChevronRight, Users as UsersIcon, UserCheck, UserX, Wallet, Search } from 'lucide-react';
import userService from '../services/userService';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';

export default function Users() {
  const { themeColors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { canEditUsers, canDeleteUsers, canManageUserStatus } = usePermissions();

  // UI States
  const [activeTab, setActiveTab] = useState("All Users");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUserDetails, setViewingUserDetails] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      if (data.success || data.data || Array.isArray(data)) {
        setUsers(data.users || data.data || data);
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      timeOfBirth: user.timeOfBirth || '',
      placeOfBirth: user.placeOfBirth || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        toast.success("User updated successfully!");
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await userService.toggleUserStatus(id, !currentStatus);
      toast.success(`User ${currentStatus ? 'blocked' : 'unblocked'} successfully!`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: themeColors.primary,
      cancelButtonColor: themeColors.danger,
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await userService.deleteUser(id);
          toast.success("User deleted successfully!");
          fetchUsers();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete user");
        }
      }
    });
  };

  // Data processing for Tabs and Pagination
  const usersList = Array.isArray(users) ? users : (users?.data || users?.users || []);
  
  const totalUsers = usersList.length;
  const activeUsersCount = usersList.filter(u => u.isActive !== false).length;
  const blockedUsersCount = totalUsers - activeUsersCount;
  const totalWalletBalance = usersList.reduce((acc, user) => acc + (user.walletBalance || 0), 0);

  const filteredUsers = usersList.filter(user => {
    if (activeTab === "Active") return user.isActive !== false;
    if (activeTab === "Blocked") return user.isActive === false;
    return true; // "All Users"
  }).filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phoneNumber && String(user.phoneNumber).includes(term))
    );
  });

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const tabs = [
    { name: "All Users", count: totalUsers, icon: <UsersIcon size={16} /> },
    { name: "Active", count: activeUsersCount, icon: <UserCheck size={16} /> },
    { name: "Blocked", count: blockedUsersCount, icon: <UserX size={16} /> }
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          User Management
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{totalUsers}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg text-blue-600">
            <UsersIcon size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Active</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{activeUsersCount}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg text-green-600">
            <UserCheck size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Blocked</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{blockedUsersCount}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-red-50 rounded-lg text-red-600">
            <UserX size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Wallet</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">₹{totalWalletBalance.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-orange-50 rounded-lg text-orange-600">
            <Wallet size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow-sm border bg-white overflow-hidden flex flex-col" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        
        {/* Custom Tabs Header matching the design */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 pt-4 border-b gap-4 pb-2" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center overflow-x-auto hide-scrollbar w-full sm:w-auto">
            {tabs.map(tab => (
              <button 
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); setPage(1); }}
                className={`flex items-center pb-3 px-4 mr-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.name 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-500 border-transparent hover:text-gray-800'
                }`}
              >
                <span className="mr-2 opacity-80">{tab.icon}</span>
                <span className="text-sm mr-2">{tab.name}</span>
                <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72 mb-2 sm:mb-0">
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }} className="text-xs uppercase font-semibold tracking-wider border-b whitespace-nowrap">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: themeColors.border, color: themeColors.text }}>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-gray-500">Loading users...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-gray-500">No users found in this category.</td></tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition" style={{ hoverBackgroundColor: themeColors.background }}>
                    <td className="px-6 py-4 font-medium whitespace-nowrap flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center text-gray-500 font-bold">
                        {user.profileImage ? (
                          <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${user.profileImage}`} alt={user.name} className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        ) : (
                          user.name ? user.name.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      <span>{user.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">₹{user.walletBalance || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive !== false ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-4">
                      <button onClick={() => setViewingUserDetails(user)} className="text-indigo-500 hover:text-indigo-700 transition" title="View">
                        <Eye size={18} />
                      </button>
                      {canEditUsers && (
                        <button onClick={() => openModal(user)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                          <Edit size={18} />
                        </button>
                      )}
                      {canManageUserStatus && (
                        <button onClick={() => handleToggleStatus(user._id, user.isActive !== false)} className={`${user.isActive !== false ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'} transition`} title={user.isActive !== false ? "Block" : "Unblock"}>
                          {user.isActive !== false ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                        </button>
                      )}
                      {canDeleteUsers && (
                        <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 py-4 border-t gap-4" style={{ borderColor: themeColors.border, color: themeColors.textSecondary }}>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-sm w-full lg:w-auto text-center sm:text-left">
            <div className="flex items-center">
              <span className="mr-2 sm:mr-3">Rows per page:</span>
              <select 
                className="border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition" 
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            </div>
            <span>Showing {totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, totalCount)} of {totalCount}</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm w-full lg:w-auto mt-2 lg:mt-0">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className={`flex items-center px-3 py-1.5 border rounded-lg transition-colors ${page === 1 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'}`}
              style={{ borderColor: themeColors.border }}
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </button>
            
            <span className="px-4 text-gray-500 font-medium">Page {totalPages === 0 ? 0 : page} of {totalPages}</span>
            
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0}
              className={`flex items-center px-3 py-1.5 border rounded-lg transition-colors ${page === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'}`}
              style={{ borderColor: themeColors.border }}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto bg-white" style={{ backgroundColor: themeColors.surface, color: themeColors.text }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: themeColors.primary }}>Edit User</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Phone Number</label>
                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition cursor-pointer">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Time of Birth</label>
                  <input type="time" name="timeOfBirth" value={formData.timeOfBirth} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Place of Birth</label>
                  <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-white shadow-sm hover:shadow font-medium transition bg-blue-600 hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingUserDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto bg-white" style={{ backgroundColor: themeColors.surface, color: themeColors.text }}>
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-indigo-50 flex items-center justify-center text-gray-400 font-bold text-2xl shadow-sm">
                  {viewingUserDetails.profileImage ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${viewingUserDetails.profileImage}`} alt={viewingUserDetails.name} className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                  ) : (
                    viewingUserDetails.name ? viewingUserDetails.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: themeColors.primary }}>User Details</h2>
                  <p className="text-sm text-gray-500">{viewingUserDetails.name || 'No Name'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 mt-2 rounded-full text-xs font-semibold ${viewingUserDetails.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {viewingUserDetails.isActive !== false ? 'Active' : 'Blocked'}
              </span>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</p>
                  <p className="font-medium text-gray-900">{viewingUserDetails.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900">{viewingUserDetails.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-gray-900 break-all">{viewingUserDetails.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Wallet Balance</p>
                  <p className="font-bold text-green-600 text-lg">₹{viewingUserDetails.walletBalance || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gender</p>
                  <p className="font-medium text-gray-900">{viewingUserDetails.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</p>
                  <p className="font-medium text-gray-900">{viewingUserDetails.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Time of Birth</p>
                  <p className="font-medium text-gray-900">{viewingUserDetails.timeOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Place of Birth</p>
                  <p className="font-medium text-gray-900">{viewingUserDetails.placeOfBirth || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-8 pt-5 border-t">
                <button 
                  onClick={() => setViewingUserDetails(null)} 
                  className="w-full px-5 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
