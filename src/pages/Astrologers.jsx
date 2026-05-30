import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Edit, Trash2, ShieldAlert, ShieldCheck, Plus, UserCheck, UserX, Users, Eye, Image as ImageIcon, Percent, ChevronLeft, ChevronRight, Activity, MinusCircle, Clock, Search } from 'lucide-react';
import astrologerService from '../services/astrologerService';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';

export default function Astrologers() {
  const { themeColors } = useTheme();
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { canEditAstrologers, canCreateAstrologers, canVerifyAstrologers, canDeleteAstrologers, canManageCommission } = usePermissions();

  // UI States
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [editingAstrologer, setEditingAstrologer] = useState(null);
  const [viewingAstrologer, setViewingAstrologer] = useState(null);
  const [globalCommission, setGlobalCommission] = useState(0);

  // Form State
  const initialFormState = {
    name: '',
    phoneNumber: '',
    email: '',
    expertise: [],
    languages: [],
    experience: 0,
    about: '',
    chatRate: 0,
    audioCallRate: 0,
    videoCallRate: 0,
    kundaliRate: 0,
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    holderName: '',
    profilePic: null,
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await astrologerService.getAllAstrologers();
      if (data.success || data.data || Array.isArray(data)) {
        const list = data.astrologers || data.data || data;
        setAstrologers(list);
        if (list.length > 0) {
          setGlobalCommission(list[0].commissionPercentage || 0);
        }
      } else {
        setAstrologers(data);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to fetch astrologers");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePic') {
      setFormData({ ...formData, profilePic: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openModal = (astrologer = null) => {
    if (astrologer) {
      setEditingAstrologer(astrologer);
      setFormData({
        name: astrologer.name || '',
        phoneNumber: astrologer.phoneNumber || '',
        email: astrologer.email || '',
        expertise: astrologer.expertise || [],
        languages: astrologer.languages || [],
        experience: astrologer.experience || 0,
        about: astrologer.about || '',
        chatRate: astrologer.pricing?.chatRate || 0,
        audioCallRate: astrologer.pricing?.audioCallRate || 0,
        videoCallRate: astrologer.pricing?.videoCallRate || 0,
        kundaliRate: astrologer.pricing?.kundaliRate || 0,
        accountNumber: astrologer.bankDetails?.accountNumber || '',
        ifscCode: astrologer.bankDetails?.ifscCode || '',
        bankName: astrologer.bankDetails?.bankName || '',
        holderName: astrologer.bankDetails?.holderName || '',
        profilePic: null, // Keep null, only update if new file selected
      });
    } else {
      setEditingAstrologer(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAstrologer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('email', formData.email);
      payload.append('experience', formData.experience);
      payload.append('about', formData.about);

      // Append Array as JSON
      payload.append('expertise', JSON.stringify(formData.expertise));
      payload.append('languages', JSON.stringify(formData.languages));

      // Pricing Object
      const pricingObj = {
        chatRate: Number(formData.chatRate),
        audioCallRate: Number(formData.audioCallRate),
        videoCallRate: Number(formData.videoCallRate),
        kundaliRate: Number(formData.kundaliRate)
      };
      payload.append('pricing', JSON.stringify(pricingObj));

      // Bank Details Object
      const bankObj = {
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        holderName: formData.holderName
      };
      payload.append('bankDetails', JSON.stringify(bankObj));

      if (formData.profilePic) {
        payload.append('profilePic', formData.profilePic);
      }

      if (editingAstrologer) {
        await astrologerService.updateAstrologer(editingAstrologer._id, payload);
        toast.success("Astrologer updated successfully!");
      } else {
        await astrologerService.createAstrologer(payload);
        toast.success("Astrologer created successfully!");
      }
      closeModal();
      fetchAstrologers(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save astrologer");
    }
  };

  const handleToggleVerification = async (id, currentStatus) => {
    try {
      await astrologerService.toggleVerification(id, !currentStatus);
      toast.success(`Astrologer ${currentStatus ? 'Unverified' : 'Verified'} successfully!`);
      fetchAstrologers(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update verification status");
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
          await astrologerService.deleteAstrologer(id);
          toast.success("Astrologer deleted successfully!");
          fetchAstrologers(false);
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete astrologer");
        }
      }
    });
  };

  const handleGlobalCommission = async (e) => {
    e.preventDefault();
    try {
      await astrologerService.setGlobalCommission(globalCommission);
      toast.success("Global commission updated successfully!");
      setIsCommissionModalOpen(false);
      fetchAstrologers(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update commission");
    }
  };

  // Processing list
  const astrologersList = Array.isArray(astrologers) ? astrologers : (astrologers?.data || astrologers?.astrologers || []);
  const totalAstrologers = astrologersList.length;
  const verifiedCount = astrologersList.filter(a => a.isVerified).length;
  const unverifiedCount = totalAstrologers - verifiedCount;

  const onlineCount = astrologersList.filter(a => a.availability === 'online').length;
  const offlineCount = astrologersList.filter(a => a.availability === 'offline').length;
  const busyCount = astrologersList.filter(a => a.availability === 'busy').length;

  const filteredAstrologers = astrologersList.filter(astrologer => {
    if (activeTab === "Verified") return astrologer.isVerified === true;
    if (activeTab === "Unverified") return astrologer.isVerified === false;
    if (activeTab === "Online") return astrologer.availability === 'online';
    if (activeTab === "Offline") return astrologer.availability === 'offline';
    if (activeTab === "Busy") return astrologer.availability === 'busy';
    return true; 
  }).filter(astrologer => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (astrologer.name && astrologer.name.toLowerCase().includes(term)) ||
      (astrologer.email && astrologer.email.toLowerCase().includes(term)) ||
      (astrologer.phoneNumber && String(astrologer.phoneNumber).includes(term))
    );
  });

  const totalCount = filteredAstrologers.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedAstrologers = filteredAstrologers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const tabs = [
    { name: "All", count: totalAstrologers, icon: <Users size={16} /> },
    { name: "Verified", count: verifiedCount, icon: <UserCheck size={16} /> },
    { name: "Unverified", count: unverifiedCount, icon: <UserX size={16} /> },
    { name: "Online", count: onlineCount, icon: <Activity size={16} /> },
    { name: "Offline", count: offlineCount, icon: <MinusCircle size={16} /> },
    { name: "Busy", count: busyCount, icon: <Clock size={16} /> }
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Astrologers Management
        </h1>
        <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {canManageCommission && (
            <button 
              onClick={() => setIsCommissionModalOpen(true)}
              className="flex-1 sm:flex-none flex justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-sm hover:shadow transition text-sm sm:text-base font-medium border bg-white text-gray-700 whitespace-nowrap"
              style={{ borderColor: themeColors.border }}
            >
              <Percent size={16} className="mr-1.5 sm:mr-2 text-blue-500" />
              Set Commission
            </button>
          )}
          {canCreateAstrologers && (
            <button 
              onClick={() => openModal()}
              className="flex-1 sm:flex-none flex justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-white rounded-lg shadow-sm hover:shadow transition text-sm sm:text-base font-medium whitespace-nowrap"
              style={{ backgroundColor: themeColors.primary }}
            >
              <Plus size={18} className="mr-1.5 sm:mr-2" />
              Add Astrologer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{totalAstrologers}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Verified</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{verifiedCount}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg text-green-600">
            <UserCheck size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Unverified</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{unverifiedCount}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-orange-50 rounded-lg text-orange-600">
            <UserX size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Online</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{onlineCount}</h3>
          </div>
          <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Activity size={22} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow-sm border bg-white overflow-hidden flex flex-col" style={{ borderColor: themeColors.border }}>
        {/* Tabs Header */}
        {/* Tabs Header */}
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

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase font-semibold tracking-wider border-b text-gray-500 bg-gray-50 whitespace-nowrap" style={{ borderColor: themeColors.border }}>
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Chat Rate</th>
                <th className="px-6 py-4">Audio Rate</th>
                <th className="px-6 py-4">Video Rate</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-800" style={{ borderColor: themeColors.border }}>
              {loading ? (
                <tr><td colSpan="12" className="text-center py-12 text-gray-500">Loading astrologers...</td></tr>
              ) : paginatedAstrologers.length === 0 ? (
                <tr><td colSpan="12" className="text-center py-12 text-gray-500">No astrologers found.</td></tr>
              ) : (
                paginatedAstrologers.map((astrologer) => (
                  <tr key={astrologer._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center border">
                        {astrologer.profilePic ? (
                          <img src={`http://localhost:5000/uploads/${astrologer.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={18} className="text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{astrologer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{astrologer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{astrologer.experience} Years</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{astrologer.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">₹{astrologer.pricing?.chatRate || 0}/min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">₹{astrologer.pricing?.audioCallRate || 0}/min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">₹{astrologer.pricing?.videoCallRate || 0}/min</td>
                    <td className="px-6 py-4 capitalize font-bold text-gray-900">
                      <span className={`flex items-center gap-1.5 ${astrologer.availability === 'online' ? 'text-green-600' : astrologer.availability === 'busy' ? 'text-orange-500' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${astrologer.availability === 'online' ? 'bg-green-500' : astrologer.availability === 'busy' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                        {astrologer.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${astrologer.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {astrologer.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-900 whitespace-nowrap">
                      {new Date(astrologer.updatedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-4">
                      <button onClick={() => setViewingAstrologer(astrologer)} className="text-indigo-500 hover:text-indigo-700 transition" title="View">
                        <Eye size={18} />
                      </button>
                      {canEditAstrologers && (
                        <button onClick={() => openModal(astrologer)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                          <Edit size={18} />
                        </button>
                      )}
                      {canVerifyAstrologers && (
                        <button onClick={() => handleToggleVerification(astrologer._id, astrologer.isVerified)} className={`${astrologer.isVerified ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'} transition`} title={astrologer.isVerified ? "Unverify" : "Verify"}>
                          {astrologer.isVerified ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                        </button>
                      )}
                      {canDeleteAstrologers && (
                        <button onClick={() => handleDelete(astrologer._id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
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
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t gap-4 text-gray-500" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center text-sm">
            <span className="mr-3">Rows per page:</span>
            <select 
              className="border rounded-md px-2 py-1 mr-4 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition bg-white" 
              style={{ borderColor: themeColors.border }}
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span>Showing {totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, totalCount)} of {totalCount}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className={`flex items-center px-3 py-1.5 border rounded-lg transition-colors ${page === 1 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'}`}
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </button>
            <span className="px-4 font-medium">Page {totalPages === 0 ? 0 : page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0}
              className={`flex items-center px-3 py-1.5 border rounded-lg transition-colors ${page === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'}`}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto bg-white">
            <h2 className="text-2xl font-bold mb-6" style={{ color: themeColors.primary }}>
              {editingAstrologer ? 'Edit Astrologer' : 'Add Astrologer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Phone Number</label>
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Expertise</label>
                    <div className="p-2.5 border rounded-lg h-32 overflow-y-auto bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition">
                      {["Vedic Astrology", "Tarot Reading", "Numerology", "Vastu Shastra", "Nadi Astrology", "Face Reading", "Palmistry", "KP Astrology", "Prashna Kundali", "Lal Kitab", "Feng Shui", "Match Making", "Psychic Reading", "Crystal Healing", "Gemology"].map((item) => (
                        <label key={item} className="flex items-center space-x-2 mb-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.expertise.includes(item)}
                            onChange={(e) => {
                              const newExpertise = e.target.checked 
                                ? [...formData.expertise, item] 
                                : formData.expertise.filter(exp => exp !== item);
                              setFormData({ ...formData, expertise: newExpertise });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Languages</label>
                    <div className="p-2.5 border rounded-lg h-32 overflow-y-auto bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition">
                      {["Hindi", "English", "Sanskrit", "Punjabi", "Marathi", "Gujarati", "Tamil", "Telugu", "Bengali", "Kannada", "Malayalam"].map((item) => (
                        <label key={item} className="flex items-center space-x-2 mb-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.languages.includes(item)}
                            onChange={(e) => {
                              const newLanguages = e.target.checked 
                                ? [...formData.languages, item] 
                                : formData.languages.filter(lang => lang !== item);
                              setFormData({ ...formData, languages: newLanguages });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Experience (Years)</label>
                    <input type="number" name="experience" value={formData.experience} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">About</label>
                  <textarea name="about" value={formData.about} onChange={handleInputChange} rows="3" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"></textarea>
                </div>
                <div className="mt-4">
                   <label className="block text-sm font-semibold mb-1.5 text-gray-700">Profile Picture</label>
                   <input type="file" name="profilePic" accept="image/*" onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
                   {editingAstrologer?.profilePic && !formData.profilePic && (
                     <p className="text-xs text-blue-500 mt-1">Current picture is retained. Upload a new one to change.</p>
                   )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">Pricing Rates (₹)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Chat Rate / min</label>
                    <input type="number" name="chatRate" value={formData.chatRate} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Audio Call / min</label>
                    <input type="number" name="audioCallRate" value={formData.audioCallRate} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Video Call / min</label>
                    <input type="number" name="videoCallRate" value={formData.videoCallRate} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Kundali Rate (Flat)</label>
                    <input type="number" name="kundaliRate" value={formData.kundaliRate} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Account No.</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">IFSC Code</label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">Holder Name</label>
                    <input type="text" name="holderName" value={formData.holderName} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-white shadow-sm hover:shadow font-medium transition bg-blue-600 hover:bg-blue-700">
                  {editingAstrologer ? 'Update Astrologer' : 'Save Astrologer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Commission Modal */}
      {isCommissionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl bg-white">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Set Global Commission</h2>
            <p className="text-sm text-gray-500 mb-6">This percentage will apply as the platform's cut from all astrologers.</p>
            <form onSubmit={handleGlobalCommission}>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Commission (%)</label>
                <input 
                  type="number" min="0" max="100" required 
                  value={globalCommission} 
                  onChange={(e) => setGlobalCommission(Number(e.target.value))} 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-lg font-semibold text-center" 
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCommissionModalOpen(false)} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white shadow-sm transition bg-blue-600 hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingAstrologer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto bg-white flex flex-col">
            
            {/* Header Banner */}
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl flex-shrink-0">
              <div className="absolute -bottom-12 left-6">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {viewingAstrologer.profilePic ? (
                      <img src={`http://localhost:5000/uploads/${viewingAstrologer.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${viewingAstrologer.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {viewingAstrologer.isVerified ? '✓ VERIFIED' : 'PENDING'}
                </span>
              </div>
            </div>

            <div className="pt-16 px-8 pb-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{viewingAstrologer.name}</h2>
                <p className="text-sm text-gray-500 font-medium">{viewingAstrologer.email} • {viewingAstrologer.phoneNumber}</p>
              </div>

              <div className="space-y-8">
                
                {/* Professional Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Professional Info</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Experience</p>
                      <p className="font-medium text-gray-900">{viewingAstrologer.experience} Years</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Languages</p>
                      <p className="font-medium text-gray-900">{viewingAstrologer.languages?.join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Expertise</p>
                      <p className="font-medium text-gray-900">{viewingAstrologer.expertise?.join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Member Since</p>
                      <p className="font-medium text-gray-900">{new Date(viewingAstrologer.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Last Updated</p>
                      <p className="font-medium text-gray-900">{new Date(viewingAstrologer.updatedAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  {viewingAstrologer.about && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">About</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{viewingAstrologer.about}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pricing */}
                  <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2">Pricing Rates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-blue-600/70 uppercase mb-1">Chat Rate</p>
                        <p className="font-bold text-blue-900">₹{viewingAstrologer.pricing?.chatRate || 0}<span className="text-xs font-normal text-blue-600/70">/min</span></p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600/70 uppercase mb-1">Audio Call</p>
                        <p className="font-bold text-blue-900">₹{viewingAstrologer.pricing?.audioCallRate || 0}<span className="text-xs font-normal text-blue-600/70">/min</span></p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600/70 uppercase mb-1">Video Call</p>
                        <p className="font-bold text-blue-900">₹{viewingAstrologer.pricing?.videoCallRate || 0}<span className="text-xs font-normal text-blue-600/70">/min</span></p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600/70 uppercase mb-1">Kundali (Flat)</p>
                        <p className="font-bold text-blue-900">₹{viewingAstrologer.pricing?.kundaliRate || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details & Wallet */}
                  <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
                    <div className="flex justify-between items-end mb-4 border-b border-emerald-200 pb-2">
                      <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Financials</h3>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-emerald-600/70 uppercase">Commission</p>
                          <p className="text-xl font-black text-emerald-700">{viewingAstrologer.commissionPercentage}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-emerald-600/70 uppercase">Wallet Balance</p>
                          <p className="text-xl font-black text-emerald-600">₹{viewingAstrologer.walletBalance || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-0.5">Bank Name</p>
                        <p className="font-medium text-emerald-900">{viewingAstrologer.bankDetails?.bankName || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-0.5">Account Number</p>
                        <p className="font-medium text-emerald-900 tracking-wider">{viewingAstrologer.bankDetails?.accountNumber || 'Not provided'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-0.5">IFSC Code</p>
                          <p className="font-medium text-emerald-900">{viewingAstrologer.bankDetails?.ifscCode || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-600/70 uppercase mb-0.5">Holder Name</p>
                          <p className="font-medium text-emerald-900">{viewingAstrologer.bankDetails?.holderName || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="mt-10 pt-5 border-t">
                <button onClick={() => setViewingAstrologer(null)} className="w-full px-5 py-3 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold transition shadow-sm">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
