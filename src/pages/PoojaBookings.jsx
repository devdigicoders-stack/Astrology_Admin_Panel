import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, Search, X, MapPin, Trash2,
  CheckCircle, Clock, XCircle, Filter, Calendar as CalendarIcon, User, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import poojaBookingService from '../services/poojaBookingService';
import { usePermissions } from '../hooks/usePermissions';

const STATUSES = ["Confirmed", "Completed", "Cancelled"];

const PoojaBookings = () => {
  const { themeColors } = useTheme();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canEditPoojaBookings, canDeletePoojaBookings } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [viewingBooking, setViewingBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await poojaBookingService.getAllBookings();
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch pooja bookings");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const searchMatch = 
        (booking.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.pooja?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking._id.toLowerCase().includes(searchTerm.toLowerCase());
        
      const statusMatch = filterStatus === 'All' || booking.status === filterStatus;
      const tabMatch = activeTab === 'All' || booking.status === activeTab;
      return searchMatch && statusMatch && tabMatch;
    });
  }, [bookings, searchTerm, filterStatus, activeTab]);

  const totalCount = filteredBookings.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedBookings = filteredBookings.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === "Confirmed").length;
    const completed = bookings.filter(b => b.status === "Completed").length;
    const cancelled = bookings.filter(b => b.status === "Cancelled").length;
    return { total, confirmed, completed, cancelled };
  }, [bookings]);

  const tabs = [
    { name: "All", count: bookings.length, icon: <CalendarCheck size={16} /> },
    { name: "Confirmed", count: stats.confirmed, icon: <Clock size={16} /> },
    { name: "Completed", count: stats.completed, icon: <CheckCircle size={16} /> },
    { name: "Cancelled", count: stats.cancelled, icon: <XCircle size={16} /> }
  ];

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const openViewModal = (booking) => {
    setViewingBooking(booking);
    setIsViewModalOpen(true);
  };

  const openStatusModal = (booking) => {
    setEditingBooking(booking);
    setNewStatus(booking.status);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    
    setIsSubmitting(true);
    try {
      await poojaBookingService.updateBookingStatus(editingBooking._id, newStatus);
      toast.success(`Booking status updated to ${newStatus}`);
      setIsStatusModalOpen(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update booking status");
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
      await poojaBookingService.deleteBooking(deletingId);
      toast.success("Booking deleted successfully");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to delete booking");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const getStatusColor = (status) => {
    switch(status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Confirmed': return <Clock size={16} className="mr-1.5" />;
      case 'Completed': return <CheckCircle size={16} className="mr-1.5" />;
      case 'Cancelled': return <XCircle size={16} className="mr-1.5" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Pooja Bookings
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Bookings</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600">
              <CalendarCheck size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Confirmed</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.confirmed}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Clock size={22} />
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
              <p className="text-gray-500 text-sm font-medium mb-1">Cancelled</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-red-600">{stats.cancelled}</h3>
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
            placeholder="Search by ID, User or Pooja..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: themeColors.border, focusRing: themeColors.primary }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: themeColors.border }}
          >
            <option value="All">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
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

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pooja Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pooja Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price Paid</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading bookings...
                  </td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <CalendarCheck size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No bookings found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-900" title={booking._id}>
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1" /> {booking.bookingTime}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.user ? (
                        <p className="font-medium text-gray-800 line-clamp-1">{booking.user.name}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">User deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.user ? (
                        <p className="text-sm text-gray-500 line-clamp-1">{booking.user.phoneNumber}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {booking.address ? (
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-[150px]" title={booking.address}>{booking.address}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No Address</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.pooja ? (
                        <p className="font-medium text-gray-900 line-clamp-1">{booking.pooja.name}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Pooja deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.pooja ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {booking.pooja.category}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">₹{booking.pricePaid}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-4">
                      <button 
                        onClick={() => openViewModal(booking)}
                        className="text-indigo-500 hover:text-indigo-700 transition"
                        title="View Details"
                      >
                        <FaEye size={18} />
                      </button>
                      {canEditPoojaBookings && (
                        <button 
                          onClick={() => openStatusModal(booking)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Update Status"
                        >
                          <FaEdit size={18} />
                        </button>
                      )}
                      {canDeletePoojaBookings && (
                        <button 
                          onClick={() => handleDeleteClick(booking._id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete Booking"
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

      {/* View Modal */}
      {isViewModalOpen && viewingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">ID: {viewingBooking._id}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Status Banner */}
              <div className={`p-4 mb-6 rounded-xl border flex items-center ${getStatusColor(viewingBooking.status)}`}>
                <div className="mr-3">
                  {getStatusIcon(viewingBooking.status)}
                </div>
                <div>
                  <p className="font-semibold text-lg">Booking is {viewingBooking.status}</p>
                  <p className="text-sm opacity-80">
                    Booked on: {new Date(viewingBooking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                    <User size={16} className="mr-2 text-gray-400" /> User Information
                  </h3>
                  {viewingBooking.user ? (
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium text-gray-500 w-20 inline-block">Name:</span> {viewingBooking.user.name}</p>
                      <p><span className="font-medium text-gray-500 w-20 inline-block">Phone:</span> {viewingBooking.user.phoneNumber}</p>
                      {viewingBooking.user.email && (
                        <p><span className="font-medium text-gray-500 w-20 inline-block">Email:</span> {viewingBooking.user.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 italic">User account has been deleted.</p>
                  )}
                </div>

                {/* Pooja Info */}
                <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                    <CalendarIcon size={16} className="mr-2 text-gray-400" /> Event Details
                  </h3>
                  {viewingBooking.pooja ? (
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium text-gray-500 w-20 inline-block">Pooja:</span> {viewingBooking.pooja.name}</p>
                      <p><span className="font-medium text-gray-500 w-20 inline-block">Category:</span> {viewingBooking.pooja.category}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 italic">Pooja service has been deleted.</p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium text-gray-500 w-20 inline-block">Date:</span> <span className="font-semibold text-gray-900">{new Date(viewingBooking.bookingDate).toLocaleDateString()}</span></p>
                    <p><span className="font-medium text-gray-500 w-20 inline-block">Time:</span> <span className="font-semibold text-gray-900">{viewingBooking.bookingTime}</span></p>
                    {viewingBooking.address && (
                      <p className="flex items-start mt-2 pt-2 border-t border-gray-50">
                        <span className="font-medium text-gray-500 w-20 inline-block shrink-0 mt-0.5">Address:</span> 
                        <span className="text-gray-800 break-words">{viewingBooking.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 p-5 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Amount Paid via Wallet</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">₹{viewingBooking.pricePaid}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && editingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Update Booking Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus}>
              <div className="p-6">
                <div className="mb-4 text-sm text-gray-600">
                  Select new status for this booking:
                </div>
                
                <div className="space-y-2">
                  {STATUSES.map(status => (
                    <label 
                      key={status} 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        newStatus === status 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="bookingStatus" 
                        value={status}
                        checked={newStatus === status}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className={`ml-3 flex items-center px-2.5 py-1 rounded text-sm font-medium ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        {status}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || newStatus === editingBooking.status}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center disabled:opacity-50"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Status'}
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Booking?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this Pooja Booking? This action cannot be undone.</p>
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

export default PoojaBookings;
