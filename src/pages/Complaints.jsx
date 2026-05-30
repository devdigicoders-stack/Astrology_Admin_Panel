import React, { useState, useEffect, useMemo } from 'react';
import { 
  Headset, Search, X, Filter, MessageSquare, Trash2,
  Clock, CheckCircle, AlertCircle, RefreshCw, Send, User, Star, ChevronLeft, ChevronRight, Inbox
} from 'lucide-react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import complaintService from '../services/complaintService';
import { usePermissions } from '../hooks/usePermissions';

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const SUBMITTER_TYPES = [
  { value: 'all', label: 'All Senders' },
  { value: 'user', label: 'Users' },
  { value: 'astrologer', label: 'Astrologers' }
];

const Complaints = () => {
  const { themeColors } = useTheme();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canEditComplaints, canDeleteComplaints } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await complaintService.getAllComplaints();
      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch complaints");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredComplaints = useMemo(() => {
    return complaints.filter(comp => {
      const matchesSearch = 
        comp.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp._id.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = filterStatus === 'all' || comp.status === filterStatus;
      const matchesType = filterType === 'all' || comp.submitterType === filterType;
      
      const matchesTab = activeTab === 'all' 
        ? true 
        : activeTab === 'resolved' 
          ? (comp.status === 'resolved' || comp.status === 'closed')
          : comp.status === activeTab;
      
      return matchesSearch && matchesStatus && matchesType && matchesTab;
    });
  }, [complaints, searchTerm, filterStatus, filterType, activeTab]);

  const totalCount = filteredComplaints.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedComplaints = filteredComplaints.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    return { total, pending, inProgress, resolved };
  }, [complaints]);

  const tabs = [
    { name: "All", value: "all", count: complaints.length, icon: <Inbox size={16} /> },
    { name: "Pending", value: "pending", count: stats.pending, icon: <AlertCircle size={16} /> },
    { name: "In Progress", value: "in_progress", count: stats.inProgress, icon: <RefreshCw size={16} /> },
    { name: "Resolved/Closed", value: "resolved", count: stats.resolved, icon: <CheckCircle size={16} /> }
  ];

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const openViewModal = (complaint) => {
    setViewingComplaint(complaint);
    setReplyText(complaint.adminReply || '');
    setReplyStatus(complaint.status);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingComplaint(null);
    setReplyText('');
    setReplyStatus('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!viewingComplaint) return;
    
    setIsSubmitting(true);
    try {
      await complaintService.replyToComplaint(viewingComplaint._id, replyText, replyStatus);
      toast.success("Reply sent and status updated!");
      closeViewModal();
      fetchComplaints(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusUpdate = async (id, status) => {
    try {
      await complaintService.updateComplaintStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchComplaints(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await complaintService.deleteComplaint(deletingId);
      toast.success("Complaint deleted successfully");
      fetchComplaints(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete complaint");
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
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200"><AlertCircle size={12} className="mr-1"/> Pending</span>;
      case 'in_progress': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><RefreshCw size={12} className="mr-1 animate-spin-slow"/> In Progress</span>;
      case 'resolved': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200"><CheckCircle size={12} className="mr-1"/> Resolved</span>;
      case 'closed': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"><CheckCircle size={12} className="mr-1"/> Closed</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'astrologer') {
      return <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><Star size={10} className="mr-1"/> Astrologer</span>;
    }
    return <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"><User size={10} className="mr-1"/> User</span>;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Complaints & Support
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Tickets</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600">
              <Headset size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Pending</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-red-600">{stats.pending}</h3>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">In Progress</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.inProgress}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <RefreshCw size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Resolved/Closed</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600">{stats.resolved}</h3>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <CheckCircle size={22} />
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
            placeholder="Search by subject, name or ID..."
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
              {SUBMITTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
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
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Submitter</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading complaints...
                  </td>
                </tr>
              ) : paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <Headset size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No complaints found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((comp) => (
                  <tr key={comp._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{comp.subject}</span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-500 truncate" title={comp.message}>
                        {comp.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{comp.submitterName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {comp.submitterEmail ? (
                        <span className="text-sm text-gray-500">{comp.submitterEmail}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(comp.submitterType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(comp.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(comp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(comp.status)}
                        {comp.adminReply && (
                          <div className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center border border-indigo-100 mt-1" title={`Replied by ${comp.repliedBy?.name || 'Admin'}`}>
                            <MessageSquare size={10} className="mr-1"/> Replied
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex justify-center gap-4 items-center">
                      {/* Quick Status Dropdown or Badge */}
                      {canEditComplaints ? (
                        <select 
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none bg-white transition-opacity cursor-pointer"
                          value={comp.status}
                          onChange={(e) => handleQuickStatusUpdate(comp._id, e.target.value)}
                        >
                          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          comp.status === 'Open' ? 'bg-orange-100 text-orange-700' :
                          comp.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {comp.status}
                        </span>
                      )}
                      
                      {canEditComplaints ? (
                        <button 
                          onClick={() => openViewModal(comp)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="View & Reply"
                        >
                          <FaEye size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setViewingComplaint(comp);
                            setIsViewModalOpen(true);
                          }}
                          className="text-indigo-500 hover:text-indigo-700 transition"
                          title="View Details"
                        >
                          <FaEye size={18} />
                        </button>
                      )}
                      
                      {canDeleteComplaints && (
                        <button 
                          onClick={() => handleDeleteClick(comp._id)}
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

      {/* View & Reply Modal */}
      {isViewModalOpen && viewingComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Headset size={20} className="mr-2 text-indigo-600" />
                  Complaint Support Ticket
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Ticket ID: {viewingComplaint._id}</p>
              </div>
              <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar flex flex-col md:flex-row gap-6 bg-gray-50/30">
              
              {/* Left Side: Ticket Info */}
              <div className="w-full md:w-1/2 space-y-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    {getTypeBadge(viewingComplaint.submitterType)}
                    {getStatusBadge(viewingComplaint.status)}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{viewingComplaint.subject}</h3>
                  <div className="text-xs text-gray-500 mb-4 flex items-center">
                    <Clock size={12} className="mr-1"/> 
                    {new Date(viewingComplaint.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                    {viewingComplaint.message}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sender Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500 inline-block w-16">Name:</span> <span className="font-medium text-gray-900">{viewingComplaint.submitterName}</span></p>
                    {viewingComplaint.submitterEmail && (
                      <p><span className="text-gray-500 inline-block w-16">Email:</span> <span className="font-medium text-gray-900">{viewingComplaint.submitterEmail}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Reply Area */}
              <div className="w-full md:w-1/2">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <MessageSquare size={16} className="mr-2 text-blue-500"/>
                    Admin Reply
                  </h4>
                  
                  <form onSubmit={handleReplySubmit} className="flex-1 flex flex-col">
                    <div className="flex-1 mb-4">
                      <textarea
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response to the user here..."
                        className="w-full h-full min-h-[150px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none text-sm"
                        disabled={!canEditComplaints}
                      />
                    </div>
                    
                    {viewingComplaint.repliedBy && (
                      <div className="mb-4 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                        Last replied by <strong>{viewingComplaint.repliedBy.name}</strong> on {new Date(viewingComplaint.repliedAt).toLocaleDateString()}
                      </div>
                    )}

                    <div className="space-y-4">
                      {canEditComplaints && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Ticket Status</label>
                          <select 
                            value={replyStatus}
                            onChange={(e) => setReplyStatus(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                          >
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      )}
                      
                      {canEditComplaints && (
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: themeColors.primary }}
                        >
                          {isSubmitting ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Sending...</>
                          ) : (
                            <><Send size={16} className="mr-2"/> Send Reply & Update</>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Complaint?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this ticket? All replies and history will be lost.</p>
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

export default Complaints;
