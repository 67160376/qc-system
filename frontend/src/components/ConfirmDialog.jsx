export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {title}
        </h3>

        <p
          style={{
            color: '#475569',
            marginBottom: '20px',
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              ...styles.button,
              background: '#E2E8F0',
              color: '#0F172A',
            }}
          >
            ยกเลิก
          </button>

          <button
            onClick={onConfirm}
            style={{
              ...styles.button,
              background: '#DC2626',
              color: '#fff',
            }}
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  button: {
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};