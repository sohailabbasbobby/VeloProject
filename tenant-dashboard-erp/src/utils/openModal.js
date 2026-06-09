// Modal helper to bridge UI actions to UniversalModal
export const openModal = (content) => {
  window.dispatchEvent(new CustomEvent('OPEN_MODAL', { detail: content }));
};
