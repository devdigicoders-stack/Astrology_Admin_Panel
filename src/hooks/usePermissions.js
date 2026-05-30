import { useAuth } from "../context/AuthContext";

export const usePermissions = () => {
    const { admin } = useAuth();

    const isSuperAdmin = admin?.role === "superadmin";
    const userPermissions = admin?.permissions || [];

    // General permission checker
    const hasPermission = (permission) => {
        if (isSuperAdmin) return true;
        return userPermissions.includes(permission);
    };

    return {
        hasPermission,
        isSuperAdmin,
        
        // Modules
        canViewAstrologers: hasPermission("view_astrologers"),
        canEditAstrologers: hasPermission("edit_astrologers"),
        canCreateAstrologers: hasPermission("create_astrologers"),
        canVerifyAstrologers: hasPermission("verify_astrologers"),
        canDeleteAstrologers: hasPermission("delete_astrologers"),
        canManageCommission: hasPermission("manage_commission"),

        canViewUsers: hasPermission("view_users"),
        canEditUsers: hasPermission("edit_users"),
        canDeleteUsers: hasPermission("delete_users"),
        canManageUserStatus: hasPermission("manage_user_status"),

        canViewProducts: hasPermission("view_products"),
        canEditProducts: hasPermission("edit_products"),
        canCreateProducts: hasPermission("create_products"),
        canDeleteProducts: hasPermission("delete_products"),

        canViewPoojas: hasPermission("view_pooja"),
        canEditPoojas: hasPermission("edit_pooja"),
        canCreatePoojas: hasPermission("create_pooja"),
        canDeletePoojas: hasPermission("delete_pooja"),

        canViewOrders: hasPermission("view_orders"),
        canUpdateOrderStatus: hasPermission("update_order_status"),

        canViewCalls: hasPermission("view_calls"),

        canViewComplaints: hasPermission("view_complaints"),
        canEditComplaints: hasPermission("edit_complaints"),
        canDeleteComplaints: hasPermission("delete_complaints"),

        canViewNotifications: hasPermission("view_notifications"),
        canCreateNotifications: hasPermission("create_notifications"),
        canEditNotifications: hasPermission("edit_notifications"),
        canDeleteNotifications: hasPermission("delete_notifications"),

        canViewPoojaBookings: hasPermission("view_pooja_bookings"),
        canEditPoojaBookings: hasPermission("edit_pooja_bookings"),
        canDeletePoojaBookings: hasPermission("delete_pooja_bookings"),

        canViewCarts: hasPermission("view_carts"),
        canEditCarts: hasPermission("edit_carts"),
        canDeleteCarts: hasPermission("delete_carts"),

        canViewTransactions: hasPermission("view_transactions"),
        canDeleteTransactions: hasPermission("delete_transactions"),
        canRechargeWallet: hasPermission("recharge_wallet"),

        canViewWithdrawals: hasPermission("view_withdrawals"),
        canManageWithdrawals: hasPermission("manage_withdrawals"),

        canViewDashboard: hasPermission("view_dashboard"),

        canManageAdmins: isSuperAdmin, // Special case
    };
};
