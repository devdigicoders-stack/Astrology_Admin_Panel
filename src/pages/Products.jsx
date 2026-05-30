import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, X, Image as ImageIcon, 
  CheckCircle, XCircle, ArrowUpRight, Filter, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import productService from '../services/productService';
import { usePermissions } from '../hooks/usePermissions';

const CATEGORIES = ['Gemstone', 'Rudraksha', 'Yantra', 'Book', 'Other'];

const initialFormState = {
  name: '',
  category: 'Gemstone',
  description: '',
  price: '',
  stock: '',
  isActive: true,
  images: null // Will store FileList
};

const Products = () => {
  const { themeColors } = useTheme();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canEditProducts, canCreateProducts, canDeleteProducts } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image preview state for the form
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAdminProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
      
      let matchesTab = true;
      if (activeTab === "Active") matchesTab = product.isActive === true;
      if (activeTab === "Inactive") matchesTab = product.isActive === false;
      if (activeTab === "Out of Stock") matchesTab = product.stock <= 0;

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [products, searchTerm, filterCategory, activeTab]);

  const totalCount = filteredProducts.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedProducts = filteredProducts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.isActive).length;
    const inactive = total - active;
    const outOfStock = products.filter(p => p.stock <= 0).length;
    return { total, active, inactive, outOfStock };
  }, [products]);

  const tabs = [
    { name: "All", count: products.length, icon: <Package size={16} /> },
    { name: "Active", count: products.filter(p => p.isActive).length, icon: <CheckCircle size={16} /> },
    { name: "Inactive", count: products.filter(p => !p.isActive).length, icon: <XCircle size={16} /> },
    { name: "Out of Stock", count: products.filter(p => p.stock <= 0).length, icon: <AlertCircle size={16} /> }
  ];

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    setFormData(prev => ({ ...prev, images: files }));

    // Generate previews
    if (files) {
      const previews = Array.from(files).map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        category: product.category || 'Gemstone',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        isActive: product.isActive ?? true,
        images: null // Don't pre-fill files, existing images are kept in backend if no new ones sent
      });
      // Show existing images as previews
      if (product.images && product.images.length > 0) {
        setImagePreviews(product.images.map(img => `http://localhost:5000/uploads/${img}`));
      } else {
        setImagePreviews([]);
      }
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
      setImagePreviews([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
    setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('category', formData.category);
      payload.append('description', formData.description);
      payload.append('price', Number(formData.price));
      payload.append('stock', Number(formData.stock));
      payload.append('isActive', formData.isActive);

      if (formData.images) {
        Array.from(formData.images).forEach(file => {
          payload.append('images', file);
        });
      }

      if (editingProduct) {
        // NOTE: Our backend replaces images if new ones are sent, or merges them depending on logic.
        // The current productController logic merges if new ones are uploaded.
        await productService.updateProduct(editingProduct._id, payload);
        toast.success("Product updated successfully!");
      } else {
        await productService.createProduct(payload);
        toast.success("Product created successfully!");
      }
      
      closeModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save product");
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
      await productService.deleteProduct(deletingId);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      // Create a minimal FormData to update just the status
      const payload = new FormData();
      payload.append('isActive', !product.isActive);
      // Backend requires required fields? Let's check: updateProduct allows partial updates!
      // Wait, updateProduct in backend controller might require other fields?
      // Actually, if we just want to toggle, we can send all existing fields + new status to be safe.
      payload.append('name', product.name);
      payload.append('category', product.category);
      payload.append('description', product.description);
      payload.append('price', product.price);
      payload.append('stock', product.stock);
      
      await productService.updateProduct(product._id, payload);
      toast.success(`Product ${!product.isActive ? 'Activated' : 'Deactivated'}!`);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Products Management
        </h1>
        {canCreateProducts && (
          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-white rounded-lg shadow-sm hover:shadow transition text-sm sm:text-base font-medium whitespace-nowrap"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Plus size={18} className="mr-1.5 sm:mr-2" />
            Add Product
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
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg text-blue-600">
            <Package size={22} className="sm:w-6 sm:h-6" />
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
          <div className="p-2.5 sm:p-3 bg-orange-50 rounded-lg text-orange-600">
            <XCircle size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">No Stock</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.outOfStock}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-red-50 rounded-lg text-red-600">
            <AlertCircle size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: themeColors.border, focusRing: themeColors.primary }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select 
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: themeColors.border }}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
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
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading products...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Try adjusting your filters or add a new product.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={`http://localhost:5000/uploads/${product.images[0]}`} 
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">₹{product.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center text-sm font-bold text-gray-900">
                          {product.stock} <span className="text-gray-500 ml-1 text-xs">units</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canEditProducts ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={product.isActive}
                            onChange={() => handleToggleStatus(product)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-4">
                      <button 
                        onClick={() => { setViewingProduct(product); setIsViewModalOpen(true); }}
                        className="text-indigo-500 hover:text-indigo-700 transition"
                        title="View"
                      >
                        <FaEye size={18} />
                      </button>
                      {canEditProducts && (
                        <button 
                          onClick={() => openModal(product)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                      )}
                      {canDeleteProducts && (
                        <button 
                          onClick={() => handleDeleteClick(product._id)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="name" required
                      value={formData.name} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="e.g. Premium Rudraksha Mala"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                    <select 
                      name="category" required
                      value={formData.category} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    name="description" required rows="3"
                    value={formData.description} onChange={handleInputChange}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                    placeholder="Enter detailed product description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Price (₹) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" name="price" required min="0" step="0.01"
                      value={formData.price} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity <span className="text-red-500">*</span></label>
                    <input 
                      type="number" name="stock" required min="0"
                      value={formData.stock} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="Enter available stock"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Product Images</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload images</span>
                          <input 
                            id="file-upload" name="images" type="file" multiple 
                            accept="image/*" className="sr-only"
                            onChange={handleFileChange} 
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" name="isActive"
                      checked={formData.isActive} onChange={handleInputChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Active (Visible to customers)</span>
                </div>

              </form>
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
                type="submit" form="productForm"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center"
                style={{ backgroundColor: themeColors.primary }}
              >
                {isSubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>
                ) : (
                  'Save Product'
                )}
              </button>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
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

      {/* View Modal */}
      {isViewModalOpen && viewingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Image Gallery */}
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mb-3 shadow-sm">
                    {viewingProduct.images && viewingProduct.images.length > 0 ? (
                      <img 
                        src={`http://localhost:5000/uploads/${viewingProduct.images[0]}`} 
                        alt={viewingProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>
                  {viewingProduct.images && viewingProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {viewingProduct.images.slice(1).map((img, idx) => (
                        <div key={idx} className="aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                          <img 
                            src={`http://localhost:5000/uploads/${img}`} 
                            alt={`${viewingProduct.name} ${idx+1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="w-full md:w-2/3 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-700">
                        {viewingProduct.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        viewingProduct.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingProduct.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{viewingProduct.name}</h1>
                    <p className="text-3xl font-bold" style={{ color: themeColors.primary }}>₹{viewingProduct.price}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {viewingProduct.description}
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Availability</p>
                      {viewingProduct.stock > 0 ? (
                        <p className="text-lg font-semibold text-gray-900">{viewingProduct.stock} units in stock</p>
                      ) : (
                        <p className="text-lg font-semibold text-red-600">Out of Stock</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Added On</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(viewingProduct.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
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

export default Products;
