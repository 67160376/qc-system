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
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      setSummary(summaryData);
      setInspections(inspectionData);
      setNcrs(ncrData);
      setAlerts(sortedAlerts.slice(0, 5));
    } catch (err) {
      setError(
        err.message ||
        'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestInspections = useMemo(() => {
    return inspections.slice(0, 6);
  }, [inspections]);

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

  if (loading) {
    return (
      <Loading text="กำลังโหลดข้อมูลแดชบอร์ด..." />
    );
  }

  const inspectionTypeLabel = {
    Incoming: 'ตรวจสอบวัตถุดิบ',
    'In-process': 'ตรวจสอบระหว่างการผลิต',
    Final: 'ตรวจสอบขั้นสุดท้าย',
  };

  const ncrStatusLabel = {
    OPEN: 'เปิด',
    IN_PROGRESS: 'กำลังดำเนินการ',
    CLOSED: 'ปิดแล้ว',
  };

  const dashboardCards = summary
    ? [
        {
          label: 'จำนวนสินค้าทั้งหมด',
          value: summary.total_products,
          icon: '📦',
          color: cardPalette.blue,
          description: 'รายการสินค้าในระบบ',
        },
        {
          label: 'การตรวจสอบทั้งหมด',
          value: summary.total_inspections,
          icon: '🔍',
          color: cardPalette.violet,
          description: 'รายการตรวจสอบทั้งหมด',
        },
        {
          label: 'จำนวนที่ตรวจสอบ',
          value: summary.total_quantity,
          icon: '📊',
          color: cardPalette.slate,
          description: 'จำนวนสินค้าที่ผ่านการตรวจ',
        },
        {
          label: 'ผ่านการตรวจสอบ',
          value: summary.total_passed_quantity,
          icon: '✅',
          color: cardPalette.green,
          description: 'สินค้าที่ผ่านมาตรฐาน',
        },
        {
          label: 'ไม่ผ่านการตรวจสอบ',
          value: summary.total_failed_quantity,
          icon: '❌',
          color: cardPalette.red,
          description: 'สินค้าที่ต้องตรวจสอบเพิ่มเติม',
        },
        {
          label: 'อัตราการผ่าน',
          value: `${summary.pass_rate}%`,
          icon: '📈',
          color:
            summary.pass_rate >= 95
              ? cardPalette.green
              : cardPalette.amber,
          description: 'ประสิทธิภาพด้านคุณภาพ',
        },
        {
          label: 'NCR ที่เปิดอยู่',
          value: summary.open_ncrs,
          icon: '⚠️',
          color: cardPalette.amber,
          description: 'รายการที่ต้องดำเนินการ',
        },
        {
          label: 'การแจ้งเตือน',
          value: summary.unacknowledged_alerts,
          icon: '🚨',
          color: cardPalette.red,
          description: 'รายการที่ยังไม่ได้รับทราบ',
        },
      ]
    : [];

  return (
    <div style={styles.page}>

      {/* Hero Banner */}
      <div style={styles.heroBanner}>
        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <div style={styles.heroBadge}>
              🏭 ระบบควบคุมคุณภาพการผลิต
            </div>

            <h1 style={styles.heroTitle}>
              แดชบอร์ดควบคุมคุณภาพ
            </h1>

            <p style={styles.heroDescription}>
              ติดตามสถานะการตรวจสอบสินค้า
              วิเคราะห์คุณภาพ และตรวจสอบปัญหา
              ในกระบวนการผลิตได้จากหน้าเดียว
            </p>

            <div style={styles.heroStats}>
              <div>
                <strong>
                  {summary?.total_inspections || 0}
                </strong>
                <span>การตรวจสอบ</span>
              </div>

              <div>
                <strong>
                  {summary?.pass_rate || 0}%
                </strong>
                <span>อัตราการผ่าน</span>
              </div>

              <div>
                <strong>
                  {summary?.open_ncrs || 0}
                </strong>
                <span>NCR ที่เปิดอยู่</span>
              </div>
            </div>
          </div>

          <div style={styles.heroIllustration}>
            <div style={styles.factoryIcon}>
              🏭
            </div>

            <div style={styles.qualityIcon}>
              ✓
            </div>

            <div style={styles.chartIcon}>
              📈
            </div>

            <div style={styles.inspectionIcon}>
              🔍
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>
            ภาพรวมการดำเนินงาน
          </p>

          <h2 style={{ margin: 0 }}>
            สรุปข้อมูลระบบ
          </h2>
        </div>

        <button
          onClick={loadData}
          style={styles.refreshButton}
        >
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {/* Error */}
      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div style={styles.grid}>
        {dashboardCards.map((item) => (
          <div
            key={item.label}
            style={{
              ...styles.card,
              borderTop:
                `4px solid ${item.color}`,
            }}
          >
            <div style={styles.cardTop}>
              <div
                style={{
                  ...styles.cardIcon,
                  background:
                    `${item.color}15`,
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  ...styles.cardDot,
                  background: item.color,
                }}
              />
            </div>

            <div style={styles.cardValue}>
              {item.value}
            </div>

            <div style={styles.cardLabel}>
              {item.label}
            </div>

            <div style={styles.cardDescription}>
              {item.description}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div style={styles.analyticsRow}>

        {/* Quality Performance */}
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelSubtitle}>
                QUALITY PERFORMANCE
              </p>

              <h3 style={{ margin: 0 }}>
                ประสิทธิภาพด้านคุณภาพ
              </h3>
            </div>

            <span style={styles.qualityScore}>
              {summary
                ? `${summary.pass_rate}%`
                : '0%'}
            </span>
          </div>

          <div style={styles.progressWrap}>
            <div
              style={{
                ...styles.progressBar,
                width: `${qualityProgress}%`,
                background:
                  qualityProgress >= 95
                    ? '#16A34A'
                    : '#F59E0B',
              }}
            />
          </div>

          <div style={styles.progressMeta}>
            <span>
              <span style={styles.greenDot} />
              ผ่านการตรวจสอบ
            </span>

            <strong>
              {summary
                ? `${summary.total_passed_quantity} / ${summary.total_quantity}`
                : '0 / 0'}
            </strong>
          </div>

          <div style={styles.progressMeta}>
            <span>
              <span style={styles.redDot} />
              ไม่ผ่านการตรวจสอบ
            </span>

            <strong>
              {summary
                ? summary.total_failed_quantity
                : 0}
            </strong>
          </div>
        </div>

        {/* QC Summary */}
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelSubtitle}>
                INSPECTION OVERVIEW
              </p>

              <h3 style={{ margin: 0 }}>
                สรุปตามประเภท QC
              </h3>
            </div>
          </div>

          <div style={styles.legendList}>
            {qcTypeSummary.map((entry) => {
              const color =
                entry.type === 'Incoming'
                  ? '#2563EB'
                  : entry.type === 'In-process'
                  ? '#7C3AED'
                  : '#16A34A';

              return (
                <div
                  key={entry.type}
                  style={styles.legendItem}
                >
                  <div style={styles.legendLeft}>
                    <span
                      style={{
                        ...styles.legendDot,
                        background: color,
                      }}
                    />

                    <span>
                      {inspectionTypeLabel[
                        entry.type
                      ] || entry.type}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.metricValue,
                      color,
                    }}
                  >
                    {entry.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NCR Summary */}
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelSubtitle}>
                NCR STATUS
              </p>

              <h3 style={{ margin: 0 }}>
                สถานะรายงาน NCR
              </h3>
            </div>
          </div>

          <div style={styles.legendList}>
            {ncrStatusSummary.map((entry) => {
              const color =
                entry.status === 'OPEN'
                  ? '#F59E0B'
                  : entry.status ===
                    'IN_PROGRESS'
                  ? '#2563EB'
                  : '#16A34A';

              return (
                <div
                  key={entry.status}
                  style={styles.legendItem}
                >
                  <div style={styles.legendLeft}>
                    <span
                      style={{
                        ...styles.legendDot,
                        background: color,
                      }}
                    />

                    <span>
                      {ncrStatusLabel[
                        entry.status
                      ] || entry.status}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.metricValue,
                      color,
                    }}
                  >
                    {entry.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Data */}
      <div style={styles.bottomGrid}>

        {/* Recent Inspections */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelSubtitle}>
                RECENT ACTIVITY
              </p>

              <h3 style={{ margin: 0 }}>
                รายการตรวจสอบล่าสุด
              </h3>
            </div>

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
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 700,
                      }}
                    >
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
                      ).toLocaleDateString(
                        'th-TH'
                      )}
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
            <div>
              <p style={styles.panelSubtitle}>
                ALERT CENTER
              </p>

              <h3 style={{ margin: 0 }}>
                การแจ้งเตือนล่าสุด
              </h3>
            </div>

            <span style={styles.mutedTag}>
              {alerts.length} รายการ
            </span>
          </div>

          {alerts.length === 0 ? (
            <div style={styles.emptyAlertState}>
              <div style={{ fontSize: 40 }}>
                📭
              </div>

              <strong>
                ไม่มีการแจ้งเตือน
              </strong>

              <div style={{ marginTop: 6 }}>
                ขณะนี้ระบบไม่มีการแจ้งเตือน
                ที่ต้องดำเนินการ
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
                      marginTop: 14,
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
                        fontSize: 13,
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
    gap: 24,
  },

  heroBanner: {
    position: 'relative',
    minHeight: 300,
    borderRadius: '22px',
    overflow: 'hidden',
    background:
      'linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #2563EB 100%)',
    boxShadow:
      '0 20px 40px rgba(15, 23, 42, 0.18)',
  },

  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15), transparent 35%)',
  },

  heroContent: {
    position: 'relative',
    zIndex: 1,
    minHeight: 300,
    padding: '36px 42px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 30,
    color: '#fff',
  },

  heroText: {
    maxWidth: 620,
  },

  heroBadge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.14)',
    border:
      '1px solid rgba(255,255,255,0.2)',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 18,
  },

  heroTitle: {
    margin: 0,
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },

  heroDescription: {
    marginTop: 14,
    marginBottom: 26,
    color: '#DBEAFE',
    lineHeight: 1.7,
    maxWidth: 600,
  },

  heroStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 28,
  },

  heroIllustration: {
    position: 'relative',
    width: 240,
    height: 220,
    flexShrink: 0,
  },

  factoryIcon: {
    position: 'absolute',
    fontSize: 120,
    right: 30,
    top: 45,
    filter:
      'drop-shadow(0 12px 20px rgba(0,0,0,0.25))',
  },

  qualityIcon: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: '#16A34A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    fontWeight: 800,
    top: 20,
    left: 20,
    boxShadow:
      '0 8px 18px rgba(0,0,0,0.2)',
  },

  chartIcon: {
    position: 'absolute',
    fontSize: 42,
    bottom: 20,
    left: 10,
  },

  inspectionIcon: {
    position: 'absolute',
    fontSize: 38,
    right: 0,
    top: 10,
  },

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  eyebrow: {
    margin: 0,
    color: '#64748B',
    letterSpacing: '0.08em',
    fontSize: 11,
    fontWeight: 800,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 18,
  },

  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '18px',
    minHeight: 145,
    boxShadow:
      '0 10px 25px rgba(15, 23, 42, 0.06)',
    transition: 'transform 0.2s ease',
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 23,
  },

  cardDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },

  cardValue: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: 800,
    color: '#0F172A',
  },

  cardLabel: {
    marginTop: 6,
    fontWeight: 700,
    color: '#334155',
  },

  cardDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
  },

  analyticsRow: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 20,
  },

  qualityPanel: {
    background: '#fff',
    borderRadius: '16px',
    padding: 20,
    boxShadow:
      '0 10px 25px rgba(15, 23, 42, 0.05)',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },

  panelSubtitle: {
    margin: '0 0 5px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#94A3B8',
  },

  qualityScore: {
    background: '#DCFCE7',
    color: '#15803D',
    padding: '7px 10px',
    borderRadius: '10px',
    fontSize: 13,
    fontWeight: 800,
  },

  mutedTag: {
    background: '#F1F5F9',
    color: '#475569',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 700,
  },

  progressWrap: {
    height: 14,
    width: '100%',
    background: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 18,
  },

  progressBar: {
    height: '100%',
    borderRadius: 999,
  },

  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#475569',
    fontSize: 13,
    marginBottom: 12,
  },

  greenDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#16A34A',
    marginRight: 7,
  },

  redDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#DC2626',
    marginRight: 7,
  },

  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F1F5F9',
  },

  legendLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontWeight: 600,
    color: '#334155',
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },

  metricValue: {
    fontWeight: 800,
    fontSize: 18,
  },

  bottomGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0, 1.6fr) minmax(320px, 1fr)',
    gap: 20,
  },

  panel: {
    background: '#fff',
    borderRadius: '16px',
    padding: 20,
    boxShadow:
      '0 10px 25px rgba(15, 23, 42, 0.05)',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    minWidth: 760,
  },

  th: {
    textAlign: 'left',
    padding: '12px',
    color: '#64748B',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.04em',
    background: '#F8FAFC',
    borderBottom:
      '1px solid #E2E8F0',
  },

  tr: {
    borderBottom:
      '1px solid #F1F5F9',
  },

  td: {
    padding: '14px 12px',
    color: '#334155',
    verticalAlign: 'middle',
  },

  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  alertBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: 15,
  },

  emptyAlertState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#64748B',
    minHeight: 220,
    background: '#F8FAFC',
    border:
      '1px dashed #CBD5E1',
    borderRadius: '14px',
    padding: 20,
  },

  refreshButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '10px',
    padding: '11px 17px',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow:
      '0 6px 15px rgba(37, 99, 235, 0.2)',
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
    padding: '12px 14px',
    borderRadius: '10px',
  },
};