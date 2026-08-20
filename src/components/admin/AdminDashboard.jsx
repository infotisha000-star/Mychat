import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { AccessCodeManager } from './AccessCodeManager';
import { ActiveUsersList } from './ActiveUsersList';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { KeyRound, Users, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const AdminDashboard = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('codes'); // 'codes' | 'users'
  const { clearAllMessages, messages } = useChat();
  const toast = useToast();

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL messages in the chat history for all users? This action cannot be undone.')) {
      await clearAllMessages();
      toast.success('All chat history cleared successfully!');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Control Center"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl text-xs font-bold shadow-inner">
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all min-w-0 ${
              activeTab === 'codes'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span className="truncate">Access Code Management</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all min-w-0 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Online User Sessions</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'codes' ? <AccessCodeManager /> : <ActiveUsersList />}

        {/* Master Admin Delete All Action */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total active messages: <strong className="text-slate-200">{messages.length}</strong>
          </span>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Chat History</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
