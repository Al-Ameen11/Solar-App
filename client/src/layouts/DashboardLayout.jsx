import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AuthModal from '../components/common/AuthModal';
import Toast from '../components/common/Toast';
import { useApp } from '../context/AppContext';

export default function DashboardLayout() {
  const { showAuth } = useApp();

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
      {showAuth && <AuthModal />}
      <Toast />
    </div>
  );
}
