import { Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/auth-layout';
import { PublicLayout } from '@/layouts/public-layout';
import { UserLayout } from '@/layouts/user-layout';
import { AdminLayout } from '@/layouts/admin-layout';
import { RequireAdmin, RequireAuth } from '@/routes/guard';

import MarketplacePage from '@/pages/marketplace-page';
import ProductDetailsPage from '@/pages/product-details-page';
import CartPage from '@/pages/cart-page';
import CheckoutPage from '@/pages/checkout-page';
import NotFoundPage from '@/pages/not-found-page';

import LoginPage from '@/pages/auth/login-page';
import RegisterPage from '@/pages/auth/register-page';
import ForgotPasswordPage from '@/pages/auth/forgot-password-page';
import ResetPasswordPage from '@/pages/auth/reset-password-page';

import DashboardPage from '@/pages/user/dashboard-page';
import SellMaterialPage from '@/pages/user/sell-material-page';
import MyRequestsPage from '@/pages/user/my-requests-page';
import MyOrdersPage from '@/pages/user/my-orders-page';
import OrderDetailsPage from '@/pages/user/order-details-page';
import ProfilePage from '@/pages/user/profile-page';
import NotificationsPage from '@/pages/user/notifications-page';

import AdminDashboardPage from '@/pages/admin/admin-dashboard-page';
import AdminRequestsPage from '@/pages/admin/admin-requests-page';
import AdminRequestDetailsPage from '@/pages/admin/admin-request-details-page';
import AdminInspectionsPage from '@/pages/admin/admin-inspections-page';
import AdminOffersPage from '@/pages/admin/admin-offers-page';
import AdminRawInventoryPage from '@/pages/admin/admin-raw-inventory-page';
import AdminProcessingPage from '@/pages/admin/admin-processing-page';
import AdminProcessedInventoryPage from '@/pages/admin/admin-processed-inventory-page';
import AdminMarketplacePage from '@/pages/admin/admin-marketplace-page';
import AdminOrdersPage from '@/pages/admin/admin-orders-page';
import AdminUsersPage from '@/pages/admin/admin-users-page';
import AdminReportsPage from '@/pages/admin/admin-reports-page';
import AdminAuditLogsPage from '@/pages/admin/admin-audit-logs-page';
import AdminSettingsPage from '@/pages/admin/admin-settings-page';

export function AppRoutes() {
  return (
    <Routes>
      {/* Screen 1: Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Screens 2-11: User Portal with persistent UserSidebar */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sell-material" element={<SellMaterialPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/my-listings" element={<MyRequestsPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Screens 12-15: Admin Portal with persistent AdminSidebar */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/marketplace" element={<AdminMarketplacePage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/raw-inventory" element={<AdminRawInventoryPage />} />
        <Route path="/admin/material-management" element={<AdminRawInventoryPage />} />
        <Route path="/admin/requests" element={<AdminRequestsPage />} />
        <Route path="/admin/requests/:id" element={<AdminRequestDetailsPage />} />
        <Route path="/admin/inspections" element={<AdminInspectionsPage />} />
        <Route path="/admin/offers" element={<AdminOffersPage />} />
        <Route path="/admin/processing" element={<AdminProcessingPage />} />
        <Route path="/admin/processed-inventory" element={<AdminProcessedInventoryPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* 404 fallback */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
