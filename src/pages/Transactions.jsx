import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Wallet, Activity, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import transactionService from '../services/transactionService';

const TRANSACTION_TYPES = [
  "wallet_recharge", 
  "call_deduction", 
  "pooja_booking", 
  "product_purchase", 
  "refund", 
  "kundali_generation"
];

export default function Transactions() {
  const { themeColors } = useTheme();
  const { canDeleteTransactions } = usePermissions();
  
  const [transactions, setTransactions] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDirection, setFilterDirection] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getAllTransactions();
      if (res.success) {
        setTransactions(res.transactions);
        setTotalVolume(res.totalVolume);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This transaction will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await transactionService.deleteTransaction(id);
        if (res.success) {
          toast.success("Transaction deleted successfully");
          fetchTransactions(); // Refresh the list
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete transaction");
      }
    }
  };

  // -------------------------------------------------------------
  // Derived Data & Filtering
  // -------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const searchMatch = 
        txn._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (txn.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (txn.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        
      const typeMatch = filterType === 'All' || txn.type === filterType;
      const dirMatch = filterDirection === 'All' || txn.direction === filterDirection;
      
      return searchMatch && typeMatch && dirMatch;
    });
  }, [transactions, searchTerm, filterType, filterDirection]);

  const totalCount = filteredTransactions.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const paginatedTransactions = filteredTransactions.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => {
    const totalCount = transactions.length;
    const credits = transactions.filter(t => t.direction === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const debits = transactions.filter(t => t.direction === 'debit').reduce((sum, t) => sum + t.amount, 0);
    return { totalCount, credits, debits };
  }, [transactions]);

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const formatType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColors.primary }}>
          Transactions Overview
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Volume</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">₹{totalVolume}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600">
              <Activity size={22} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Txns</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalCount}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Credits</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600">₹{stats.credits}</h3>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <ArrowDownRight size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Debits</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-red-600">₹{stats.debits}</h3>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <ArrowUpRight size={22} />
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
            placeholder="Search by Txn ID or User..."
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
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
              style={{ borderColor: themeColors.border }}
            >
              <option value="All">All Types</option>
              {TRANSACTION_TYPES.map(type => (
                <option key={type} value={type}>{formatType(type)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filterDirection}
              onChange={(e) => { setFilterDirection(e.target.value); setPage(1); }}
              className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none"
              style={{ borderColor: themeColors.border }}
            >
              <option value="All">All Directions</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
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
                <th className="px-6 py-4">Txn ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Direction</th>
                {canDeleteTransactions && <th className="px-6 py-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading transactions...
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn) => (
                  <tr key={txn._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-mono text-gray-900" title={txn._id}>
                        {txn._id.slice(-8)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {new Date(txn.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {txn.user ? (
                        <p className="font-semibold text-gray-800">
                          {typeof txn.user === 'object' ? (txn.user.name || 'Unknown') : `User: ${String(txn.user).slice(-8)}`}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">
                        {formatType(txn.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${txn.direction === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.direction === 'credit' ? '+' : '-'}₹{txn.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        txn.direction === 'credit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {txn.direction.toUpperCase()}
                      </span>
                    </td>
                    {canDeleteTransactions && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(txn._id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
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
    </div>
  );
};
