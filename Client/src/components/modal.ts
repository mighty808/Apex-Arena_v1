export interface ModalConfig {
  title: string;
  content: HTMLElement | string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

function injectModalStyles() {
  if (document.getElementById('modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'modal-styles';
  style.textContent = `
    :root {
      --primary: #636b2f;
      --text-main: #1a1a1a;
      --text-muted: #666;
      --bg-modal: #ffffff;
    }

    /* Overlay: The blurred backdrop */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(6px); /* The Glass Effect */
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      animation: modalFadeIn 0.3s forwards;
    }

    /* The Modal Card */
    .modal {
      background: var(--bg-modal);
      width: 90%;
      max-width: 500px;
      max-height: 90vh; /* Prevent overflow on small screens */
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      transform: scale(0.95) translateY(10px);
      animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border: 1px solid rgba(255, 255, 255, 0.6);
      overflow: hidden;
    }

    /* Header */
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255,255,255,0.8);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.01em;
    }

    /* Close Button */
    .modal-close {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }

    .modal-close:hover {
      background: #f3f4f6;
      color: var(--primary); /* Olive hover */
      transform: rotate(90deg);
    }

    /* Content */
    .modal-content {
      padding: 24px;
      overflow-y: auto; /* Scroll internally if content is long */
      color: var(--text-muted);
      line-height: 1.6;
      font-size: 1rem;
    }

    /* --- Exit Animations Classes --- */
    .modal-overlay.closing {
      animation: modalFadeOut 0.2s forwards;
    }
    
    .modal-overlay.closing .modal {
      animation: modalSlideDown 0.2s forwards;
    }

    /* Keyframes */
    @keyframes modalFadeIn { to { opacity: 1; } }
    @keyframes modalFadeOut { to { opacity: 0; } }

    @keyframes modalSlideUp { 
      to { transform: scale(1) translateY(0); } 
    }
    @keyframes modalSlideDown { 
      to { transform: scale(0.95) translateY(10px); opacity: 0; } 
    }
  `;
  document.head.appendChild(style);
}

export function createModal(config: ModalConfig): HTMLElement {
  injectModalStyles();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
 
  modal.addEventListener('click', (e) => e.stopPropagation());
  
  
  const header = document.createElement('div');
  header.className = 'modal-header';
  
  const title = document.createElement('h2');
  title.textContent = config.title;
  header.appendChild(title);
  
  
  if (config.showCloseButton !== false) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Close modal');
    
    closeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    
    closeBtn.addEventListener('click', () => {
      closeModalWithAnimation(overlay, config.onClose);
    });
    header.appendChild(closeBtn);
  }
  
  modal.appendChild(header);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'modal-content';
  
  if (typeof config.content === 'string') {
    contentDiv.innerHTML = config.content;
  } else {
    contentDiv.appendChild(config.content);
  }
  
  modal.appendChild(contentDiv);
  overlay.appendChild(modal);
  
  overlay.addEventListener('click', () => {
    closeModalWithAnimation(overlay, config.onClose);
  });
  
  return overlay;
}

export function showModal(config: ModalConfig): HTMLElement {
  const modal = createModal(config);
  document.body.appendChild(modal);
  
  return modal;
}

function closeModalWithAnimation(overlay: HTMLElement, onCloseCallback?: () => void) {
 
  overlay.classList.add('closing');

  overlay.addEventListener('animationend', () => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    
    if (onCloseCallback) onCloseCallback();
  }, { once: true });
}

export function closeModal(modal: HTMLElement): void {
 
  if (modal.classList.contains('closing')) return;
  closeModalWithAnimation(modal);
}

export function closeAllModals(): void {
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    const el = modal as HTMLElement;
    closeModal(el);
  });
}