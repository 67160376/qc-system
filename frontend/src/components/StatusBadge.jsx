export default function StatusBadge({ status, type = 'status' }) {
  const normalized = String(status || '').toUpperCase();

  const palette = {
    OPEN: { background: '#DBEAFE', color: '#1D4ED8' },
    IN_PROGRESS: { background: '#FEF3C7', color: '#B45309' },
    CLOSED: { background: '#DCFCE7', color: '#15803D' },
    COMPLETED: { background: '#DCFCE7', color: '#15803D' },
    FAILED: { background: '#FEE2E2', color: '#B91C1C' },
    PENDING: { background: '#E2E8F0', color: '#475569' },
    info: { background: '#DBEAFE', color: '#1D4ED8' },
    warning: { background: '#FEF3C7', color: '#B45309' },
    critical: { background: '#FEE2E2', color: '#B91C1C' },
  };

  const style = palette[normalized] || { background: '#E2E8F0', color: '#475569' };

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      background: style.background,
      color: style.color,
    }}>
      {normalized || 'UNKNOWN'}
    </span>
  );
}
