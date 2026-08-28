export default function StatusBadge({ status, type = 'status' }) {
  const normalized = String(status || '').toUpperCase();

  const palette = {
    OPEN: {
      background: '#DBEAFE',
      color: '#1D4ED8',
      label: 'เปิดรายการ',
    },
    IN_PROGRESS: {
      background: '#FEF3C7',
      color: '#B45309',
      label: 'กำลังดำเนินการ',
    },
    CLOSED: {
      background: '#DCFCE7',
      color: '#15803D',
      label: 'ปิดรายการ',
    },
    COMPLETED: {
      background: '#DCFCE7',
      color: '#15803D',
      label: 'เสร็จสิ้น',
    },
    FAILED: {
      background: '#FEE2E2',
      color: '#B91C1C',
      label: 'ไม่ผ่าน',
    },
    PENDING: {
      background: '#E2E8F0',
      color: '#475569',
      label: 'รอดำเนินการ',
    },
    INFO: {
      background: '#DBEAFE',
      color: '#1D4ED8',
      label: 'ข้อมูล',
    },
    WARNING: {
      background: '#FEF3C7',
      color: '#B45309',
      label: 'คำเตือน',
    },
    CRITICAL: {
      background: '#FEE2E2',
      color: '#B91C1C',
      label: 'วิกฤต',
    },
  };

  const currentStatus = palette[normalized] || {
    background: '#E2E8F0',
    color: '#475569',
    label: 'ไม่ทราบสถานะ',
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        background: currentStatus.background,
        color: currentStatus.color,
      }}
    >
      {currentStatus.label}
    </span>
  );
}