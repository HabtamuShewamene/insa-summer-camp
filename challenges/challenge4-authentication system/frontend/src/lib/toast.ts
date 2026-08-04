type ToastEvent = { type: 'success' | 'error'; message: string };

function notify(type: ToastEvent['type'], message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ToastEvent>('app-toast', { detail: { type, message } }));
  }
}

export const toast = {
  success: (message: string) => notify('success', message),
  error: (message: string) => notify('error', message),
};
