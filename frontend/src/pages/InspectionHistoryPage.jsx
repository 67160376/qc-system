import { useEffect, useMemo, useState } from 'react';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function InspectionHistoryPage() {
  const [inspections, setInspections] = useState([]);
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingId, setCreatingId] = useState(null);
  const { hasRole } = useAuth();
  const canCreateNCR = hasRole(['ADMIN', 'QC']);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [inspectionData, ncrData] = await Promise.all([
        api.get('/inspections'),
        api.get('/ncrs'),
      ]);
      setInspections(inspectionData);
      setNcrs(ncrData);
    } catch (err) {
      setError(err.message || 'Unable to load inspection history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const existingNcrInspectionIds = useMemo(
    () => new Set(ncrs.map((ncr) => Number(ncr.related_inspection_id))),
    [ncrs]
  );

  const filteredInspections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return inspections.filter((inspection) => {
      const matchesTerm =
        !term ||
        inspection.lot_number?.toLowerCase().includes(term) ||
        inspection.product_name?.toLowerCase().includes(term) ||
        inspection.inspector_name?.toLowerCase().includes(term) ||
        String(inspection.id).includes(term);

      const matchesType = typeFilter === 'ALL' || inspection.inspection_type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || inspection.status === statusFilter;

      return matchesTerm && matchesType && matchesStatus;
    });
  }, [inspections, searchTerm, typeFilter, statusFilter]);

  const handleCreateNCR = async (inspection) => {
    if (!canCreateNCR || Number(inspection.failed_quantity) <= 0 || existingNcrInspectionIds.has(Number(inspection.id))) {
      return;
    }

    setCreatingId(inspection.id);
    setError('');
    setSuccess('');

    try {
      await api.post('/ncrs', {
        title: `NCR - ${inspection.lot_number}`,
        description: `Inspection ${inspection.lot_number} for ${inspection.product_name} recorded ${inspection.failed_quantity} failed units out of ${inspection.quantity}.`,
        related_inspection_id: inspection.id,
      });

      setSuccess(`NCR created for ${inspection.lot_number}.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to create NCR.');
    } finally {
      setCreatingId(null);
    }
  };

  if (loading) return <Loading text="Loading inspection history..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Inspection History</h2>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}
      {success ? <div style={styles.success}>{success}</div> : null}

      <div style={styles.filterBar}>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search lot, product, inspector..."
          style={styles.input}
        />

        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={styles.input}>
          <option value="ALL">All Types</option>
          <option value="Incoming">Incoming</option>
          <option value="In-process">In-process</option>
          <option value="Final">Final</option>
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.input}>
          <option value="ALL">All Status</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      <div style={styles.panel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Lot</th>
              <th>Product</th>
              <th>Type</th>
              <th>Inspector</th>
              <th>Qty</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInspections.map((inspection) => {
              const alreadyLinked = existingNcrInspectionIds.has(Number(inspection.id));
              const hasFailed = Number(inspection.failed_quantity) > 0;
              const actionDisabled = !canCreateNCR || !hasFailed || alreadyLinked || creatingId === inspection.id;

              return (
                <tr key={inspection.id}>
                  <td>{inspection.id}</td>
                  <td>{inspection.lot_number}</td>
                  <td>{inspection.product_name}</td>
                  <td>{inspection.inspection_type}</td>
                  <td>{inspection.inspector_name}</td>
                  <td>{inspection.quantity}</td>
                  <td>{inspection.passed_quantity}</td>
                  <td>{inspection.failed_quantity}</td>
                  <td>{inspection.status}</td>
                  <td>{new Date(inspection.created_at).toLocaleDateString()}</td>
                  <td>
                    {hasFailed && alreadyLinked ? (
                      <span style={styles.tag}>NCR exists</span>
                    ) : (
                      <button
                        onClick={() => handleCreateNCR(inspection)}
                        disabled={actionDisabled}
                        style={{
                          ...styles.actionButton,
                          ...(actionDisabled ? styles.actionButtonDisabled : {}),
                        }}
                      >
                        {creatingId === inspection.id ? 'Creating...' : (hasFailed ? 'Create NCR' : 'No fail')} 
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredInspections.length === 0 && (
          <div style={styles.emptyState}>No inspection records match your filters.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  filterBar: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1.5fr) repeat(2, minmax(120px, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  input: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '10px 12px',
    boxSizing: 'border-box',
    background: '#fff',
  },
  panel: {
    background: '#fff',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '980px',
  },
  actionButton: {
    border: 'none',
    background: '#DC2626',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  tag: {
    display: 'inline-block',
    padding: '5px 8px',
    borderRadius: '999px',
    background: '#E2E8F0',
    color: '#475569',
    fontSize: 12,
    fontWeight: 700,
  },
  error: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  success: {
    background: '#DCFCE7',
    color: '#166534',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  emptyState: {
    color: '#64748B',
    padding: '18px 0 0',
  },
};
