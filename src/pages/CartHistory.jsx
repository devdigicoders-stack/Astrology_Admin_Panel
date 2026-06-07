import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Search, X, Package,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter, IndianRupee
} from 'lucide-react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import cartService from '../services/cartService';
import { usePermissions } from '../hooks/usePermissions';

const CartHistory = () => {
  const { themeColors } = useTheme();
  
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canEditCarts, canDeleteCarts } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [viewingCart, setViewingCart] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const res = await cartService.getAllCarts();
      if (res.success) {
        setCarts(res.carts || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch carts");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  
  const calculateTotalValue = (cartItems) => {
    return cartItems.reduce((total, item) => total + ((item.product?.price || 0) * item.quantity), 0);
  };
  
  const calculateTotalItems = (cartItems) => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredCarts = useMemo(() => {
    return carts.filter(cart => {
      const searchMatch = 
        (cart.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cart.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cart.user?.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      let tabMatch = true;
      if (activeTab === "Active") tabMatch = cart.isActive === true;
      if (activeTab === "Inactive") tabMatch = cart.isActive === false;

      return searchMatch && tabMatch;
    });
  }, [carts, searchTerm, activeTab]);

  const totalCount = filteredCarts.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedCarts = filteredCarts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const totalCarts = carts.length;
    const active = carts.filter(c => c.isActive).length;
    const inactive = carts.filter(c => !c.isActive).length;
    
    let totalItems = 0;
    let potentialRevenue = 0;
    
    carts.forEach(cart => {
      totalItems += calculateTotalItems(cart.items);
      potentialRevenue += calculateTotalValue(cart.items);
    });
    
    return { totalCarts, active, inactive, totalItems, potentialRevenue };
  }, [carts]);

  const tabs = [
    { name: "All", count: carts.length, icon: <ShoppingCart size={16} /> },
    { name: "Active", count: stats.active, icon: <CheckCircle size={16} /> },
    { name: "Inactive", count: stats.inactive, icon: <XCircle size={16} /> }
  ];

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const openViewModal = (cart) => {
    setViewingCart(cart);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await cartService.deleteCart(deletingId);
      toast.success("Cart deleted successfully");
      fetchCarts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete cart");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await cartService.updateCartStatus(id, !currentStatus);
      toast.success(`Cart marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchCarts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Cart History
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Carts</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalCarts}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg text-blue-600">
            <ShoppingCart size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Abandoned Items</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalItems}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Package size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Active Carts</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.active}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg text-green-600">
            <CheckCircle size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Potential Rev.</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">₹{stats.potentialRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-orange-50 rounded-lg text-orange-600">
            <IndianRupee size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by User Name, Email or Phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base"
            style={{ borderColor: themeColors.border, focusRing: themeColors.primary }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Custom Tabs Header */}
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
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Total Items</th>
                <th className="px-6 py-4">Cart Value</th>
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
                    Loading carts...
                  </td>
                </tr>
              ) : paginatedCarts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No carts found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedCarts.map((cart) => (
                  <tr key={cart._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cart.user ? (
                        <p className="font-bold text-gray-900">{cart.user.name}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Deleted User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cart.user ? (
                        <p className="text-sm text-gray-600">{cart.user.email}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cart.user ? (
                        <p className="text-sm text-gray-600">{cart.user.phoneNumber}</p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {calculateTotalItems(cart.items)} Items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">₹{calculateTotalValue(cart.items).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{new Date(cart.updatedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{new Date(cart.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canEditCarts ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={cart.isActive}
                            onChange={() => handleToggleStatus(cart._id, cart.isActive)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          cart.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cart.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-4">
                      <button 
                        onClick={() => openViewModal(cart)}
                        className="text-indigo-500 hover:text-indigo-700 transition"
                        title="View Cart Contents"
                      >
                        <FaEye size={18} />
                      </button>
                      {canDeleteCarts && (
                        <button 
                          onClick={() => handleDeleteClick(cart._id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete Cart"
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
      {isViewModalOpen && viewingCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Cart Contents</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">
                  {viewingCart.user?.name || "Unknown User"}'s Cart
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cart Items</h3>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">Cart Created</p>
                  <p className="text-sm text-gray-700">{new Date(viewingCart.createdAt).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}</p>
                </div>
              </div>

              <div className="space-y-4">
                {viewingCart.items && viewingCart.items.length > 0 ? (
                  viewingCart.items.map((item, index) => (
                    <div key={index} className="flex items-center p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition">
                      <div className="h-16 w-16 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 mr-4">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${item.product.images[0]}`} alt={item.product?.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product?.name || "Unknown Product"}</h4>
                        <p className="text-sm text-gray-500">{item.product?.category || "Unknown Category"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Qty: <span className="font-semibold text-gray-800">{item.quantity}</span></p>
                        <p className="font-bold text-gray-900">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    This cart has no valid products.
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Cart Value</p>
                  <p className="text-xs text-blue-600 mt-1">{calculateTotalItems(viewingCart.items)} Items Included</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-700">₹{calculateTotalValue(viewingCart.items).toLocaleString()}</p>
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
              <FaTrash size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Cart?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this Cart? This action cannot be undone.</p>
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

export default CartHistory;
