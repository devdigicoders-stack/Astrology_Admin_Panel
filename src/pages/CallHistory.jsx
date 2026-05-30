import React, { useState, useEffect, useMemo } from 'react';
import { 
  PhoneCall, Search, X, Trash2, Calendar, Clock, Filter,
  Phone, Video, MessageSquare, CheckCircle, XCircle, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { FaTrash, FaEye } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';

const CallHistory = () => {
  const { themeColors } = useTheme();
  
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // RBAC permissions
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canDeleteCalls = isSuperAdmin || hasPermission("delete_calls");

  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [viewingCall, setViewingCall] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/calls/admin');
      if (res.data.success) {
        setCalls(res.data.calls);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch call history");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        (call.user?.name || '').toLowerCase().includes(searchStr) ||
        (call.astrologer?.name || '').toLowerCase().includes(searchStr) ||
        call._id.toLowerCase().includes(searchStr);
        
      const matchesType = filterType === 'all' || call.type === filterType;
      const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [calls, searchTerm, filterType, filterStatus]);

  const totalCount = filteredCalls.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedCalls = filteredCalls.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = calls.length;
    const completed = calls.filter(c => c.status === 'completed').length;
    const ongoing = calls.filter(c => c.status === 'ongoing').length;
    const rejected = calls.filter(c => c.status === 'rejected' || c.status === 'missed').length;
    return { total, completed, ongoing, rejected };
  }, [calls]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const openViewModal = (call) => {
    setViewingCall(call);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCall(null);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/calls/admin/${deletingId}`);
      toast.success("Call record deleted successfully");
      fetchCalls();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete call record");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1"/> Pending</span>;
      case 'ongoing': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"><PhoneCall size={12} className="mr-1 animate-pulse"/> Ongoing</span>;
      case 'completed': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Completed</span>;
      case 'rejected': 
      case 'missed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1"/> {status.charAt(0).toUpperCase() + status.slice(1)}</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'chat': return <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"><MessageSquare size={10} className="mr-1"/> Chat</span>;
      case 'audio': return <span className="inline-flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded"><Phone size={10} className="mr-1"/> Audio</span>;
      case 'video': return <span className="inline-flex items-center text-xs font-medium text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded"><Video size={10} className="mr-1"/> Video</span>;
      default: return <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">{type}</span>;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    return `${minutes} min`;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Call History
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Calls</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600">
              <PhoneCall size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Completed</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completed}</h3>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <CheckCircle size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Ongoing</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.ongoing}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Clock size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Rejected/Missed</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-red-600">{stats.rejected}</h3>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <XCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by ID, User, or Astrologer..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: themeColors.border, focusRing: themeColors.primary }}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={18} className="text-gray-500" />
            <select 
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="w-full sm:w-auto border rounded-lg px-3 py-2 focus:outline-none text-sm"
              style={{ borderColor: themeColors.border }}
            >
              <option value="all">All Types</option>
              <option value="chat">Chat</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full sm:w-auto border rounded-lg px-3 py-2 focus:outline-none text-sm"
              style={{ borderColor: themeColors.border }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 whitespace-nowrap text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Call ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Astrologer</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading call history...
                  </td>
                </tr>
              ) : paginatedCalls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <PhoneCall size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No calls found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedCalls.map((call) => (
                  <tr key={call._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-gray-600 text-xs" title={call._id}>{call._id.substring(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{call.user?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{call.astrologer?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(call.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium font-mono">
                        {formatDuration(call.totalDurationMinutes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-bold">
                        ₹{call.totalCost || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex flex-col">
                        <span className="text-gray-900">{new Date(call.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs">{new Date(call.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(call.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex justify-center gap-4 items-center">
                      <button 
                        onClick={() => openViewModal(call)}
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="View Details"
                      >
                        <FaEye size={18} />
                      </button>
                      
                      {canDeleteCalls && (
                        <button 
                          onClick={() => handleDeleteClick(call._id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete"
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

      {/* View Modal */}
      {isViewModalOpen && viewingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <PhoneCall size={20} className="mr-2 text-indigo-600" />
                  Call Details
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {viewingCall._id}</p>
              </div>
              <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-2">
                    {viewingCall.user?.name ? viewingCall.user.name.charAt(0) : '?'}
                  </div>
                  <span className="font-semibold text-gray-900">{viewingCall.user?.name || 'Unknown User'}</span>
                  <span className="text-xs text-gray-500">User</span>
                </div>
                
                <div className="flex flex-col items-center px-4">
                  <div className="px-3 py-1 bg-gray-100 rounded-full mb-2 flex items-center">
                    {getTypeBadge(viewingCall.type)}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span className="h-px w-8 bg-gray-300"></span>
                    {getStatusBadge(viewingCall.status)}
                    <span className="h-px w-8 bg-gray-300"></span>
                  </div>
                  <div className="mt-2 font-mono font-bold text-indigo-600">
                    {formatDuration(viewingCall.durationInSeconds)}
                  </div>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl mb-2">
                    {viewingCall.astrologer?.name ? viewingCall.astrologer.name.charAt(0) : '?'}
                  </div>
                  <span className="font-semibold text-gray-900">{viewingCall.astrologer?.name || 'Unknown Astrologer'}</span>
                  <span className="text-xs text-gray-500">Astrologer</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Timing Info</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-gray-500">Started:</span> <span className="font-medium text-gray-900">{new Date(viewingCall.createdAt).toLocaleString()}</span></p>
                      {viewingCall.endTime && (
                        <p className="flex justify-between"><span className="text-gray-500">Ended:</span> <span className="font-medium text-gray-900">{new Date(viewingCall.endTime).toLocaleString()}</span></p>
                      )}
                      <p className="flex justify-between"><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-900">{formatDuration(viewingCall.totalDurationMinutes)}</span></p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Financial Info</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-green-800">Total Cost:</span> <span className="font-bold text-green-700 text-lg">₹{viewingCall.totalCost || 0}</span></p>
                      <p className="flex justify-between"><span className="text-green-800 opacity-80">Astrologer Earnings:</span> <span className="font-medium text-green-700">₹{viewingCall.astrologerEarnings || 0}</span></p>
                      <p className="flex justify-between"><span className="text-green-800 opacity-80">Platform Earnings:</span> <span className="font-medium text-green-700">₹{viewingCall.superAdminEarnings || 0}</span></p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Record?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this call history record? This action cannot be undone.</p>
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

    </div>
  );
};

export default CallHistory;
