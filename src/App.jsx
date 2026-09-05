import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
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

// Lazily load heavy modals to keep initial bundle size minimal & load instantly
const LightboxViewer = lazy(() => import('./components/chat/LightboxViewer').then(m => ({ default: m.LightboxViewer })));
const VideoPlayerModal = lazy(() => import('./components/chat/VideoPlayerModal').then(m => ({ default: m.VideoPlayerModal })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AppLockModal = lazy(() => import('./components/common/AppLockModal').then(m => ({ default: m.AppLockModal })));

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
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  // Mobile virtual keyboard visualViewport height tracking (resize only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    let rAFId = null;
    let lastHeight = 0;

    const handleResize = () => {
      if (rAFId) return;
      rAFId = requestAnimationFrame(() => {
        rAFId = null;
        if (window.visualViewport) {
          const currentHeight = Math.round(window.visualViewport.height);
          if (Math.abs(currentHeight - lastHeight) > 10) {
            lastHeight = currentHeight;
            setViewportHeight(`${currentHeight}px`);
          }
        }
      });
    };

    window.visualViewport.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const handleReply = useCallback((msg) => {
    setReplyTarget(msg);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTarget(null);
  }, []);

  const handleOpenImage = useCallback((url) => {
    setLightboxImage(url);
  }, []);

  const handleOpenVideo = useCallback((url) => {
    setModalVideo(url);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const handleCloseVideoModal = useCallback(() => {
    setModalVideo(null);
  }, []);

  const handleOpenAdminDashboard = useCallback(() => {
    setIsAdminDashboardOpen(true);
  }, []);

  const handleCloseAdminDashboard = useCallback(() => {
    setIsAdminDashboardOpen(false);
  }, []);

  const handleScrollToMessage = useCallback((id) => {
    if (!id) return;
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-amber-400', 'rounded-2xl', 'scale-[1.01]', 'transition-all', 'duration-300');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'rounded-2xl', 'scale-[1.01]', 'transition-all', 'duration-300');
      }, 2200);
    }
  }, []);

  return (
    <div className="relative h-full h-[100dvh] w-full overflow-hidden bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-[#f1f5f9] text-slate-100 transition-colors duration-300">
      {/* Aurora Ambient Pattern Background */}
      <Background3D />

      {!user ? (
        <div className="relative z-10 h-full w-full flex items-center justify-center p-4 overflow-y-auto">
          <AuthCard />
        </div>
      ) : (
        <div 
          style={{ height: viewportHeight }}
          className="app-container relative z-10 flex flex-col w-full max-w-4xl mx-auto bg-slate-900/80 text-slate-100 shadow-2xl overflow-hidden border-x border-slate-800/60 backdrop-blur-md transition-colors duration-300"
        >
          {/* Top Header */}
          <ChatHeader onOpenAdminDashboard={handleOpenAdminDashboard} />

          {/* Pinned Messages Header Banner */}
          <PinnedBanner
            pinnedMessages={pinnedMessages}
            onScrollToMessage={handleScrollToMessage}
            onUnpinMessage={togglePinMessage}
            isAdmin={isAdmin}
          />

          {/* Real-time Message Stream */}
          <MessageList
            messages={messages}
            loading={loadingMessages}
            currentUser={user}
            isAdmin={isAdmin}
            onReply={handleReply}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onPin={togglePinMessage}
            onOpenImage={handleOpenImage}
            onOpenVideo={handleOpenVideo}
          />

          {/* Typing Indicator */}
          <div className="px-4">
            <TypingIndicator isTyping={false} userName="Someone" />
          </div>

          {/* Message Composer Bar */}
          <MessageComposer
            replyTo={replyTarget}
            onCancelReply={handleCancelReply}
          />

          {/* Media Lightbox & Video Player Modals */}
          <Suspense fallback={null}>
            {lightboxImage && (
              <LightboxViewer
                isOpen={!!lightboxImage}
                imageUrl={lightboxImage}
                onClose={handleCloseLightbox}
              />
            )}

            {modalVideo && (
              <VideoPlayerModal
                isOpen={!!modalVideo}
                videoUrl={modalVideo}
                onClose={handleCloseVideoModal}
              />
            )}

            {/* Admin Control Center Dashboard */}
            {isAdmin && isAdminDashboardOpen && (
              <AdminDashboard
                isOpen={isAdminDashboardOpen}
                onClose={handleCloseAdminDashboard}
              />
            )}
          </Suspense>
        </div>
      )}

      {/* Optional Passcode PWA App Lock */}
      <Suspense fallback={null}>
        <AppLockModal isAuthenticated={!!user} />
      </Suspense>
    </div>
  );
};

