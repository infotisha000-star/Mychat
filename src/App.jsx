import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';

import { Background3D } from './components/common/Background3D';
import { LoadingScreen } from './components/common/LoadingScreen';
import { AuthCard } from './components/auth/AuthCard';
import { ChatHeader } from './components/chat/ChatHeader';
import { PinnedBanner } from './components/chat/PinnedBanner';
import { MessageList } from './components/chat/MessageList';
import { MessageComposer } from './components/chat/MessageComposer';
import { TypingIndicator } from './components/chat/TypingIndicator';
import { LightboxViewer } from './components/chat/LightboxViewer';
import { VideoPlayerModal } from './components/chat/VideoPlayerModal';
import { AdminDashboard } from './components/admin/AdminDashboard';

export const App = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { 
    messages, 
    pinnedMessages, 
    loadingMessages, 
    editMessage, 
    deleteMessage, 
    togglePinMessage 
  } = useChat();

  const [replyTarget, setReplyTarget] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  if (authLoading) {
    return <LoadingScreen message="Verifying user session..." />;
  }

  return (
    <div className="relative h-full h-[100dvh] w-full overflow-hidden bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-[#f1f5f9] text-slate-100 transition-colors duration-300">
      {/* Aurora Ambient Pattern Background */}
      <Background3D />

      {!user ? (
        <div className="relative z-10 h-full w-full flex items-center justify-center p-4 overflow-y-auto">
          <AuthCard />
        </div>
      ) : (
        <div className="app-container relative z-10 flex flex-col h-full h-[100dvh] w-full max-w-4xl mx-auto bg-slate-900/80 text-slate-100 shadow-2xl overflow-hidden border-x border-slate-800/60 backdrop-blur-md transition-colors duration-300">
          {/* Top Header */}
          <ChatHeader onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)} />

          {/* Pinned Messages Header Banner */}
          <PinnedBanner
            pinnedMessages={pinnedMessages}
            onScrollToMessage={(id) => {
              const el = document.getElementById(`msg-${id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onUnpinMessage={togglePinMessage}
            isAdmin={isAdmin}
          />

          {/* Real-time Message Stream */}
          <MessageList
            messages={messages}
            loading={loadingMessages}
            currentUser={user}
            isAdmin={isAdmin}
            onReply={(msg) => setReplyTarget(msg)}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onPin={togglePinMessage}
            onOpenImage={(url) => setLightboxImage(url)}
            onOpenVideo={(url) => setModalVideo(url)}
          />

          {/* Typing Indicator */}
          <div className="px-4">
            <TypingIndicator isTyping={false} userName="Someone" />
          </div>

          {/* Message Composer Bar */}
          <MessageComposer
            replyTo={replyTarget}
            onCancelReply={() => setReplyTarget(null)}
          />

          {/* Media Lightbox & Video Player Modals */}
          <LightboxViewer
            isOpen={!!lightboxImage}
            imageUrl={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />

          <VideoPlayerModal
            isOpen={!!modalVideo}
            videoUrl={modalVideo}
            onClose={() => setModalVideo(null)}
          />

          {/* Admin Control Center Dashboard */}
          {isAdmin && (
            <AdminDashboard
              isOpen={isAdminDashboardOpen}
              onClose={() => setIsAdminDashboardOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
