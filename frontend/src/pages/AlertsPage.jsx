import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();
  const canAcknowledge = hasRole(['ADMIN', 'QC']);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/alerts');
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const acknowledge = async (id) => {
    if (!canAcknowledge) return;
    try {
      await api.put(`/alerts/${id}/acknowledge`, {});
      loadAlerts();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <Loading text="Loading alerts..." />;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>Alerts</h2>
      {!canAcknowledge && <div style={styles.readOnly}>Read-only access: only ADMIN and QC can acknowledge alerts.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
        {alerts.map((alert) => (
          <div key={alert.id} style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '18px',
            borderTop: `4px solid ${alert.level === 'critical' ? '#DC2626' : alert.level === 'warning' ? '#F59E0B' : '#2563EB'}`,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>{alert.level.toUpperCase()} Alert</h4>
              <StatusBadge status={alert.level} />
            </div>
            <p style={{ color: '#475569', margin: '18px 0' }}>{alert.message}</p>
            {alert.acknowledged ? (
              <div style={{ color: '#15803D', fontWeight: 700 }}>✓ Acknowledged</div>
            ) : canAcknowledge ? (
              <button style={styles.button} onClick={() => acknowledge(alert.id)}>Acknowledge</button>
            ) : (
              <div style={{ color: '#64748B', fontWeight: 600 }}>Pending acknowledgement</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  button: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  readOnly: {
    background: '#F1F5F9',
    color: '#475569',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};
