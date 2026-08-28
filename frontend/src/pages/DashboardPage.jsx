import { useEffect, useMemo, useState } from 'react';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const cardPalette = {
  blue: '#2563EB',
  violet: '#7C3AED',
  slate: '#475569',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#F59E0B',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [ncrs, setNcrs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();

  const canAcknowledge = hasRole(['ADMIN', 'QC']);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryData, inspectionData, ncrData, alertData] =
        await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/inspections'),
          api.get('/ncrs'),
          api.get('/alerts'),
        ]);

      const sortedAlerts = [...alertData].sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );

      setSummary(summaryData);
      setInspections(inspectionData);
      setNcrs(ncrData);
      setAlerts(sortedAlerts.slice(0, 5));
    } catch (err) {
      setError(
        err.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
      );
    } finally {
      setLoading(false);
    }
  };

  const latestInspections = useMemo(
    () => inspections.slice(0, 6),
    [inspections]
  );

  const qualityProgress = useMemo(() => {
    if (!summary) return 0;

    return Math.min(
      100,
      Number(summary.pass_rate || 0)
    );
  }, [summary]);

  const qcTypeSummary = useMemo(() => {
    const totals = {
      Incoming: 0,
      'In-process': 0,
      Final: 0,
    };

    inspections.forEach((inspection) => {
      const key = inspection.inspection_type;

      if (totals[key] !== undefined) {
        totals[key] += 1;
      }
    });

    return Object.entries(totals).map(
      ([type, count]) => ({
        type,
        count,
      })
    );
  }, [inspections]);

  const ncrStatusSummary = useMemo(() => {
    const totals = {
      OPEN: 0,
      IN_PROGRESS: 0,
      CLOSED: 0,
    };

    ncrs.forEach((ncr) => {
      if (totals[ncr.status] !== undefined) {
        totals[ncr.status] += 1;
      }
    });

    return Object.entries(totals).map(
      ([status, count]) => ({
        status,
        count,
      })
    );
  }, [ncrs]);

  const handleAcknowledge = async (id) => {
    if (!canAcknowledge) return;

    try {
      await api.put(
        `/alerts/${id}/acknowledge`,
        {}
      );

      loadData();
    } catch (err) {
      setError(
        err.message ||
          'ไม่สามารถรับทราบการแจ้งเตือนได้'
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Loading text="กำลังโหลดข้อมูล Dashboard..." />
    );
  }

  const inspectionTypeLabel = {
    Incoming: 'ตรวจสอบวัตถุดิบ',
    'In-process': 'ตรวจสอบระหว่างผลิต',
    Final: 'ตรวจสอบขั้นสุดท้าย',
  };

  const ncrStatusLabel = {
    OPEN: 'เปิด',
    IN_PROGRESS: 'กำลังดำเนินการ',
    CLOSED: 'ปิดแล้ว',
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>
            ภาพรวมการดำเนินงาน
          </p>

          <h2 style={{ margin: 0 }}>
            แดชบอร์ด
          </h2>
        </div>

        <button
          onClick={loadData}
          style={styles.refreshButton}
        >
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Error */}
      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}

      {/* Summary Cards */}
      <div style={styles.grid}>
        {summary &&
          [
            {
              label: 'จำนวนสินค้าทั้งหมด',
              value: summary.total_products,
              icon: '📦',
              color: cardPalette.blue,
            },
            {
              label: 'จำนวนการตรวจสอบทั้งหมด',
              value: summary.total_inspections,
              icon: '🔎',
              color: cardPalette.violet,
            },
            {
              label: 'จำนวนสินค้าที่ตรวจสอบ',
              value: summary.total_quantity,
              icon: '📊',
              color: cardPalette.slate,
            },
            {
              label: 'จำนวนที่ผ่านการตรวจสอบ',
              value: summary.total_passed_quantity,
              icon: '✅',
              color: cardPalette.green,
            },
            {
              label: 'จำนวนที่ไม่ผ่านการตรวจสอบ',
              value: summary.total_failed_quantity,
              icon: '❌',
              color: cardPalette.red,
            },
            {
              label: 'อัตราการผ่าน',
              value: `${summary.pass_rate}%`,
              icon: '📈',
              color:
                summary.pass_rate >= 95
                  ? cardPalette.green
                  : cardPalette.amber,
            },
            {
              label: 'NCR ที่ยังเปิดอยู่',
              value: summary.open_ncrs,
              icon: '⚠️',
              color: cardPalette.amber,
            },
            {
              label: 'การแจ้งเตือนที่ยังไม่ได้รับทราบ',
              value: summary.unacknowledged_alerts,
              icon: '🚨',
              color: cardPalette.red,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...styles.card,
                borderTop: `4px solid ${item.color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    color: '#64748B',
                    fontSize: 12,
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </span>

                <span style={{ fontSize: 23 }}>
                  {item.icon}
                </span>
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  marginTop: 12,
                  letterSpacing: '-0.04em',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
      </div>

      {/* Analytics */}
      <div style={styles.analyticsRow}>
        {/* Quality Performance */}
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>
              ประสิทธิภาพด้านคุณภาพ
            </h3>

            <span style={styles.mutedTag}>
              {summary
                ? `${summary.pass_rate}%`
                : '0%'}
            </span>
          </div>

          <div style={styles.progressWrap}>
            <div
              style={{
                width: `${qualityProgress}%`,
                background:
                  qualityProgress >= 95
                    ? '#16A34A'
                    : '#F59E0B',
                ...styles.progressBar,
              }}
            />
          </div>

          <div style={styles.progressMeta}>
            <span>ผ่านการตรวจสอบ</span>

            <span>
              {summary
                ? `${summary.total_passed_quantity} / ${summary.total_quantity}`
                : '0 / 0'}
            </span>
          </div>

          <div style={styles.progressMeta}>
            <span>ไม่ผ่านการตรวจสอบ</span>

            <span>
              {summary
                ? summary.total_failed_quantity
                : 0}
            </span>
          </div>
        </div>

        {/* Inspection Summary */}
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>
              สรุปการตรวจสอบตามประเภท QC
            </h3>
          </div>

          <div style={styles.legendList}>
            {qcTypeSummary.map((entry) => (
              <div
                key={entry.type}
                style={styles.legendItem}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background:
                        entry.type === 'Incoming'
                          ? '#2563EB'
                          : entry.type ===
                            'In-process'
                          ? '#7C3AED'
                          : '#16A34A',
                      display: 'inline-block',
                    }}
                  />

                  <span style={{ fontWeight: 700 }}>
                    {inspectionTypeLabel[
                      entry.type
                    ] || entry.type}
                  </span>
                </div>

                <span style={styles.metricValue}>
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* NCR Summary */}
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>
              สรุปสถานะ NCR
            </h3>
          </div>

          <div style={styles.legendList}>
            {ncrStatusSummary.map((entry) => (
              <div
                key={entry.status}
                style={styles.legendItem}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background:
                        entry.status === 'OPEN'
                          ? '#F59E0B'
                          : entry.status ===
                            'IN_PROGRESS'
                          ? '#2563EB'
                          : '#16A34A',
                      display: 'inline-block',
                    }}
                  />

                  <span style={{ fontWeight: 700 }}>
                    {ncrStatusLabel[
                      entry.status
                    ] || entry.status}
                  </span>
                </div>

                <span style={styles.metricValue}>
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Data */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 20,
          marginTop: 28,
        }}
      >
        {/* Recent Inspections */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>
              รายการตรวจสอบล่าสุด
            </h3>

            <span style={styles.mutedTag}>
              {latestInspections.length} รายการ
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    หมายเลขล็อต
                  </th>

                  <th style={styles.th}>
                    สินค้า
                  </th>

                  <th style={styles.th}>
                    ประเภท QC
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: 'right',
                    }}
                  >
                    จำนวน
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: 'right',
                    }}
                  >
                    ผ่าน
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: 'right',
                    }}
                  >
                    ไม่ผ่าน
                  </th>

                  <th style={styles.th}>
                    สถานะ
                  </th>

                  <th style={styles.th}>
                    วันที่
                  </th>
                </tr>
              </thead>

              <tbody>
                {latestInspections.map((item) => (
                  <tr
                    key={item.id}
                    style={styles.tr}
                  >
                    <td style={styles.td}>
                      {item.lot_number}
                    </td>

                    <td style={styles.td}>
                      {item.product_name ||
                        item.product_id}
                    </td>

                    <td style={styles.td}>
                      {inspectionTypeLabel[
                        item.inspection_type
                      ] || item.inspection_type}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: 'right',
                        fontWeight: 700,
                      }}
                    >
                      {item.quantity}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: 'right',
                        color: '#16A34A',
                        fontWeight: 700,
                      }}
                    >
                      {item.passed_quantity}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        textAlign: 'right',
                        color: '#DC2626',
                        fontWeight: 700,
                      }}
                    >
                      {item.failed_quantity}
                    </td>

                    <td style={styles.td}>
                      <StatusBadge
                        status={item.status}
                      />
                    </td>

                    <td style={styles.td}>
                      {new Date(
                        item.created_at
                      ).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>
              การแจ้งเตือนล่าสุด
            </h3>

            <span style={styles.mutedTag}>
              แสดง {alerts.length} รายการ
            </span>
          </div>

          {alerts.length === 0 ? (
            <div style={styles.emptyAlertState}>
              <div style={{ fontSize: 28 }}>
                📭
              </div>

              <strong>
                ไม่มีการแจ้งเตือน
              </strong>

              <div style={{ marginTop: 6 }}>
                ขณะนี้ระบบไม่มีการแจ้งเตือนที่ต้องดำเนินการ
              </div>
            </div>
          ) : (
            <div style={styles.alertList}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={styles.alertBox}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        {alert.message}
                      </div>

                      <div
                        style={{
                          color: '#64748B',
                          fontSize: 12,
                        }}
                      >
                        {new Date(
                          alert.created_at
                        ).toLocaleString('th-TH')}
                      </div>
                    </div>

                    <StatusBadge
                      status={alert.level}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        color: alert.acknowledged
                          ? '#15803D'
                          : '#64748B',
                        fontWeight: 600,
                      }}
                    >
                      {alert.acknowledged
                        ? '✓ รับทราบแล้ว'
                        : 'รอการรับทราบ'}
                    </span>

                    {!alert.acknowledged &&
                      canAcknowledge && (
                        <button
                          style={styles.ackButton}
                          onClick={() =>
                            handleAcknowledge(
                              alert.id
                            )
                          }
                        >
                          รับทราบ
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },

  eyebrow: {
    margin: 0,
    color: '#64748B',
    letterSpacing: '0.08em',
    fontSize: 11,
    fontWeight: 700,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 18,
  },

  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px 18px 16px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
    minHeight: 120,
  },

  analyticsRow: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 20,
    marginTop: 4,
  },

  qualityPanel: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px 18px 16px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  mutedTag: {
    background: '#F1F5F9',
    color: '#475569',
    borderRadius: '999px',
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 700,
  },

  progressWrap: {
    height: 14,
    width: '100%',
    background: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    margin: '16px 0 12px',
  },

  progressBar: {
    height: '100%',
    borderRadius: 999,
  },

  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#475569',
    fontSize: 13,
    marginBottom: 8,
  },

  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },

  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid #E2E8F0',
  },

  metricValue: {
    fontWeight: 700,
    color: '#0F172A',
  },

  panel: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    minWidth: '760px',
  },

  th: {
    textAlign: 'left',
    padding: '10px 12px',
    color: '#475569',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    borderBottom: '1px solid #E2E8F0',
  },

  tr: {
    borderBottom: '1px solid #F1F5F9',
  },

  td: {
    padding: '12px',
    color: '#0F172A',
    verticalAlign: 'middle',
  },

  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },

  alertBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px',
  },

  emptyAlertState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#64748B',
    minHeight: 180,
    background: '#F8FAFC',
    border: '1px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '20px',
  },

  refreshButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  ackButton: {
    border: 'none',
    background: '#DC2626',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  error: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '4px',
  },
};