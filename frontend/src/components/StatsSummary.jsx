import React from 'react';
import CountUp from 'react-countup';
import { CheckCircle, Clock, Receipt, DollarSign } from 'lucide-react';
import './StatsSummary.css';

const StatsSummary = ({ payments }) => {
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);
  const totalTransactions = payments.length;
  const averagePayment = payments.length
    ? Math.floor(payments.reduce((s, p) => s + p.amount, 0) / payments.length)
    : 0;

  return (
    <div className="stats-summary row g-4 mb-4">
      <div className="col-lg-3 col-md-6 col-12">
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-value">
            ₦<CountUp end={totalPaid} duration={2} separator="," />
          </div>
          <div className="stat-label">Total Paid</div>
        </div>
      </div>
      <div className="col-lg-3 col-md-6 col-12">
        <div className="stat-card">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-value">
            ₦<CountUp end={totalPending} duration={2} separator="," />
          </div>
          <div className="stat-label">Pending Payments</div>
        </div>
      </div>
      <div className="col-lg-3 col-md-6 col-12">
        <div className="stat-card">
          <div className="stat-icon">
            <Receipt />
          </div>
          <div className="stat-value">
            <CountUp end={totalTransactions} duration={2} />
          </div>
          <div className="stat-label">Total Transactions</div>
        </div>
      </div>
      <div className="col-lg-3 col-md-6 col-12">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign />
          </div>
          <div className="stat-value">
            ₦<CountUp end={averagePayment} duration={2} separator="," />
          </div>
          <div className="stat-label">Average Payment</div>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;
