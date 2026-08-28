import { useEffect, useMemo, useState } from 'react';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const blankForm = { title: '', description: '', related_inspection_id: '', status: 'OPEN' };

export default function NCRPage() {
  const [ncrs, setNcrs] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();
  const canWrite = hasRole(['ADMIN', 'QC']);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ncrData, inspectionData] = await Promise.all([
        api.get('/ncrs'),
        api.get('/inspections'),
      ]);
      setNcrs(ncrData);
      setInspections(inspectionData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const candidateInspections = useMemo(
    () => inspections.filter((inspection) => Number(inspection.failed_quantity) > 0),
    [inspections]
  );

  const openCreate = () => {
    if (!canWrite) return;
    setEditingId(null);
    setForm(blankForm);
    setModalOpen(true);
  };

  const openEdit = (ncr) => {
    if (!canWrite) return;
    setEditingId(ncr.id);
    setForm({ title: ncr.title, description: ncr.description, related_inspection_id: String(ncr.related_inspection_id), status: ncr.status || 'OPEN' });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    const payload = {
      ...form,
      related_inspection_id: Number(form.related_inspection_id),
      status: form.status || 'OPEN',
    };

    try {
      if (editingId) {
        await api.put(`/ncrs/${editingId}`, payload);
      } else {
        await api.post('/ncrs', payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Unable to save NCR.');
    }
  };

  if (loading) return <Loading text="Loading NCR tracking..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>NCR Tracking</h2>
        {canWrite && <button onClick={openCreate} style={styles.primaryButton}>+ Create NCR</button>}
      </div>

      {!canWrite && <div style={styles.readOnly}>Read-only access: only ADMIN and QC can create or update NCRs.</div>}
      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.panel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>NCR ID</th>
              <th>Title</th>
              <th>Related Inspection</th>
              <th>Status</th>
              <th>Created Date</th>
              {canWrite && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {ncrs.map((ncr) => (
              <tr key={ncr.id}>
                <td>{ncr.id}</td>
                <td>{ncr.title}</td>
                <td>{ncr.lot_number || ncr.related_inspection_id}</td>
                <td><StatusBadge status={ncr.status} /></td>
                <td>{new Date(ncr.created_at).toLocaleDateString()}</td>
                {canWrite && (
                  <td>
                    <button style={styles.actionButton} onClick={() => openEdit(ncr)}>Edit</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canWrite && (
        <Modal open={modalOpen} title={editingId ? 'Edit NCR' : 'Create NCR'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div style={styles.fieldRow}>
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} />
            </div>

            <div style={styles.fieldRow}>
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: '90px' }} />
            </div>

            <div style={styles.fieldRow}>
              <label>Related Inspection</label>
              <select value={form.related_inspection_id} onChange={(e) => setForm({ ...form, related_inspection_id: e.target.value })} style={styles.input}>
                <option value="">Select failed inspection</option>
                {candidateInspections.map((inspection) => (
                  <option key={inspection.id} value={inspection.id}>{inspection.lot_number} - {inspection.product_name}</option>
                ))}
              </select>
            </div>

            {editingId && (
              <div style={styles.fieldRow}>
                <label>Status</label>
                <select
                  value={form.status || 'OPEN'}
                  onChange={(e) => setForm((currentForm) => ({ ...currentForm, status: e.target.value }))}
                  style={styles.input}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button type="button" onClick={() => setModalOpen(false)} style={styles.secondaryButton}>Cancel</button>
              <button type="submit" style={styles.primaryButton}>{editingId ? 'Save Changes' : 'Create NCR'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  panel: {
    background: '#fff',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  primaryButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryButton: {
    border: 'none',
    background: '#E2E8F0',
    color: '#0F172A',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  actionButton: {
    border: 'none',
    background: '#DBEAFE',
    color: '#1D4ED8',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '10px 12px',
    boxSizing: 'border-box',
    marginTop: '6px',
  },
  fieldRow: {
    marginBottom: '14px',
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
};
