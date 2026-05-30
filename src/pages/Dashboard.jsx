import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  Users, UserCheck, ShoppingBag, Package, DollarSign,
  Phone, Star, Wallet, AlertCircle, TrendingUp, CreditCard,
  Clock, Award, Headphones, ShoppingCart, BookOpen, Activity, Bell
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin-token');
        const response = await fetch('http://localhost:5000/api/dashboard/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('API connection error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-900 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 rounded-xl text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { users, admins, astrologers, ecommerce, services, financials, support, recentActivity } = data;

  // Chart Data
  const userChartData = [
    { name: 'Total Users', value: users.total, color: '#8b5cf6' },
    { name: 'Active', value: users.active, color: '#10b981' },
    { name: 'Pending Carts', value: users.pendingCarts, color: '#f59e0b' }
  ];

  const astrologerChartData = [
    { name: 'Total', value: astrologers.total, color: '#8b5cf6' },
    { name: 'Pending Verification', value: astrologers.pendingVerification, color: '#f59e0b' },
    { name: 'Online Now', value: astrologers.onlineNow, color: '#10b981' }
  ];

  const orderChartData = [
    { name: 'Pending', value: ecommerce.pendingOrders, color: '#f59e0b' },
    { name: 'Delivered', value: ecommerce.deliveredOrders, color: '#10b981' },
    { name: 'Others', value: ecommerce.totalOrders - ecommerce.pendingOrders - ecommerce.deliveredOrders, color: '#6b7280' }
  ];

  const revenueChartData = [
    { name: 'Sales', amount: ecommerce.totalSalesRevenue, color: '#3b82f6' },
    { name: 'Pooja Booking', amount: services.poojaBookingRevenue, color: '#8b5cf6' },
    { name: 'Platform Calls', amount: services.platformCallEarnings, color: '#10b981' }
  ];

  const callEarningsData = [
    { name: 'Platform', value: services.platformCallEarnings, color: '#8b5cf6' },
    { name: 'Astrologers', value: services.totalAstrologerCallEarnings, color: '#f59e0b' }
  ];

  const financialData = [
    { name: 'Wallet Recharge', value: financials.totalWalletRecharge, color: '#10b981' },
    { name: 'Approved Withdrawals', value: financials.approvedWithdrawalsAmount, color: '#ef4444' }
  ];

  const serviceData = [
    { name: 'Poojas', count: services.totalPoojas, color: '#8b5cf6' },
    { name: 'Bookings', count: services.totalPoojaBookings, color: '#3b82f6' },
    { name: 'Calls', count: services.totalCalls, color: '#10b981' },
    { name: 'Reviews', count: services.totalReviews, color: '#f59e0b' }
  ];

  const percentageData = [
    { name: 'Astrologers Online', value: (astrologers.onlineNow / astrologers.total) * 100, fill: '#10b981' },
    { name: 'Order Delivery Rate', value: (ecommerce.deliveredOrders / ecommerce.totalOrders) * 100, fill: '#3b82f6' },
    { name: 'Wallet to Withdrawal', value: (financials.approvedWithdrawalsAmount / financials.totalWalletRecharge) * 100, fill: '#8b5cf6' }
  ];

  const StatCard = ({ title, value, icon: Icon, bgColor, subtitle }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-500 shadow-sm transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-gray-900 text-3xl font-bold">{value}</p>
          <p className="text-gray-400 text-xs mt-1">{subtitle || '\u00A0'}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ChartBox = ({ title, children }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-gray-900 text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}


      <main className="p-6">
        {/* Stats Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Admin Wallet Balance"
            value={`₹${admins.walletBalance}`}
            icon={Wallet}
            bgColor="bg-purple-600"
          />
          <StatCard
            title="Real Account money"
            value={`₹${admins.totalRechargeMoney}`}
            icon={DollarSign}
            bgColor="bg-pink-600"
          />
          <StatCard
            title="Wallet Recharges"
            value={`₹${financials.totalWalletRecharge}`}
            icon={CreditCard}
            bgColor="bg-cyan-600"
          />
          <StatCard
            title="Approved Withdrawals"
            value={`₹${financials.approvedWithdrawalsAmount}`}
            icon={DollarSign}
            bgColor="bg-green-600"
          />
          <StatCard
            title="Call Earnings"
            value={`₹${services.platformCallEarnings}`}
            icon={DollarSign}
            bgColor="bg-orange-600"
            subtitle={`${services.totalCalls} total calls`}
          />
          <StatCard
            title="Pooja Earnings"
            value={`₹${services.poojaBookingRevenue}`}
            icon={DollarSign}
            bgColor="bg-emerald-600"
          />
          <StatCard
            title=" Product Sales Earnings"
            value={`₹${ecommerce.totalSalesRevenue}`}
            icon={DollarSign}
            bgColor="bg-blue-600"
          />
          <StatCard
            title="AI Chat Earnings"
            value={`₹${services.aiChatRevenue || 0}`}
            icon={DollarSign}
            bgColor="bg-fuchsia-600"
          />
          <StatCard
            title="Kundali Revenue"
            value={`₹${services.kundaliRevenue || 0}`}
            icon={DollarSign}
            bgColor="bg-rose-600"
          />
          <StatCard
            title="Horoscope Earnings"
            value={`₹${services.horoscopeRevenue || 0}`}
            icon={DollarSign}
            bgColor="bg-orange-500"
          />
          <StatCard
            title="Total Users"
            value={users.total}
            icon={Users}
            bgColor="bg-purple-600"
            subtitle={`${users.active} active users`}
          />
          <StatCard
            title="Astrologers"
            value={astrologers.total}
            icon={Headphones}
            bgColor="bg-blue-600"
            subtitle={`${astrologers.onlineNow} online now`}
          />

          <StatCard
            title="Total Poojas"
            value={services.totalPoojas}
            icon={BookOpen}
            bgColor="bg-indigo-600"
          />
          <StatCard
            title="Pooja Bookings"
            value={services.totalPoojaBookings}
            icon={BookOpen}
            bgColor="bg-pink-600"
            subtitle={`${services.totalPoojas} poojas available`}
          />
          <StatCard
            title="Total Products"
            value={ecommerce.totalProducts}
            icon={Package}
            bgColor="bg-teal-600"
            subtitle={`₹${ecommerce.totalSalesRevenue} sales`}
          />
          <StatCard
            title="Total Orders"
            value={ecommerce.totalOrders}
            icon={ShoppingBag}
            bgColor="bg-green-600"
            subtitle={`${ecommerce.pendingOrders} pending • ${ecommerce.deliveredOrders} delivered • ₹${ecommerce.totalSalesRevenue} revenue`}
          />

          <StatCard
            title="Withdrawal Requests"
            value={financials.totalWithdrawalRequests}
            icon={Wallet}
            bgColor="bg-emerald-600"
            subtitle={`₹${financials.pendingWithdrawalsAmount} pending`}
          />
          <StatCard
            title="Support"
            value={support.totalComplaints}
            icon={AlertCircle}
            bgColor="bg-red-600"
            subtitle={`${support.pendingComplaints} pending`}
          />
          <StatCard
            title="Active Notifications"
            value={support.totalNotifications || 0}
            icon={Bell}
            bgColor="bg-yellow-500"
            subtitle="Currently active"
          />

          <StatCard
            title="Total Calls"
            value={services.totalCalls}
            icon={Phone}
            bgColor="bg-indigo-600"
            subtitle={`${services.ongoingCalls} ongoing`}
          />

          <StatCard
            title="Transactions"
            value={financials.totalTransactions}
            icon={CreditCard}
            bgColor="bg-cyan-600"
            subtitle={`₹${financials.totalWalletRecharge} recharged`}
          />



        </div>

        {/* Charts Section */}
        <h2 className="text-gray-900 text-xl font-bold mt-8 mb-4">Analytics & Reports</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* User Statistics */}
          <ChartBox title="User Statistics">
            <BarChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {userChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>

          {/* Astrologer Distribution */}
          <ChartBox title="Astrologer Distribution">
            <PieChart>
              <Pie data={astrologerChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {astrologerChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Legend />
            </PieChart>
          </ChartBox>

          {/* Order Status */}
          <ChartBox title="Order Status">
            <PieChart>
              <Pie data={orderChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                {orderChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Legend />
            </PieChart>
          </ChartBox>

          {/* Revenue Breakdown */}
          <ChartBox title="Revenue Breakdown (₹)">
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {revenueChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>

          {/* Call Earnings Comparison */}
          <ChartBox title="Call Earnings Distribution">
            <PieChart>
              <Pie data={callEarningsData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" label>
                {callEarningsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Legend />
            </PieChart>
          </ChartBox>

          {/* Financial Flow */}
          <ChartBox title="Financial Flow (₹)">
            <BarChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {financialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>

          {/* Service Distribution */}
          <ChartBox title="Service Distribution">
            <BarChart data={serviceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>

          {/* Performance Metrics */}
          <ChartBox title="Performance Metrics (%)">
            <RadialBarChart innerRadius="20%" outerRadius="100%" data={percentageData} startAngle={180} endAngle={0}>
              <RadialBar minAngle={15} background clockWise={true} dataKey="value" />
              <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none' }} />
            </RadialBarChart>
          </ChartBox>
        </div>





        {/* Recent Transactions */}
        {recentActivity && recentActivity.transactions && recentActivity.transactions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mt-6 overflow-hidden">
            <h3 className="text-gray-900 text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Direction</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentActivity.transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-900">{tx.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{tx.user?.phoneNumber}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full uppercase tracking-wider font-medium">
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold ${tx.direction === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.direction === 'credit' ? '+' : '-'}₹{tx.amount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-md font-medium capitalize ${tx.direction === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {tx.direction}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-white" />
              <div>
                <p className="text-purple-200 text-sm">Total Reviews</p>
                <p className="text-white text-2xl font-bold">{services.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-white" />
              <div>
                <p className="text-blue-200 text-sm">Astrologer Earnings</p>
                <p className="text-white text-2xl font-bold">₹{services.totalAstrologerCallEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-white" />
              <div>
                <p className="text-green-200 text-sm">Pending Verification</p>
                <p className="text-white text-2xl font-bold">{astrologers.pendingVerification}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-white" />
              <div>
                <p className="text-orange-200 text-sm">Pending Carts</p>
                <p className="text-white text-2xl font-bold">{users.pendingCarts}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;