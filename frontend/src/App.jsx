import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Loading from './components/Loading';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminProtectedRoute from './AdminProtectedRoute';
import DashboardRedirect from './DashboardRedirect';
import CompanyProtectedRoute from './CompanyProtectedRoute';
import CompanyAccountProtectedRoute from './CompanyAccountProtectedRoute';
import Navbar from './components/Navbar';
import UserNavbar from './components/UserNavbar';
import AdminNavbar from './components/AdminNavbar';
import CompanyNavbar from './components/CompanyNavbar';
import Footer from './components/Footer';

// Lazy load all pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Services = lazy(() => import('./pages/Services'));
	const Login = lazy(() => import('./pages/Login'));
	const Register = lazy(() => import('./pages/Register'));
	const CompanyRegister = lazy(() => import('./pages/CompanyRegister'));
	const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
	const AdminLogin = lazy(() => import('./pages/AdminLogin'));
	const CompanyLogin = lazy(() => import('./pages/CompanyLogin'));
	const OtpVerify = lazy(() => import('./pages/OtpVerify'));
	const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

		// Admin pages - lazy loaded
		const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
		const AdminClients = lazy(() => import('./admin/pages/AdminClients'));
		const AdminPayments = lazy(() => import('./admin/pages/AdminPayments'));
		const AdminUsers = lazy(() => import('./admin/pages/AdminAllUsers'));
		const AdminMessages = lazy(() => import('./admin/pages/AdminMessages'));
		const AdminJoinRequests = lazy(() => import('./admin/pages/AdminJoinRequests'));
		const AdminCompanies = lazy(() => import('./admin/pages/AdminCompanies'));
		const CompanyUsers = lazy(() => import('./admin/pages/AdminUsers'));

	// User pages - lazy loaded
	const Dashboard = lazy(() => import('./user/pages/Dashboard'));
	const Profile = lazy(() => import('./user/pages/Profile'));
	const PaymentsHistory = lazy(() => import('./user/pages/PaymentsHistory'));
	const AccountSettings = lazy(() => import('./user/pages/AccountSettings'));
	const Notifications = lazy(() => import('./user/pages/Notifications'));
	const Messages = lazy(() => import('./user/pages/Messages'));
	const SelectCompany = lazy(() => import('./user/pages/SelectCompany'));

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <main className="App">
          <Suspense fallback={<Loading />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <Home />
                <Footer />
              </>
            } />
            <Route path="/about" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <About />
                <Footer />
              </>
            } />
            <Route path="/contact" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <Contact />
                <Footer />
              </>
            } />
            <Route path="/services" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <Services />
                <Footer />
              </>
            } />
            <Route path="/login" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <Login />
                <Footer />
              </>
            } />
            <Route path="/register" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <Register />
                <Footer />
              </>
            } />
            <Route path="/company-register" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <CompanyRegister />
                <Footer />
              </>
            } />
            <Route path="/verify-otp" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <VerifyOtp />
                <Footer />
              </>
            } />

            {/* Company Verify OTP Route */}
            <Route path="/company-verify" element={
              <>
                <Navbar />
                <div className="navbar-spacer"></div>
                <OtpVerify />
                <Footer />
              </>
            } />

	            {/* Admin Login Route */}
	            <Route path="/admin-login" element={
	              <>
	                <AdminLogin />
	              </>
	            } />

	            {/* Admin entry route */}
	            <Route path="/admin" element={<AdminRoute />} />

	            {/* Company Login Route */}
	            <Route path="/company-login" element={
	              <>
	                <Navbar />
                <div className="navbar-spacer"></div>
                <CompanyLogin />
                <Footer />
              </>
            } />

            {/* Admin Verify OTP Route */}
            <Route path="/admin-verify-otp" element={
              <>
                <OtpVerify />
              </>
            } />

            {/* OAuth Callback Route */}
            <Route path="/auth/callback" element={<OAuthCallback />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <>
                  <AdminNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminDashboard />
                </>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <AdminProtectedRoute>
                <>
                  <AdminNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminUsers />
                </>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/companies" element={
              <AdminProtectedRoute>
                <>
                  <AdminNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminCompanies />
                </>
              </AdminProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <AdminProtectedRoute>
                <>
                  <AdminNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminPayments />
                </>
              </AdminProtectedRoute>
            } />
			    <Route path="/admin/messages" element={
			      <AdminProtectedRoute>
			        <>
			          <AdminNavbar />
			          <div className="navbar-spacer"></div>
			          <AdminMessages />
			        </>
			      </AdminProtectedRoute>
			    } />

		    {/* Company Routes */}
		    <Route path="/company/dashboard" element={
		      <CompanyAccountProtectedRoute>
		        <>
                  <CompanyNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminDashboard />
                </>
              </CompanyAccountProtectedRoute>
            } />
            <Route path="/company/users" element={
              <CompanyAccountProtectedRoute>
                <>
                  <CompanyNavbar />
                  <div className="navbar-spacer"></div>
                  <CompanyUsers />
                </>
              </CompanyAccountProtectedRoute>
            } />
            <Route path="/company/payments" element={
              <CompanyAccountProtectedRoute>
                <>
                  <CompanyNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminPayments />
                </>
              </CompanyAccountProtectedRoute>
            } />
            <Route path="/company/clients" element={
              <CompanyAccountProtectedRoute>
                <>
                  <CompanyNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminClients />
                </>
              </CompanyAccountProtectedRoute>
            } />
            <Route path="/company/join-requests" element={
              <CompanyAccountProtectedRoute>
                <>
                  <CompanyNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminJoinRequests />
                </>
              </CompanyAccountProtectedRoute>
            } />
            <Route path="/company/messages" element={
              <CompanyAccountProtectedRoute>
                <>
                  <CompanyNavbar />
                  <div className="navbar-spacer"></div>
                  <AdminMessages />
                </>
              </CompanyAccountProtectedRoute>
            } />

            {/* Dashboard Redirect Route */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } />

            {/* User Routes */}
            <Route path="/app/dashboard" element={
              <ProtectedRoute>
                <CompanyProtectedRoute>
                  <>
                    <UserNavbar />
                    <div className="navbar-spacer"></div>
                    <Dashboard />
                  </>
                </CompanyProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/app/profile" element={
              <ProtectedRoute>
                <>
                  <UserNavbar />
                  <div className="navbar-spacer"></div>
                  <Profile />
                </>
              </ProtectedRoute>
            } />
            <Route path="/app/payments" element={
              <ProtectedRoute>
                <CompanyProtectedRoute>
                  <>
                    <UserNavbar />
                    <div className="navbar-spacer"></div>
                    <PaymentsHistory />
                  </>
                </CompanyProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/app/settings" element={
              <ProtectedRoute>
                <>
                  <UserNavbar />
                  <div className="navbar-spacer"></div>
                  <AccountSettings />
                </>
              </ProtectedRoute>
            } />
            <Route path="/app/notifications" element={
              <ProtectedRoute>
                <>
                  <UserNavbar />
                  <div className="navbar-spacer"></div>
                  <Notifications />
                </>
              </ProtectedRoute>
            } />
            <Route path="/app/messages" element={
              <ProtectedRoute>
                <CompanyProtectedRoute>
                  <>
                    <UserNavbar />
                    <div className="navbar-spacer"></div>
                    <Messages />
                  </>
                </CompanyProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/app/select-company" element={
              <ProtectedRoute>
                <>
                  <UserNavbar />
                  <div className="navbar-spacer"></div>
                  <SelectCompany />
                </>
              </ProtectedRoute>
            } />
          </Routes>
          </Suspense>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
