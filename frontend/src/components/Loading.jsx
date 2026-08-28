export default function Loading({ text = 'กำลังโหลด...' }) {
  return (
    <div
      style={{
        padding: '1rem',
        color: '#475569',
      }}
    >
      {text}
    </div>
  );
}