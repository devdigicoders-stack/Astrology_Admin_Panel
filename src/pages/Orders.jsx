import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, Search, X, 
  CheckCircle, Truck, Package, XCircle, ArrowUpRight, Filter, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FaEye, FaEdit } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import orderService from '../services/orderService';
import { usePermissions } from '../hooks/usePermissions';

const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

const Orders = () => {
  const { themeColors } = useTheme();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canUpdateOrderStatus } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders();
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      const statusMatch = filterStatus === 'All' || order.orderStatus === filterStatus;
      const tabMatch = activeTab === 'All' || order.orderStatus === activeTab;
      
      return searchMatch && statusMatch && tabMatch;
    });
  }, [orders, searchTerm, filterStatus, activeTab]);

  const totalCount = filteredOrders.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter(o => o.orderStatus === "Processing").length;
    const shipped = orders.filter(o => o.orderStatus === "Shipped").length;
    const delivered = orders.filter(o => o.orderStatus === "Delivered").length;
    return { total, processing, shipped, delivered };
  }, [orders]);

  const tabs = [
    { name: "All", count: orders.length, icon: <ClipboardList size={16} /> },
    { name: "Processing", count: stats.processing, icon: <Package size={16} /> },
    { name: "Shipped", count: stats.shipped, icon: <Truck size={16} /> },
    { name: "Delivered", count: stats.delivered, icon: <CheckCircle size={16} /> },
    { name: "Cancelled", count: orders.filter(o => o.orderStatus === "Cancelled").length, icon: <XCircle size={16} /> }
  ];

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const openViewModal = (order) => {
    setViewingOrder(order);
    setIsViewModalOpen(true);
  };

  const openStatusModal = (order) => {
    setEditingOrder(order);
    setNewStatus(order.orderStatus);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    setIsSubmitting(true);
    try {
      await orderService.updateOrderStatus(editingOrder._id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      setIsStatusModalOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const getStatusColor = (status) => {
    switch(status) {
      case 'Processing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Processing': return <Package size={16} className="mr-1.5" />;
      case 'Shipped': return <Truck size={16} className="mr-1.5" />;
      case 'Delivered': return <CheckCircle size={16} className="mr-1.5" />;
      case 'Cancelled': return <XCircle size={16} className="mr-1.5" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Orders Management
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Processing</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.processing}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Package size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Shipped</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.shipped}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Truck size={22} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Delivered</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600">{stats.delivered}</h3>
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
            placeholder="Search by Order ID or Customer..."
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
            {ORDER_STATUSES.map(status => (
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
            <thead className="bg-gray-50 border-b border-gray-100 whitespace-nowrap text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">User Phone</th>
                <th className="px-6 py-4">User Email</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900" title={order._id}>
                        ...{order._id.slice(-8)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.user ? (
                        <p className="font-semibold text-gray-800">
                          {typeof order.user === 'object' ? (order.user.name || 'Unknown') : `User: ${String(order.user).slice(-8)}`}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">User deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.user && typeof order.user === 'object' ? (
                        <p className="text-sm text-gray-600">{order.user.phoneNumber || 'N/A'}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.user && typeof order.user === 'object' ? (
                        <p className="text-sm text-gray-600">{order.user.email || 'N/A'}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">{order.orderItems.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-4">
                      <button 
                        onClick={() => openViewModal(order)}
                        className="text-indigo-500 hover:text-indigo-700 transition"
                        title="View Details"
                      >
                        <FaEye size={18} />
                      </button>
                      {canUpdateOrderStatus && (
                        <button 
                          onClick={() => openStatusModal(order)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Update Status"
                        >
                          <FaEdit size={18} />
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
      {isViewModalOpen && viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">ID: {viewingOrder._id}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Top Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">
                    {typeof viewingOrder.user === 'object' ? (viewingOrder.user?.name || 'Unknown') : `User ID: ${viewingOrder.user}`}
                  </p>
                  {typeof viewingOrder.user === 'object' && (
                    <>
                      <p className="text-sm text-gray-600">{viewingOrder.user?.email}</p>
                      <p className="text-sm text-gray-600">{viewingOrder.user?.phoneNumber}</p>
                    </>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Payment</p>
                  <p className="font-semibold text-gray-900 mb-1">{viewingOrder.paymentStatus}</p>
                  <p className="text-xs text-gray-500 font-mono break-all">
                    Txn: {viewingOrder.transactionId || 'N/A'}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center items-center text-center">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{viewingOrder.totalAmount}</p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 mb-6 rounded-xl border flex items-center ${getStatusColor(viewingOrder.orderStatus)}`}>
                <div className="mr-3">
                  {getStatusIcon(viewingOrder.orderStatus)}
                </div>
                <div>
                  <p className="font-semibold">Order is currently {viewingOrder.orderStatus}</p>
                  <p className="text-sm opacity-80">
                    Placed on: {new Date(viewingOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipping Address */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center border-b pb-2">
                    <MapPin size={16} className="mr-2 text-gray-400" /> Shipping Address
                  </h3>
                  {viewingOrder.shippingAddress ? (
                    <div className="text-gray-700 bg-white p-4 rounded-lg border border-gray-100 shadow-sm leading-relaxed text-sm">
                      <p>{viewingOrder.shippingAddress.address}</p>
                      <p>{viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state}</p>
                      <p>{viewingOrder.shippingAddress.country} - {viewingOrder.shippingAddress.postalCode}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No shipping address provided.</p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center border-b pb-2">
                    <Package size={16} className="mr-2 text-gray-400" /> Order Items ({viewingOrder.orderItems.length})
                  </h3>
                  <div className="space-y-3">
                    {viewingOrder.orderItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.product?.images && item.product.images.length > 0 ? (
                            <img src={`http://localhost:5000/uploads/${item.product.images[0]}`} alt="Product" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">
                            {item.product?.name || <span className="italic text-gray-400">Deleted Product</span>}
                          </p>
                          {item.product?.category && (
                            <p className="text-xs text-indigo-600 mb-0.5">{item.product.category}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="ml-4 font-bold text-gray-900">
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Update Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus}>
              <div className="p-6">
                <div className="mb-4 text-sm text-gray-600">
                  Updating status for Order: <br/>
                  <span className="font-mono text-xs font-semibold text-gray-800">{editingOrder._id}</span>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                <div className="space-y-2">
                  {ORDER_STATUSES.map(status => (
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
                        name="orderStatus" 
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
                  disabled={isSubmitting || newStatus === editingOrder.orderStatus}
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

    </div>
  );
};

export default Orders;
