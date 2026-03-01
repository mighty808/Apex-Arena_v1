import { showModal } from '../components/modal';

export const getElementById = <T extends HTMLElement = HTMLElement>(id: string): T | null => {
  return document.getElementById(id) as T | null;
};

export const querySelector = <T extends HTMLElement = HTMLElement>(selector: string): T | null => {
  return document.querySelector(selector) as T | null;
};


export const querySelectorAll = <T extends HTMLElement = HTMLElement>(
  selector: string
): NodeListOf<T> => {
  return document.querySelectorAll(selector) as NodeListOf<T>;
};


export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string;
    id?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: Record<string, string>;
    style?: Partial<CSSStyleDeclaration>;
  }
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);

  if (options?.className) element.className = options.className;
  if (options?.id) element.id = options.id;
  if (options?.textContent) element.textContent = options.textContent;
  if (options?.innerHTML) element.innerHTML = options.innerHTML;

  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options?.style) {
    Object.assign(element.style, options.style);
  }

  return element;
};

export const show = (element: HTMLElement): void => {
  element.style.display = '';
};


export const hide = (element: HTMLElement): void => {
  element.style.display = 'none';
};


export const toggle = (element: HTMLElement): void => {
  if (element.style.display === 'none') {
    show(element);
  } else {
    hide(element);
  }
};


export const clearContent = (element: HTMLElement): void => {
  element.innerHTML = '';
};


export const renderTo = (element: HTMLElement, content: string | HTMLElement): void => {
  if (typeof content === 'string') {
    element.innerHTML = content;
  } else {
    clearContent(element);
    element.appendChild(content);
  }
};


export const appendTo = (element: HTMLElement, content: string | HTMLElement): void => {
  if (typeof content === 'string') {
    element.insertAdjacentHTML('beforeend', content);
  } else {
    element.appendChild(content);
  }
};


export const getFormData = (form: HTMLFormElement): Record<string, any> => {
  const formData = new FormData(form);
  const data: Record<string, any> = {};

  formData.forEach((value, key) => {
    
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  });

  return data;
};


export const setFormData = (form: HTMLFormElement, data: Record<string, any>): void => {
  Object.entries(data).forEach(([key, value]) => {
    const element = form.elements.namedItem(key) as HTMLInputElement | null;
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = !!value;
      } else {
        element.value = String(value);
      }
    }
  });
};


export const disableForm = (form: HTMLFormElement): void => {
  const elements = form.querySelectorAll('input, button, select, textarea');
  elements.forEach((el) => {
    (el as HTMLInputElement).disabled = true;
  });
};


export const enableForm = (form: HTMLFormElement): void => {
  const elements = form.querySelectorAll('input, button, select, textarea');
  elements.forEach((el) => {
    (el as HTMLInputElement).disabled = false;
  });
};


export const showError = (element: HTMLElement, message: string): void => {
  element.textContent = message;
  element.style.color = 'red';
  element.style.fontSize = '14px';
  element.style.marginTop = '8px';
  show(element);
};


export const hideError = (element: HTMLElement): void => {
  hide(element);
  element.textContent = '';
};


export const showSuccess = (element: HTMLElement, message: string): void => {
  element.textContent = message;
  element.style.color = 'green';
  element.style.fontSize = '14px';
  element.style.marginTop = '8px';
  show(element);
};

export const setButtonLoading = (button: HTMLButtonElement, loading: boolean): void => {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent || '';
    button.textContent = 'Loading...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
    delete button.dataset.originalText;
  }
};


export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


export const addListener = <K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void
): () => void => {
  element.addEventListener(event, handler as EventListener);
  
  return () => {
    element.removeEventListener(event, handler as EventListener);
  };
};


export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};


export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};


export const confirm = (message: string): boolean => {
  return window.confirm(message);
};

export const alert = (message: string): void => {
  showModal({
    title: 'Notification',
    content: `<p style="margin: 0; line-height: 1.6;">${message}</p>`,
    showCloseButton: true
  });
};