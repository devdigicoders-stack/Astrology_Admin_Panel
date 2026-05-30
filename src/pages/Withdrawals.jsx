import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import withdrawalService from '../services/withdrawalService';

const Withdrawals = () => {
  const { themeColors } = useTheme();
  const { canManageWithdrawals } = usePermissions();
  
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUserType, setFilterUserType] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await withdrawalService.getAllWithdrawals();
      if (res.success) {
        setWithdrawals(res.withdrawals);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, status) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark this request as ${status}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: status === 'approved' ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${status} it!`
    });

    if (!result.isConfirmed) return;

    const { value: remarks } = await Swal.fire({
      title: 'Add Remarks (Optional)',
      input: 'text',
      inputPlaceholder: 'Type your remarks here...',
      showCancelButton: true,
      confirmButtonColor: themeColors.primary,
    });
    
    try {
      setProcessingId(id);
      const res = await withdrawalService.updateWithdrawalStatus(id, status, remarks || "");
      
      if (res.success) {
        toast.success(`Request ${status} successfully`);
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setProcessingId(null);
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredData = useMemo(() => {
    return withdrawals.filter(req => {
      const u = req.userType === 'user' ? req.user : req.astrologer;
      const userName = (u?.name || '').toLowerCase();
      
      const searchMatch = 
        req._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userName.includes(searchTerm.toLowerCase());
        
      const statusMatch = filterStatus === 'All' || req.status === filterStatus.toLowerCase();
      const typeMatch = filterUserType === 'All' || req.userType === filterUserType.toLowerCase();
      
      return searchMatch && statusMatch && typeMatch;
    });
  }, [withdrawals, searchTerm, filterStatus, filterUserType]);

  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const pending = withdrawals.filter(t => t.status === 'pending').length;
    const approvedAmount = withdrawals.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
    return { pending, approvedAmount, total: withdrawals.length };
  }, [withdrawals]);

  // -------------------------------------------------------------
  // Renderers
  // -------------------------------------------------------------
  const renderStatus = (status) => {
    if (status === 'approved') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Approved</span>;
    if (status === 'rejected') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold flex items-center gap-1 w-fit"><XCircle size={12}/> Rejected</span>;
    return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold flex items-center gap-1 w-fit"><Clock size={12}/> Pending</span>;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Withdrawal Requests
        </h1>
        <button 
          onClick={fetchWithdrawals}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Requests</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Banknote size={22} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Pending Actions</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pending}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Payouts</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600">₹{stats.approvedAmount}</h3>
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
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: themeColors.border, focusRing: themeColors.primary }}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
              style={{ borderColor: themeColors.border }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filterUserType}
              onChange={(e) => { setFilterUserType(e.target.value); setPage(1); }}
              className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
              style={{ borderColor: themeColors.border }}
            >
              <option value="All">All Types</option>
              <option value="User">User</option>
              <option value="Astrologer">Astrologer</option>
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
                <th className="px-6 py-4">Date / ID</th>
                <th className="px-6 py-4">Requester</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Bank / UPI Details</th>
                <th className="px-6 py-4">Status</th>
                {canManageWithdrawals && <th className="px-6 py-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading requests...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Banknote size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No requests found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((req) => {
                  const requester = req.userType === 'user' ? req.user : req.astrologer;
                  return (
                    <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 font-medium">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        <p className="font-mono text-xs text-gray-400 mt-1" title={req._id}>
                          #{req._id.slice(-6)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.userType === 'user' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {req.userType}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 mt-1">{requester?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{requester?.phoneNumber || requester?.email || ''}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 text-base">₹{req.amount}</span>
                        {req.status === 'pending' && requester && (
                           <p className="text-xs text-gray-500 mt-1">Bal: ₹{requester.walletBalance}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {req.bankDetails?.upiId ? (
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">UPI</span>
                            <p className="text-sm font-medium">{req.bankDetails.upiId}</p>
                          </div>
                        ) : req.bankDetails?.accountNumber ? (
                          <div className="text-xs">
                            <p><span className="text-gray-500">Bank:</span> {req.bankDetails.bankName}</p>
                            <p><span className="text-gray-500">A/C:</span> <span className="font-medium">{req.bankDetails.accountNumber}</span></p>
                            <p><span className="text-gray-500">IFSC:</span> {req.bankDetails.ifscCode}</p>
                            <p><span className="text-gray-500">Name:</span> {req.bankDetails.holderName}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No details</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatus(req.status)}
                        {req.remarks && (
                          <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate" title={req.remarks}>
                            Note: {req.remarks}
                          </p>
                        )}
                      </td>
                      {canManageWithdrawals && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                              onClick={() => handleProcess(req._id, 'approved')}
                              disabled={processingId === req._id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcess(req._id, 'rejected')}
                              disabled={processingId === req._id}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      )}
                    </tr>
                  );
                })
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
    </div>
  );
};

export default Withdrawals;
