import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MonthProvider } from './context/MonthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DailyControlPage from './pages/DailyControlPage';
import BankAccountsPage from './pages/BankAccountsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import DebtsPage from './pages/DebtsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import BenefitCardsPage from './pages/BenefitCardsPage';
import MonthlyReportPage from './pages/MonthlyReportPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MonthProvider>
          <ThemeProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/daily-control"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DailyControlPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bank-accounts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BankAccountsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/credit-cards"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreditCardsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DebtsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investments"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InvestmentsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SubscriptionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/benefit-cards"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BenefitCardsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monthly-report"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MonthlyReportPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdminPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
          </ThemeProvider>
        </MonthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
