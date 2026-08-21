/**
 * Browser & PWA Notification Manager.
 * Requests notification permissions and triggers system notifications for incoming messages.
 */

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  } catch (e) {
    console.warn('Notification permission request error:', e);
    return 'denied';
  }
};

export const sendIncomingMessageNotification = ({ senderName, text, media = [] }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Only trigger browser notification if page is hidden or unfocused
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    return;
  }

  let body = text;
  if (!body && media.length > 0) {
    body = `📷 Attached ${media.length} media file(s)`;
  }

  try {
    const notification = new Notification(`New Message from ${senderName || 'Vortex Chat'}`, {
      body: body || 'Sent a message',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `msg_${Date.now()}`,
      renotify: true,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.warn('Notification display warning:', e);
  }
};
