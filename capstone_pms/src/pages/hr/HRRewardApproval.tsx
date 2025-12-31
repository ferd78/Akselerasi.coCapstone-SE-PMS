import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Award, 
  User, 
  Calendar, 
  DollarSign 
} from 'lucide-react';

// --- Types ---
interface RewardRequest {
  id: string;
  employeeName: string;
  rewardType: string;
  amount: string;
  recommendedBy: string;
  submittedDate: string;
  reason: string;
  justification: string;
}

const HRRewardApproval = () => {
  // Mock data based on provided UI
  const [pendingRewards, setPendingRewards] = useState<RewardRequest[]>([
    {
      id: '1',
      employeeName: 'Lisa Martinez',
      rewardType: 'Performance Bonus',
      amount: '2,500',
      recommendedBy: 'Michael Chen',
      submittedDate: '20/12/2024',
      reason: 'Year-end performance excellence',
      justification: 'Lisa has consistently delivered exceptional results throughout the year, exceeding all quarterly targets and mentoring three junior developers.'
    },
    {
      id: '2',
      employeeName: 'James Wilson',
      rewardType: 'Spot Bonus',
      amount: '750',
      recommendedBy: 'Michael Chen',
      submittedDate: '21/12/2024',
      reason: 'Critical bug fix',
      justification: 'James identified and resolved a critical production bug over the weekend, preventing potential data loss and service disruption.'
    }
  ]);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    // Logic to remove from list or update status
    setPendingRewards(prev => prev.filter(item => item.id !== id));
    console.log(`${action}ed reward for ID: ${id}`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <header className="mb-8 w-full">
          <h1 className="text-2xl font-bold text-gray-900">Reward Approvals</h1>
          <p className="text-gray-500">Review and approve reward recommendations</p>
        </header>

        {/* Purple Banner Card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-lg flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Award size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold">{pendingRewards.length}</h2>
            <p className="text-purple-100 font-medium">Pending Approvals</p>
          </div>
        </div>

        {/* Reward Requests List */}
        <div className="space-y-6">
          {pendingRewards.length > 0 ? (
            pendingRewards.map((reward) => (
              <div key={reward.id} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{reward.employeeName}</h3>
                      <span className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {reward.rewardType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Recommended by: <span className="font-semibold">{reward.recommendedBy}</span> • Submitted: {reward.submittedDate}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 flex items-center">
                    <span className="text-lg">$</span>{reward.amount}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Reason:</h4>
                    <p className="text-gray-800 font-medium">{reward.reason}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Justification:</h4>
                    <p className="text-gray-600 leading-relaxed text-sm">{reward.justification}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-50">
                  <button 
                    onClick={() => handleAction(reward.id, 'approve')}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <Check size={18} /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(reward.id, 'reject')}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm"
                  >
                    <X size={18} /> Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-gray-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
              <p className="text-gray-500">No pending reward approvals at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRRewardApproval;