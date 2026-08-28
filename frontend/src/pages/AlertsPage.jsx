import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] =
    useState(null);

  const [error, setError] = useState('');

  const { hasRole } = useAuth();

  const canAcknowledge = hasRole([
    'ADMIN',
    'QC',
  ]);

  const loadAlerts = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.get('/alerts');

      const sortedAlerts = [...data].sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      setAlerts(sortedAlerts);
    } catch (err) {
      setError(
        err.message ||
          'ไม่สามารถโหลดข้อมูลการแจ้งเตือนได้'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const acknowledge = async (id) => {
    if (!canAcknowledge) return;

    setAcknowledgingId(id);
    setError('');

    try {
      await api.put(
        `/alerts/${id}/acknowledge`,
        {}
      );

      await loadAlerts();
    } catch (err) {
      setError(
        err.message ||
          'ไม่สามารถรับทราบการแจ้งเตือนได้'
      );
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (loading) {
    return (
      <Loading text="กำลังโหลดข้อมูลการแจ้งเตือน..." />
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            การแจ้งเตือนจากระบบ
          </p>

          <h2 style={{ margin: 0 }}>
            การแจ้งเตือน
          </h2>
        </div>

        <button
          onClick={loadAlerts}
          style={styles.refreshButton}
        >
          รีเฟรช
        </button>
      </div>

      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}

      {!canAcknowledge && (
        <div style={styles.readOnly}>
          คุณมีสิทธิ์ดูข้อมูลเท่านั้น
          เฉพาะผู้ใช้งาน ADMIN และ QC
          เท่านั้นที่สามารถรับทราบการแจ้งเตือนได้
        </div>
      )}

      {alerts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 40 }}>
            📭
          </div>

          <h3 style={{ marginBottom: 6 }}>
            ไม่มีการแจ้งเตือน
          </h3>

          <div>
            ขณะนี้ไม่มีการแจ้งเตือนจากระบบ
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {alerts.map((alert) => {
            const level = String(
              alert.level || ''
            ).toLowerCase();

            const borderColor =
              level === 'critical'
                ? '#DC2626'
                : level === 'warning'
                  ? '#F59E0B'
                  : '#2563EB';

            const levelName =
              level === 'critical'
                ? 'ระดับวิกฤต'
                : level === 'warning'
                  ? 'คำเตือน'
                  : 'ข้อมูล';

            return (
              <div
                key={alert.id}
                style={{
                  ...styles.card,
                  borderTop:
                    `4px solid ${borderColor}`,
                }}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h4 style={{ margin: 0 }}>
                      การแจ้งเตือน: {levelName}
                    </h4>

                    <div style={styles.date}>
                      {alert.created_at
                        ? new Date(
                            alert.created_at
                          ).toLocaleString(
                            'th-TH'
                          )
                        : '-'}
                    </div>
                  </div>

                  <StatusBadge
                    status={alert.level}
                  />
                </div>

                <p style={styles.message}>
                  {alert.message}
                </p>

                <div style={styles.footer}>
                  {alert.acknowledged ? (
                    <div
                      style={
                        styles.acknowledged
                      }
                    >
                      ✓ รับทราบแล้ว
                    </div>
                  ) : canAcknowledge ? (
                    <button
                      style={{
                        ...styles.button,
                        ...(acknowledgingId ===
                        alert.id
                          ? styles.buttonDisabled
                          : {}),
                      }}
                      onClick={() =>
                        acknowledge(alert.id)
                      }
                      disabled={
                        acknowledgingId ===
                        alert.id
                      }
                    >
                      {acknowledgingId ===
                      alert.id
                        ? 'กำลังดำเนินการ...'
                        : 'รับทราบ'}
                    </button>
                  ) : (
                    <div style={styles.pending}>
                      รอการรับทราบ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  eyebrow: {
    margin: '0 0 4px',
    color: '#64748B',
    letterSpacing: '0.08em',
    fontSize: 11,
    fontWeight: 700,
  },

  refreshButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 18,
  },

  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  date: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
  },

  message: {
    color: '#475569',
    margin: '18px 0',
    lineHeight: 1.6,
  },

  footer: {
    borderTop: '1px solid #E2E8F0',
    paddingTop: 14,
  },

  button: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  acknowledged: {
    color: '#15803D',
    fontWeight: 700,
  },

  pending: {
    color: '#64748B',
    fontWeight: 600,
  },

  readOnly: {
    background: '#F1F5F9',
    color: '#475569',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },

  error: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },

  emptyState: {
    minHeight: 250,
    background: '#fff',
    border: '1px dashed #CBD5E1',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#64748B',
    textAlign: 'center',
    padding: 24,
  },
};