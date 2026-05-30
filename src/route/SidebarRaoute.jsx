import { lazy } from "react";
import { FaTachometerAlt, FaUserShield, FaUsers, FaUserTie, FaBoxOpen, FaClipboardList, FaFire, FaCalendarCheck, FaBell, FaHeadset, FaShoppingCart, FaUserCircle, FaPhoneAlt, FaCog, FaMoneyBillWave, FaUniversity } from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Admin = lazy(() => import("../pages/Admin"));
const Users = lazy(() => import("../pages/Users"));
const Astrologers = lazy(() => import("../pages/Astrologers"));
const Products = lazy(() => import("../pages/Products"));
const Orders = lazy(() => import("../pages/Orders"));
const Pooja = lazy(() => import("../pages/Pooja"));
const PoojaBookings = lazy(() => import("../pages/PoojaBookings"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Complaints = lazy(() => import("../pages/Complaints"));
const CartHistory = lazy(() => import("../pages/CartHistory"));
const CallHistory = lazy(() => import("../pages/CallHistory"));
const AdminProfile = lazy(() => import("../pages/AdminProfile"));
const Settings = lazy(() => import("../pages/Settings"));

const Transactions = lazy(() => import("../pages/Transactions"));
const Withdrawals = lazy(() => import("../pages/Withdrawals"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt, permission: "view_dashboard" },
  { path: "/admin", component: Admin, name: "Admin", icon: FaUserShield, role: "superadmin" },
  { path: "/users", component: Users, name: "Users", icon: FaUsers, permission: "view_users" },
  { path: "/astrologers", component: Astrologers, name: "Astrologers", icon: FaUserTie, permission: "view_astrologers" },
  { path: "/transactions", component: Transactions, name: "Transactions", icon: FaMoneyBillWave, permission: "view_transactions" },
  { path: "/withdrawals", component: Withdrawals, name: "Withdrawals", icon: FaUniversity, permission: "view_withdrawals" },
  { path: "/products", component: Products, name: "Products", icon: FaBoxOpen, permission: "view_products" },
  { path: "/orders", component: Orders, name: "Orders", icon: FaClipboardList, permission: "view_orders" },
  { path: "/pooja", component: Pooja, name: "Pooja Services", icon: FaFire, permission: "view_pooja" },
  { path: "/pooja-bookings", component: PoojaBookings, name: "Pooja Bookings", icon: FaCalendarCheck, permission: "view_pooja_bookings" },
  { path: "/calls", component: CallHistory, name: "Call History", icon: FaPhoneAlt, permission: "view_calls" },
  { path: "/notifications", component: Notifications, name: "Notifications", icon: FaBell, permission: "view_notifications" },
  { path: "/complaints", component: Complaints, name: "Complaints", icon: FaHeadset, permission: "view_complaints" },
  { path: "/carts", component: CartHistory, name: "Pending Carts", icon: FaShoppingCart, permission: "view_carts" },
  { path: "/settings", component: Settings, name: "App Settings", icon: FaCog },
  { path: "/profile", component: AdminProfile, name: "My Profile", icon: FaUserCircle },
];

export default routes;
