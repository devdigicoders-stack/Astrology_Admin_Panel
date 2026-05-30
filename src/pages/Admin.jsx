import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Edit, Trash2, ShieldAlert, Plus, ShieldCheck, Users, UserCheck, UserX, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import adminService from '../services/adminService';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

export default function Admin() {
  const { themeColors } = useTheme();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [activeTab, setActiveTab] = useState("All Admins");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [viewingAdminDetails, setViewingAdminDetails] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: []
  });

  const availablePermissions = [
    "view_astrologers", "create_astrologers", "edit_astrologers", "delete_astrologers", "verify_astrologers", "manage_commission",
    "view_pooja", "create_pooja", "edit_pooja", "delete_pooja",
    "view_products", "create_products", "edit_products", "delete_products",
    "view_orders", "update_order_status",
    "view_users", "edit_users", "delete_users", "manage_user_status",
    "view_calls", "delete_calls",
    "view_complaints", "edit_complaints", "delete_complaints",
    "view_notifications", "create_notifications", "edit_notifications", "delete_notifications",
    "view_pooja_bookings", "edit_pooja_bookings", "delete_pooja_bookings",
    "view_carts", "edit_carts", "delete_carts",
    "view_transactions", "delete_transactions", "recharge_wallet",
    "view_withdrawals", "manage_withdrawals",
    "view_dashboard"
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllAdmins();
      if (data.success || data.data || Array.isArray(data)) {
        setAdmins(data.admins || data.data || data);
      } else {
        setAdmins(data);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (perm) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const openModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        password: '', // Leave empty for edit unless they want to change
        role: admin.role,
        permissions: admin.permissions || []
      });
    } else {
      setEditingAdmin(null);
      setFormData({ name: '', email: '', password: '', role: 'admin', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await adminService.updateAdmin(editingAdmin._id, payload);
        toast.success("Admin updated successfully!");
      } else {
        await adminService.createAdmin(formData);
        toast.success("Admin created successfully!");
      }
      closeModal();
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save admin");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminService.toggleAdminStatus(id, !currentStatus);
      toast.success(`Admin ${currentStatus ? 'blocked' : 'unblocked'} successfully!`);
      fetchAdmins();
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
          await adminService.deleteAdmin(id);
          toast.success("Admin deleted successfully!");
          fetchAdmins();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete admin");
        }
      }
    });
  };

  // Data processing for Tabs and Pagination
  const adminsList = Array.isArray(admins) ? admins : (admins?.data || admins?.admins || []);

  const totalAdmins = adminsList.length;
  const activeAdminsCount = adminsList.filter(a => a.isActive !== false).length;
  const blockedAdminsCount = totalAdmins - activeAdminsCount;

  const filteredAdmins = adminsList.filter(admin => {
    if (activeTab === "Active") return admin.isActive !== false;
    if (activeTab === "Blocked") return admin.isActive === false;
    return true; // "All Admins"
  });

  const totalCount = filteredAdmins.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedAdmins = filteredAdmins.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const tabs = [
    { name: "All Admins", count: totalAdmins, icon: <Users size={16} /> },
    { name: "Active", count: activeAdminsCount, icon: <UserCheck size={16} /> },
    { name: "Blocked", count: blockedAdminsCount, icon: <UserX size={16} /> }
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Admin Management
        </h1>
        <div className="w-full sm:w-auto">
          <button 
            onClick={() => openModal()}
            className="w-full sm:w-auto flex justify-center items-center px-4 py-2.5 text-white rounded-lg shadow-sm hover:shadow transition font-medium"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Plus size={20} className="mr-2" />
            Add Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-6 rounded-xl shadow-sm border flex items-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="p-4 rounded-full bg-blue-100 text-blue-600 mr-4"><Users size={24}/></div>
          <div>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>Total Admins</p>
            <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>{totalAdmins}</h3>
          </div>
        </div>
        <div className="p-6 rounded-xl shadow-sm border flex items-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="p-4 rounded-full bg-green-100 text-green-600 mr-4"><UserCheck size={24}/></div>
          <div>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>Active Admins</p>
            <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>{activeAdminsCount}</h3>
          </div>
        </div>
        <div className="p-6 rounded-xl shadow-sm border flex items-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="p-4 rounded-full bg-red-100 text-red-600 mr-4"><UserX size={24}/></div>
          <div>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>Blocked Admins</p>
            <h3 className="text-2xl font-bold" style={{ color: themeColors.text }}>{blockedAdminsCount}</h3>
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow-sm border bg-white overflow-hidden flex flex-col" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        
        {/* Custom Tabs Header matching the design */}
        <div className="flex items-center px-4 pt-4 border-b overflow-x-auto hide-scrollbar" style={{ borderColor: themeColors.border }}>
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

        {/* Clean Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: themeColors.background, color: themeColors.textSecondary }} className="text-xs uppercase font-semibold tracking-wider border-b">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: themeColors.border, color: themeColors.text }}>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-12 text-gray-500">Loading admins...</td></tr>
              ) : paginatedAdmins.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-gray-500">No admins found in this category.</td></tr>
              ) : (
                paginatedAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50 transition" style={{ hoverBackgroundColor: themeColors.background }}>
                    <td className="px-6 py-4 font-medium">{admin.name}</td>
                    <td className="px-6 py-4">{admin.email}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admin.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.isActive !== false ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-4">
                      <button onClick={() => setViewingAdminDetails(admin)} className="text-indigo-500 hover:text-indigo-700 transition" title="View">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => openModal(admin)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                        <Edit size={18} />
                      </button>
                      {admin.role !== 'superadmin' && (
                        <>
                          <button onClick={() => handleToggleStatus(admin._id, admin.isActive !== false)} className={`${admin.isActive !== false ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'} transition`} title={admin.isActive !== false ? "Block" : "Unblock"}>
                            {admin.isActive !== false ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                          </button>
                          <button onClick={() => handleDelete(admin._id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t gap-4" style={{ borderColor: themeColors.border, color: themeColors.textSecondary }}>
          <div className="flex items-center text-sm">
            <span className="mr-3">Rows per page:</span>
            <select 
              className="border rounded-md px-2 py-1 mr-4 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition" 
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>Showing {totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, totalCount)} of {totalCount}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
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
          <div 
            className="w-full max-w-5xl p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto bg-white"
            style={{ backgroundColor: themeColors.surface, color: themeColors.text }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: themeColors.primary }}>
              {editingAdmin ? 'Edit Admin' : 'Add Admin'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleInputChange} required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleInputChange} required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                    disabled={!!editingAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Password {editingAdmin && <span className="text-xs text-gray-400 opacity-80">(Leave blank to keep current)</span>}</label>
                  <input 
                    type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingAdmin}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availablePermissions.map(perm => (
                    <label key={perm} className="flex items-center space-x-2 text-sm cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition">
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.includes(perm)}
                        onChange={() => handlePermissionChange(perm)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="capitalize font-medium text-gray-700">{perm.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t" style={{ borderColor: themeColors.border }}>
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 font-medium transition" style={{ borderColor: themeColors.border }}>
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-white shadow-sm hover:shadow font-medium transition bg-blue-600 hover:bg-blue-700">
                  {editingAdmin ? 'Update' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingAdminDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto bg-white"
            style={{ backgroundColor: themeColors.surface, color: themeColors.text }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: themeColors.primary }}>Admin Details</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${viewingAdminDetails.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {viewingAdminDetails.isActive !== false ? 'Active' : 'Blocked'}
              </span>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</p>
                  <p className="font-medium text-gray-900">{viewingAdminDetails.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-gray-900 break-all">{viewingAdminDetails.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</p>
                  <p className="font-medium text-gray-900 capitalize">{viewingAdminDetails.role}</p>
                </div>
              </div>
              
              {viewingAdminDetails.role === 'admin' && viewingAdminDetails.permissions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingAdminDetails.permissions.map(perm => (
                      <span key={perm} className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 capitalize text-gray-700" style={{ borderColor: themeColors.border }}>
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8 pt-5 border-t" style={{ borderColor: themeColors.border }}>
                <button 
                  onClick={() => setViewingAdminDetails(null)} 
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
