export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div style={{
      background: '#FEE2E2',
      color: '#991B1B',
      border: '1px solid #FCA5A5',
      borderRadius: '8px',
      padding: '10px 12px',
      marginBottom: '12px',
      fontSize: '14px',
    }}>
      {message}
    </div>
  );
}
