import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Plus, Search, X, Filter,
  CheckCircle, XCircle, Send, Users, User, Star, ChevronLeft, ChevronRight, AlertTriangle, Trash2
} from 'lucide-react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import notificationService from '../services/notificationService';
import { usePermissions } from '../hooks/usePermissions';

const TARGET_AUDIENCES = [
  { value: 'all', label: 'All (Users & Astrologers)' },
  { value: 'users', label: 'Only Users' },
  { value: 'astrologers', label: 'Only Astrologers' }
];

const NOTIFICATION_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'alert', label: 'Alert' },
  { value: 'promo', label: 'Promotion' },
  { value: 'system', label: 'System' }
];

const initialFormState = {
  title: '',
  message: '',
  targetAudience: 'all',
  type: 'general'
};

const Notifications = () => {
  const { themeColors } = useTheme();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canCreateNotifications, canEditNotifications, canDeleteNotifications } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAudience, setFilterAudience] = useState('all_filters');
  const [activeTab, setActiveTab] = useState('all_filters');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingNotification, setEditingNotification] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingNotification, setViewingNotification] = useState(null);
  
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAllNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAudience = filterAudience === 'all_filters' || notif.targetAudience === filterAudience;
      const matchesTab = activeTab === 'all_filters' || notif.targetAudience === activeTab;
      return matchesSearch && matchesAudience && matchesTab;
    });
  }, [notifications, searchTerm, filterAudience, activeTab]);

  const totalCount = filteredNotifications.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedNotifications = filteredNotifications.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = notifications.length;
    const active = notifications.filter(n => n.isActive).length;
    const inactive = total - active;
    const alerts = notifications.filter(n => n.type === 'alert').length;
    return { total, active, inactive, alerts };
  }, [notifications]);

  const tabs = [
    { name: "All Audiences", value: "all_filters", count: notifications.length, icon: <Users size={16} /> },
    { name: "Users", value: "users", count: notifications.filter(n => n.targetAudience === 'users').length, icon: <User size={16} /> },
    { name: "Astrologers", value: "astrologers", count: notifications.filter(n => n.targetAudience === 'astrologers').length, icon: <Star size={16} /> },
    { name: "General (All)", value: "all", count: notifications.filter(n => n.targetAudience === 'all').length, icon: <Bell size={16} /> }
  ];

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (notif = null) => {
    if (notif) {
      setEditingNotification(notif);
      setFormData({
        title: notif.title,
        message: notif.message,
        targetAudience: notif.targetAudience,
        type: notif.type
      });
    } else {
      setEditingNotification(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNotification(null);
    setFormData(initialFormState);
  };

  const openViewModal = (notif) => {
    setViewingNotification(notif);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingNotification) {
        await notificationService.updateNotification(editingNotification._id, formData);
        toast.success("Notification updated successfully!");
      } else {
        await notificationService.createNotification(formData);
        toast.success("Notification sent successfully!");
      }
      
      closeModal();
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await notificationService.deleteNotification(deletingId);
      toast.success("Notification deleted successfully");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (notif) => {
    try {
      await notificationService.toggleNotificationStatus(notif._id, !notif.isActive);
      toast.success(`Notification ${!notif.isActive ? 'Activated' : 'Deactivated'}!`);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const getAudienceBadge = (audience) => {
    switch(audience) {
      case 'all': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"><Users size={12} className="mr-1"/> All</span>;
      case 'users': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"><User size={12} className="mr-1"/> Users</span>;
      case 'astrologers': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800"><Star size={12} className="mr-1"/> Astrologers</span>;
      default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">{audience}</span>;
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'alert': return <span className="text-red-600 font-semibold uppercase text-xs tracking-wider">Alert</span>;
      case 'promo': return <span className="text-green-600 font-semibold uppercase text-xs tracking-wider">Promo</span>;
      case 'system': return <span className="text-gray-600 font-semibold uppercase text-xs tracking-wider">System</span>;
      default: return <span className="text-blue-600 font-semibold uppercase text-xs tracking-wider">General</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Notifications Hub
        </h1>
        {canCreateNotifications && (
          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex justify-center items-center px-4 py-2.5 text-white rounded-lg shadow-sm hover:shadow transition font-medium whitespace-nowrap"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Send size={18} className="mr-2" />
            Send Notification
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Bell size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Active</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.active}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg text-green-600">
            <CheckCircle size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Inactive</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.inactive}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg text-gray-600">
            <XCircle size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Alerts</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.alerts}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-red-50 rounded-lg text-red-600">
            <AlertTriangle size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: themeColors.border, focusRing: themeColors.primary }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select 
            value={filterAudience}
            onChange={(e) => { setFilterAudience(e.target.value); setPage(1); }}
            className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: themeColors.border }}
          >
            <option value="all_filters">All Audiences</option>
            {TARGET_AUDIENCES.map(aud => (
              <option key={aud.value} value={aud.value}>{aud.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Custom Tabs Header matching the design */}
        <div className="flex items-center px-4 pt-4 border-b overflow-x-auto hide-scrollbar" style={{ borderColor: themeColors.border }}>
          {tabs.map(tab => (
            <button 
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              className={`flex items-center pb-3 px-4 mr-4 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.value 
                  ? 'text-indigo-600 border-indigo-600 font-semibold' 
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

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 whitespace-nowrap text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading notifications...
                  </td>
                </tr>
              ) : paginatedNotifications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No notifications found</p>
                    <p className="text-sm">Try adjusting your search or send a new notification.</p>
                  </td>
                </tr>
              ) : (
                paginatedNotifications.map((notif) => (
                  <tr key={notif._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{notif.title}</span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-600 truncate" title={notif.message}>
                        {notif.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(notif.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAudienceBadge(notif.targetAudience)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {notif.createdBy?.name || "Unknown Sender"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canEditNotifications ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={notif.isActive}
                            onChange={() => handleToggleStatus(notif)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          notif.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {notif.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex justify-center gap-4">
                      <button 
                        onClick={() => openViewModal(notif)}
                        className="text-indigo-500 hover:text-indigo-700 transition"
                        title="View Notification"
                      >
                        <FaEye size={18} />
                      </button>
                      {canEditNotifications && (
                        <button 
                          onClick={() => openModal(notif)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit Notification"
                        >
                          <FaEdit size={18} />
                        </button>
                      )}
                      {canDeleteNotifications && (
                        <button 
                          onClick={() => handleDeleteClick(notif._id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete Notification"
                        >
                          <FaTrash size={18} />
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
                className="border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition" 
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
              className={`flex items-center px-3 py-1.5 border rounded-lg transition-colors ${page === 1 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:text-indigo-600'}`}
              style={{ borderColor: themeColors.border }}
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </button>
            <span className="px-4 text-gray-500 font-medium">Page {totalPages === 0 ? 0 : page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0}
              className={`flex items-center px-3 py-1.5 border rounded-lg transition-colors ${page === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:text-indigo-600'}`}
              style={{ borderColor: themeColors.border }}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Bell size={20} className="mr-2 text-indigo-600" />
                {editingNotification ? 'Edit Notification' : 'Compose Notification'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Notification Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="title" required
                    value={formData.title} onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    placeholder="e.g. Diwali Special Offer!"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Message Body <span className="text-red-500">*</span></label>
                  <textarea 
                    name="message" required rows="4"
                    value={formData.message} onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                    placeholder="Write your message here..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Target Audience <span className="text-red-500">*</span></label>
                    <select 
                      name="targetAudience" required
                      value={formData.targetAudience} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                    >
                      {TARGET_AUDIENCES.map(aud => (
                        <option key={aud.value} value={aud.value}>{aud.label}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">Note: Normal admins can only target Astrologers.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Notification Type <span className="text-red-500">*</span></label>
                    <select 
                      name="type" required
                      value={formData.type} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                    >
                      {NOTIFICATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  type="button" onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      {editingNotification ? 'Update Notification' : 'Send Notification'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Notification?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this notification? Users/Astrologers will no longer see it.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-sm shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Notification Modal */}
      {isViewModalOpen && viewingNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Bell size={20} className="mr-2 text-indigo-600" />
                Notification Details
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{viewingNotification.title}</h3>
              <p className="text-xs text-gray-500 mb-4">{new Date(viewingNotification.createdAt).toLocaleString()}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 overflow-hidden">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-all">{viewingNotification.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Target Audience</p>
                  <div>{getAudienceBadge(viewingNotification.targetAudience)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Type</p>
                  <div>{getTypeBadge(viewingNotification.type)}</div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notifications;
