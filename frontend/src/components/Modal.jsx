export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const styles = {
  closeButton: {
    border: 'none',
    background: '#F1F5F9',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    fontSize: '20px',
    cursor: 'pointer',
  },
};
