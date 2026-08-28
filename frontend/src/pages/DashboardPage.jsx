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
      const [summaryData, inspectionData, ncrData, alertData] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/inspections'),
        api.get('/ncrs'),
        api.get('/alerts'),
      ]);

      const sortedAlerts = [...alertData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setSummary(summaryData);
      setInspections(inspectionData);
      setNcrs(ncrData);
      setAlerts(sortedAlerts.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const latestInspections = useMemo(() => inspections.slice(0, 6), [inspections]);

  const qualityProgress = useMemo(() => {
    if (!summary) return 0;
    return Math.min(100, Number(summary.pass_rate || 0));
  }, [summary]);

  const qcTypeSummary = useMemo(() => {
    const totals = { Incoming: 0, 'In-process': 0, Final: 0 };

    inspections.forEach((inspection) => {
      const key = inspection.inspection_type;
      if (totals[key] !== undefined) {
        totals[key] += 1;
      }
    });

    return Object.entries(totals).map(([type, count]) => ({ type, count }));
  }, [inspections]);

  const ncrStatusSummary = useMemo(() => {
    const totals = { OPEN: 0, IN_PROGRESS: 0, CLOSED: 0 };

    ncrs.forEach((ncr) => {
      if (totals[ncr.status] !== undefined) {
        totals[ncr.status] += 1;
      }
    });

    return Object.entries(totals).map(([status, count]) => ({ status, count }));
  }, [ncrs]);

  const handleAcknowledge = async (id) => {
    if (!canAcknowledge) return;
    try {
      await api.put(`/alerts/${id}/acknowledge`, {});
      loadData();
    } catch (err) {
      setError(err.message || 'Unable to acknowledge alert.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>Operations overview</p>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
        </div>
        <button onClick={loadData} style={styles.refreshButton}>Refresh</button>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.grid}>
        {summary && [
          { label: 'Total Products', value: summary.total_products, icon: '📦', color: cardPalette.blue },
          { label: 'Total Inspections', value: summary.total_inspections, icon: '🔎', color: cardPalette.violet },
          { label: 'Total Quantity Checked', value: summary.total_quantity, icon: '📊', color: cardPalette.slate },
          { label: 'Total Passed Quantity', value: summary.total_passed_quantity, icon: '✅', color: cardPalette.green },
          { label: 'Total Failed Quantity', value: summary.total_failed_quantity, icon: '❌', color: cardPalette.red },
          { label: 'Pass Rate', value: `${summary.pass_rate}%`, icon: '📈', color: summary.pass_rate >= 95 ? cardPalette.green : cardPalette.amber },
          { label: 'Open NCR', value: summary.open_ncrs, icon: '⚠', color: cardPalette.amber },
          { label: 'Unacknowledged Alerts', value: summary.unacknowledged_alerts, icon: '🚨', color: cardPalette.red },
        ].map((item) => (
          <div key={item.label} style={{ ...styles.card, borderTop: `4px solid ${item.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</span>
              <span style={{ fontSize: 23 }}>{item.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 12, letterSpacing: '-0.04em' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.analyticsRow}>
        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>Quality Performance</h3>
            <span style={styles.mutedTag}>{summary ? `${summary.pass_rate}%` : '0%'}</span>
          </div>
          <div style={styles.progressWrap}>
            <div style={{ width: `${qualityProgress}%`, background: qualityProgress >= 95 ? '#16A34A' : '#F59E0B', ...styles.progressBar }} />
          </div>
          <div style={styles.progressMeta}>
            <span>Passed</span>
            <span>{summary ? `${summary.total_passed_quantity} / ${summary.total_quantity}` : '0 / 0'}</span>
          </div>
          <div style={styles.progressMeta}>
            <span>Failed</span>
            <span>{summary ? summary.total_failed_quantity : 0}</span>
          </div>
        </div>

        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>Inspection Summary by QC Type</h3>
          </div>
          <div style={styles.legendList}>
            {qcTypeSummary.map((entry) => (
              <div key={entry.type} style={styles.legendItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: entry.type === 'Incoming' ? '#2563EB' : entry.type === 'In-process' ? '#7C3AED' : '#16A34A',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontWeight: 700 }}>{entry.type}</span>
                </div>
                <span style={styles.metricValue}>{entry.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.qualityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>NCR Status Summary</h3>
          </div>
          <div style={styles.legendList}>
            {ncrStatusSummary.map((entry) => (
              <div key={entry.status} style={styles.legendItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: entry.status === 'OPEN' ? '#F59E0B' : entry.status === 'IN_PROGRESS' ? '#2563EB' : '#16A34A',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontWeight: 700 }}>{entry.status}</span>
                </div>
                <span style={styles.metricValue}>{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginTop: 28 }}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>Recent Inspections</h3>
            <span style={styles.mutedTag}>{latestInspections.length} items</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Lot Number</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>QC Type</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Qty</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Passed</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Failed</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {latestInspections.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>{item.lot_number}</td>
                    <td style={styles.td}>{item.product_name || item.product_id}</td>
                    <td style={styles.td}>{item.inspection_type}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{item.quantity}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#16A34A', fontWeight: 700 }}>{item.passed_quantity}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#DC2626', fontWeight: 700 }}>{item.failed_quantity}</td>
                    <td style={styles.td}><StatusBadge status={item.status} /></td>
                    <td style={styles.td}>{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={{ margin: 0 }}>Recent Alerts</h3>
            <span style={styles.mutedTag}>{alerts.length} shown</span>
          </div>

          {alerts.length === 0 ? (
            <div style={styles.emptyAlertState}>
              <div style={{ fontSize: 28 }}>📭</div>
              <strong>No alerts available</strong>
              <div style={{ marginTop: 6 }}>System is currently clear. No operational alerts to review.</div>
            </div>
          ) : (
            <div style={styles.alertList}>
              {alerts.map((alert) => (
                <div key={alert.id} style={styles.alertBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{alert.message}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>{new Date(alert.created_at).toLocaleString()}</div>
                    </div>
                    <StatusBadge status={alert.level} />
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: alert.acknowledged ? '#15803D' : '#64748B', fontWeight: 600 }}>
                      {alert.acknowledged ? '✓ Acknowledged' : 'Pending acknowledgement'}
                    </span>
                    {!alert.acknowledged && canAcknowledge && (
                      <button style={styles.ackButton} onClick={() => handleAcknowledge(alert.id)}>Acknowledge</button>
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
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: 11,
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 18,
  },
  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px 18px 16px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
    minHeight: 120,
  },
  analyticsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 20,
    marginTop: 4,
  },
  qualityPanel: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px 18px 16px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
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
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
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
    textTransform: 'uppercase',
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
