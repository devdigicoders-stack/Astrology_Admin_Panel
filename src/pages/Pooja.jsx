import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Plus, Search, Edit2, Trash2, X, Image as ImageIcon, 
  CheckCircle, XCircle, ArrowUpRight, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import poojaService from '../services/poojaService';
import { usePermissions } from '../hooks/usePermissions';

const CATEGORIES = ["Health", "Marriage", "Career", "Wealth", "Dosha Nivaran", "Other"];

const initialFormState = {
  name: '',
  category: 'Health',
  description: '',
  price: '',
  isActive: true,
  image: null // Will store File
};

const Pooja = () => {
  const { themeColors } = useTheme();
  
  const [poojas, setPoojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canEditPoojas, canCreatePoojas, canDeletePoojas } = usePermissions();
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
  
  const [editingPooja, setEditingPooja] = useState(null);
  const [viewingPooja, setViewingPooja] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image preview state for the form
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchPoojas();
  }, []);

  const fetchPoojas = async () => {
    try {
      setLoading(true);
      const res = await poojaService.getAdminPoojas();
      if (res.success) {
        setPoojas(res.poojas);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch pooja services");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredPoojas = useMemo(() => {
    return poojas.filter(pooja => {
      const matchesSearch = pooja.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            pooja.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || pooja.category === filterCategory;
      
      let matchesTab = true;
      if (activeTab === "Active") matchesTab = pooja.isActive === true;
      if (activeTab === "Inactive") matchesTab = pooja.isActive === false;

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [poojas, searchTerm, filterCategory, activeTab]);

  const totalCount = filteredPoojas.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedPoojas = filteredPoojas.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const total = poojas.length;
    const active = poojas.filter(p => p.isActive).length;
    const inactive = total - active;
    const categories = new Set(poojas.map(p => p.category)).size;
    return { total, active, inactive, categories };
  }, [poojas]);

  const tabs = [
    { name: "All", count: poojas.length, icon: <Flame size={16} /> },
    { name: "Active", count: stats.active, icon: <CheckCircle size={16} /> },
    { name: "Inactive", count: stats.inactive, icon: <XCircle size={16} /> }
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
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  };

  const openModal = (pooja = null) => {
    if (pooja) {
      setEditingPooja(pooja);
      setFormData({
        name: pooja.name || '',
        category: pooja.category || 'Health',
        description: pooja.description || '',
        price: pooja.price || '',
        isActive: pooja.isActive ?? true,
        image: null // Don't pre-fill file, existing image kept in backend if no new one sent
      });
      // Show existing image as preview
      if (pooja.image) {
        setImagePreview(`http://localhost:5000/uploads/${pooja.image}`);
      } else {
        setImagePreview(null);
      }
    } else {
      setEditingPooja(null);
      setFormData(initialFormState);
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPooja(null);
    setFormData(initialFormState);
    setImagePreview(null);
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
      payload.append('isActive', formData.isActive);

      if (formData.image) {
        payload.append('image', formData.image);
      }

      if (editingPooja) {
        await poojaService.updatePooja(editingPooja._id, payload);
        toast.success("Pooja service updated successfully!");
      } else {
        await poojaService.createPooja(payload);
        toast.success("Pooja service created successfully!");
      }
      
      closeModal();
      fetchPoojas();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save pooja service");
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
      await poojaService.deletePooja(deletingId);
      toast.success("Pooja service deleted successfully");
      fetchPoojas();
    } catch (error) {
      toast.error("Failed to delete pooja service");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (pooja) => {
    try {
      const payload = new FormData();
      payload.append('isActive', !pooja.isActive);
      payload.append('name', pooja.name);
      payload.append('category', pooja.category);
      payload.append('description', pooja.description);
      payload.append('price', pooja.price);
      
      await poojaService.updatePooja(pooja._id, payload);
      toast.success(`Pooja ${!pooja.isActive ? 'Activated' : 'Deactivated'}!`);
      fetchPoojas();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Pooja Services
        </h1>
        {canCreatePoojas && (
          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-white rounded-lg shadow-sm hover:shadow transition text-sm sm:text-base font-medium whitespace-nowrap"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Plus size={18} className="mr-1.5 sm:mr-2" />
            Add Pooja Service
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
          <div className="p-2.5 sm:p-3 bg-orange-50 rounded-lg text-orange-600">
            <Flame size={22} className="sm:w-6 sm:h-6" />
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
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Categories</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.categories}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-purple-50 rounded-lg text-purple-600">
            <Filter size={22} className="sm:w-6 sm:h-6" />
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
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading services...
                  </td>
                </tr>
              ) : paginatedPoojas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Flame size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No services found</p>
                    <p className="text-sm">Try adjusting your filters or add a new service.</p>
                  </td>
                </tr>
              ) : (
                paginatedPoojas.map((pooja) => (
                  <tr key={pooja._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {pooja.image ? (
                          <img 
                            src={`http://localhost:5000/uploads/${pooja.image}`} 
                            alt={pooja.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{pooja.name}</span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-xs text-gray-500 truncate" title={pooja.description}>
                        {pooja.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                        {pooja.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">₹{pooja.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canEditPoojas ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={pooja.isActive}
                            onChange={() => handleToggleStatus(pooja)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          pooja.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {pooja.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-4">
                      <button 
                        onClick={() => { setViewingPooja(pooja); setIsViewModalOpen(true); }}
                        className="text-indigo-500 hover:text-indigo-700 transition"
                        title="View"
                      >
                        <FaEye size={18} />
                      </button>
                      {canEditPoojas && (
                        <button 
                          onClick={() => openModal(pooja)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                      )}
                      {canDeletePoojas && (
                        <button 
                          onClick={() => handleDeleteClick(pooja._id)}
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
                {editingPooja ? 'Edit Pooja Service' : 'Add New Pooja'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="poojaForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Service Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="name" required
                      value={formData.name} onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="e.g. Navratri Special Pooja"
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
                    placeholder="Enter details about this pooja..."
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
                  
                  <div className="flex items-center pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" name="isActive"
                        checked={formData.isActive} onChange={handleInputChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">Active Service</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Pooja Image</label>
                  
                  <div className="flex items-center gap-6">
                    {imagePreview && (
                      <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="flex-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="pooja-image-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input 
                              id="pooja-image-upload" name="image" type="file" 
                              accept="image/*" className="sr-only"
                              onChange={handleFileChange} 
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                  </div>
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
                type="submit" form="poojaForm"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center"
                style={{ backgroundColor: themeColors.primary }}
              >
                {isSubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>
                ) : (
                  'Save Pooja'
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Pooja Service?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this service? This action cannot be undone.</p>
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
      {isViewModalOpen && viewingPooja && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Pooja Service Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Image */}
                <div className="w-full md:w-2/5">
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    {viewingPooja.image ? (
                      <img 
                        src={`http://localhost:5000/uploads/${viewingPooja.image}`} 
                        alt={viewingPooja.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="w-full md:w-3/5 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-orange-100 text-orange-700">
                        {viewingPooja.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        viewingPooja.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingPooja.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{viewingPooja.name}</h1>
                    <p className="text-3xl font-bold" style={{ color: themeColors.primary }}>₹{viewingPooja.price}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 overflow-hidden">
                      <p className="text-gray-700 whitespace-pre-wrap break-all leading-relaxed text-sm">
                        {viewingPooja.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">Added On</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(viewingPooja.createdAt).toLocaleDateString()}
                    </p>
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

export default Pooja;
