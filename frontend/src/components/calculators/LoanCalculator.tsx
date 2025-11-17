'use client';
import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-react';

// Types
export interface LoanCalculation {
  loanAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: InstallmentSchedule[];
}

export interface InstallmentSchedule {
  month: number;
  principal: number;
  interest: number;
  total: number;
  remainingBalance: number;
}

// Utility functions
const calculateAnnuity = (loanAmount: number, annualInterestRate: number, tenureMonths: number): LoanCalculation => {
  const monthlyRate = annualInterestRate / 12 / 100;
  const annuityFactor = (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                       (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  const monthlyPayment = loanAmount * annuityFactor;
  const totalPayment = monthlyPayment * tenureMonths;
  const totalInterest = totalPayment - loanAmount;
  
  const schedule: InstallmentSchedule[] = [];
  let remainingBalance = loanAmount;
  
  for (let month = 1; month <= tenureMonths; month++) {
    const interest = remainingBalance * monthlyRate;
    const principal = monthlyPayment - interest;
    remainingBalance -= principal;
    
    schedule.push({
      month,
      principal,
      interest,
      total: monthlyPayment,
      remainingBalance: Math.max(0, remainingBalance)
    });
  }
  
  return {
    loanAmount,
    annualInterestRate,
    tenureMonths,
    monthlyPayment,
    totalPayment,
    totalInterest,
    schedule
  };
};

interface LoanCalculatorProps {
  vehiclePrice?: number;
  onCalculationComplete?: (result: LoanCalculation) => void;
  compact?: boolean;
}

export default function LoanCalculator({ 
  vehiclePrice = 500000000, 
  onCalculationComplete,
  compact = false 
}: LoanCalculatorProps) {
  const [formData, setFormData] = useState({
    vehiclePrice,
    downPayment: 30,
    loanAmount: vehiclePrice * 0.7,
    interestRate: 8.5,
    tenure: 36,
    calculationType: 'annuity' as 'annuity' | 'declining'
  });

  const [result, setResult] = useState<LoanCalculation | null>(null);

  const calculateLoan = () => {
    const calculation = calculateAnnuity(formData.loanAmount, formData.interestRate, formData.tenure);
    setResult(calculation);
    onCalculationComplete?.(calculation);
  };

  // Auto-calculate loan amount
  React.useEffect(() => {
    const loanAmount = formData.vehiclePrice * (1 - formData.downPayment / 100);
    setFormData(prev => ({ ...prev, loanAmount }));
  }, [formData.vehiclePrice, formData.downPayment]);

  if (compact) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-800">Tính trả góp</h4>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trả trước (%)
              </label>
              <input
                type="number"
                value={formData.downPayment}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  downPayment: Number(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời hạn
              </label>
              <select
                value={formData.tenure}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tenure: Number(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              >
                <option value="12">12 tháng</option>
                <option value="24">24 tháng</option>
                <option value="36">36 tháng</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={calculateLoan}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Tính toán
          </button>
          
          {result && (
            <div className="text-sm text-gray-800">
              <div className="flex justify-between items-center">
                <span className="font-medium">Trả góp/tháng:</span>
                <span className="font-semibold text-blue-700">
                  {result.monthlyPayment.toLocaleString()} VND
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Công cụ tính lãi vay mua xe</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá xe (VND)
            </label>
            <input
              type="number"
              value={formData.vehiclePrice}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                vehiclePrice: Number(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trả trước (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.downPayment}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                downPayment: Number(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
            <p className="text-sm text-gray-600 mt-1">
              Số tiền trả trước: {((formData.vehiclePrice * formData.downPayment) / 100).toLocaleString()} VND
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền vay (VND)
            </label>
            <input
              type="number"
              value={formData.loanAmount}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lãi suất (%/năm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.interestRate}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                interestRate: Number(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời hạn vay (tháng)
            </label>
            <select
              value={formData.tenure}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tenure: Number(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            >
              <option value="12">12 tháng</option>
              <option value="24">24 tháng</option>
              <option value="36">36 tháng</option>
              <option value="48">48 tháng</option>
              <option value="60">60 tháng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cách tính lãi
            </label>
            <select
              value={formData.calculationType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                calculationType: e.target.value as 'annuity' | 'declining' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            >
              <option value="annuity">Lãi cộng dồn chia đều (Annuity)</option>
              <option value="declining">Lãi trên dư nợ giảm dần</option>
            </select>
          </div>

          <button
            onClick={calculateLoan}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Tính toán
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">Tổng quan khoản vay</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Trả góp hàng tháng:</span>
                    <span className="font-semibold text-blue-900">
                      {result.monthlyPayment.toLocaleString()} VND
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tổng số tiền trả:</span>
                    <span className="font-semibold text-blue-900">
                      {result.totalPayment.toLocaleString()} VND
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tổng lãi phải trả:</span>
                    <span className="font-semibold text-blue-900">
                      {result.totalInterest.toLocaleString()} VND
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3">Lịch trả nợ (3 tháng đầu)</h4>
                <div className="space-y-2">
                  {result.schedule.slice(0, 3).map((installment) => (
                    <div key={installment.month} className="flex justify-between text-sm">
                      <span className="text-green-700">Tháng {installment.month}:</span>
                      <span className="font-medium text-green-900">{installment.total.toLocaleString()} VND</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}