'use client';
import { Toaster } from 'react-hot-toast';

export default function CustomToast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'text-sm font-medium',
        style: {
          background: '#fff',
          color: '#374151',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '12px 16px',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #10B981',
            background: '#ECFDF5',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #EF4444',
            background: '#FEF2F2',
          },
        },
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #3B82F6',
            background: '#EFF6FF',
          },
        },
      }}
    />
  );
}