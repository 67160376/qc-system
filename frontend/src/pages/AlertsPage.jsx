import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();

  const canAcknowledge = hasRole(['ADMIN', 'QC']);

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

  const summary = useMemo(() => {
    const result = {
      total: alerts.length,
      pending: 0,
      acknowledged: 0,
      critical: 0,
      warning: 0,
      info: 0,
    };

    alerts.forEach((alert) => {
      const level = String(
        alert.level || ''
      ).toLowerCase();

      if (alert.acknowledged) {
        result.acknowledged += 1;
      } else {
        result.pending += 1;
      }

      if (level === 'critical') {
        result.critical += 1;
      } else if (level === 'warning') {
        result.warning += 1;
      } else {
        result.info += 1;
      }
    });

    return result;
  }, [alerts]);

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

  const getAlertConfig = (level) => {
    const normalized = String(level || '').toLowerCase();

    if (normalized === 'critical') {
      return {
        icon: '🚨',
        name: 'ระดับวิกฤต',
        color: '#DC2626',
        background: '#FEF2F2',
        border: '#FECACA',
      };
    }

    if (normalized === 'warning') {
      return {
        icon: '⚠️',
        name: 'คำเตือน',
        color: '#D97706',
        background: '#FFFBEB',
        border: '#FDE68A',
      };
    }

    return {
      icon: 'ℹ️',
      name: 'ข้อมูลทั่วไป',
      color: '#2563EB',
      background: '#EFF6FF',
      border: '#BFDBFE',
    };
  };

  if (loading) {
    return (
      <Loading text="กำลังโหลดข้อมูลการแจ้งเตือน..." />
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>
            ศูนย์ติดตามเหตุการณ์
          </div>

          <h2 style={styles.title}>
            🔔 การแจ้งเตือน
          </h2>

          <p style={styles.subtitle}>
            ตรวจสอบและติดตามเหตุการณ์ที่เกิดขึ้นภายในระบบควบคุมคุณภาพ
          </p>
        </div>

        <button
          onClick={loadAlerts}
          style={styles.refreshButton}
        >
          ↻ รีเฟรชข้อมูล
        </button>
      </div>

      {/* Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            🔔
          </div>

          <div>
            <div style={styles.summaryLabel}>
              การแจ้งเตือนทั้งหมด
            </div>

            <div style={styles.summaryValue}>
              {summary.total}
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '4px solid #F59E0B',
          }}
        >
          <div style={styles.summaryIcon}>
            ⏳
          </div>

          <div>
            <div style={styles.summaryLabel}>
              รอการรับทราบ
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#D97706',
              }}
            >
              {summary.pending}
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '4px solid #16A34A',
          }}
        >
          <div style={styles.summaryIcon}>
            ✅
          </div>

          <div>
            <div style={styles.summaryLabel}>
              รับทราบแล้ว
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#15803D',
              }}
            >
              {summary.acknowledged}
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '4px solid #DC2626',
          }}
        >
          <div style={styles.summaryIcon}>
            🚨
          </div>

          <div>
            <div style={styles.summaryLabel}>
              ระดับวิกฤต
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#DC2626',
              }}
            >
              {summary.critical}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      ) : null}

      {/* Read Only */}
      {!canAcknowledge && (
        <div style={styles.readOnly}>
          <div style={{ fontSize: 24 }}>
            👁️
          </div>

          <div>
            <strong>โหมดดูข้อมูล</strong>

            <div style={{ marginTop: 4 }}>
              คุณสามารถดูข้อมูลการแจ้งเตือนได้
              แต่ไม่มีสิทธิ์รับทราบการแจ้งเตือน
            </div>
          </div>
        </div>
      )}

      {/* Alert Level Summary */}
      <div style={styles.levelRow}>
        <div style={styles.levelItem}>
          <span>🚨</span>
          <span>
            วิกฤต: <strong>{summary.critical}</strong>
          </span>
        </div>

        <div style={styles.levelItem}>
          <span>⚠️</span>
          <span>
            คำเตือน: <strong>{summary.warning}</strong>
          </span>
        </div>

        <div style={styles.levelItem}>
          <span>ℹ️</span>
          <span>
            ข้อมูล: <strong>{summary.info}</strong>
          </span>
        </div>
      </div>

      {/* Empty */}
      {alerts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            📭
          </div>

          <h3 style={{ marginBottom: 6 }}>
            ไม่มีการแจ้งเตือน
          </h3>

          <div>
            ขณะนี้ระบบไม่มีเหตุการณ์ที่ต้องดำเนินการ
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {alerts.map((alert) => {
            const config = getAlertConfig(
              alert.level
            );

            return (
              <div
                key={alert.id}
                style={{
                  ...styles.card,
                  borderLeft: `5px solid ${config.color}`,
                }}
              >
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.alertTitleWrap}>
                    <div
                      style={{
                        ...styles.alertIcon,
                        background: config.background,
                      }}
                    >
                      {config.icon}
                    </div>

                    <div>
                      <div style={styles.alertLevel}>
                        {config.name}
                      </div>

                      <div style={styles.date}>
                        🕒{' '}
                        {alert.created_at
                          ? new Date(
                              alert.created_at
                            ).toLocaleString('th-TH')
                          : '-'}
                      </div>
                    </div>
                  </div>

                  <StatusBadge
                    status={alert.level}
                  />
                </div>

                {/* Message */}
                <div
                  style={{
                    ...styles.messageBox,
                    background: config.background,
                    borderColor: config.border,
                  }}
                >
                  <div style={styles.messageLabel}>
                    รายละเอียดการแจ้งเตือน
                  </div>

                  <div style={styles.message}>
                    {alert.message}
                  </div>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                  <div>
                    {alert.acknowledged ? (
                      <div style={styles.acknowledged}>
                        <span style={styles.statusDot} />

                        รับทราบการแจ้งเตือนแล้ว
                      </div>
                    ) : (
                      <div style={styles.pending}>
                        <span
                          style={{
                            ...styles.statusDot,
                            background: '#F59E0B',
                          }}
                        />

                        รอการรับทราบ
                      </div>
                    )}
                  </div>

                  {!alert.acknowledged &&
                    canAcknowledge && (
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
                          : '✓ รับทราบ'}
                      </button>
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
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  hero: {
    background:
      'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
    borderRadius: 18,
    padding: '28px 30px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    boxShadow:
      '0 12px 30px rgba(15, 23, 42, 0.16)',
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#BFDBFE',
    marginBottom: 6,
  },

  title: {
    margin: 0,
    fontSize: 30,
  },

  subtitle: {
    margin: '8px 0 0',
    color: '#CBD5E1',
    lineHeight: 1.6,
  },

  refreshButton: {
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: 10,
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 16,
  },

  summaryCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.06)',
    borderTop: '4px solid #2563EB',
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 600,
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0F172A',
    marginTop: 4,
  },

  levelRow: {
    background: '#fff',
    borderRadius: 14,
    padding: '14px 18px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    boxShadow:
      '0 6px 18px rgba(15, 23, 42, 0.04)',
  },

  levelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#475569',
    fontSize: 14,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 18,
  },

  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px',
    boxShadow:
      '0 10px 28px rgba(15, 23, 42, 0.06)',
    transition: 'transform 0.2s ease',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  alertTitleWrap: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },

  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
  },

  alertLevel: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0F172A',
  },

  date: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 12,
  },

  messageBox: {
    marginTop: 20,
    padding: '14px',
    borderRadius: 12,
    border: '1px solid',
  },

  messageLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.06em',
    marginBottom: 6,
  },

  message: {
    color: '#334155',
    lineHeight: 1.65,
    fontSize: 14,
  },

  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  button: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: 9,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  acknowledged: {
    color: '#15803D',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 13,
  },

  pending: {
    color: '#92400E',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 13,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: '#16A34A',
    display: 'inline-block',
  },

  readOnly: {
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    color: '#1E40AF',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    lineHeight: 1.5,
  },

  error: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#B91C1C',
    padding: '13px 15px',
    borderRadius: 12,
    fontWeight: 600,
  },

  emptyState: {
    minHeight: 280,
    background: '#fff',
    border: '2px dashed #CBD5E1',
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#64748B',
    textAlign: 'center',
    padding: 30,
  },

  emptyIcon: {
    fontSize: 52,
    marginBottom: 10,
  },
};