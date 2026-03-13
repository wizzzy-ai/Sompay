import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ title, subtitle, children, onClose, className = '', wide = false }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={handleBackdropClick}>
      <div className={`modal-dialog-custom ${wide ? 'modal-wide' : ''} ${className}`}>
        <div className="modal-content-custom">
          <div className="modal-header-custom">
            <div className="modal-header-text">
              <span className="modal-eyebrow">PSP Workspace</span>
              <h2 className="modal-title-custom">{title}</h2>
              {subtitle && <p className="modal-subtitle-custom">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          <div className="modal-body-shell">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
