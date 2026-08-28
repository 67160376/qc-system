import { useEffect, useMemo, useState } from 'react';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const blankForm = {
  title: '',
  description: '',
  related_inspection_id: '',
  status: 'OPEN',
};

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
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูล NCR ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const candidateInspections = useMemo(
    () =>
      inspections.filter(
        (inspection) => Number(inspection.failed_quantity) > 0
      ),
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

    setForm({
      title: ncr.title,
      description: ncr.description,
      related_inspection_id: String(ncr.related_inspection_id),
      status: ncr.status || 'OPEN',
    });

    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canWrite) return;

    if (!form.title.trim()) {
      setError('กรุณากรอกหัวข้อ NCR');
      return;
    }

    if (!form.description.trim()) {
      setError('กรุณากรอกรายละเอียด NCR');
      return;
    }

    if (!form.related_inspection_id) {
      setError('กรุณาเลือกรายการตรวจสอบที่เกี่ยวข้อง');
      return;
    }

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
      setError('');

      loadData();
    } catch (err) {
      setError(err.message || 'ไม่สามารถบันทึกข้อมูล NCR ได้');
    }
  };

  if (loading) {
    return <Loading text="กำลังโหลดข้อมูล NCR..." />;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <h2 style={{ margin: 0 }}>
          ติดตามรายการ NCR
        </h2>

        {canWrite && (
          <button
            onClick={openCreate}
            style={styles.primaryButton}
          >
            + สร้าง NCR
          </button>
        )}
      </div>

      {!canWrite && (
        <div style={styles.readOnly}>
          คุณอยู่ในโหมดดูข้อมูลเท่านั้น เฉพาะผู้ใช้ ADMIN และ QC
          เท่านั้นที่สามารถสร้างหรือแก้ไข NCR ได้
        </div>
      )}

      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}

      <div style={styles.panel}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>รหัส NCR</th>
                <th style={styles.th}>หัวข้อ</th>
                <th style={styles.th}>รายการตรวจสอบที่เกี่ยวข้อง</th>
                <th style={styles.th}>สถานะ</th>
                <th style={styles.th}>วันที่สร้าง</th>

                {canWrite && (
                  <th style={styles.th}>
                    การจัดการ
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {ncrs.map((ncr) => (
                <tr key={ncr.id} style={styles.tr}>
                  <td style={styles.td}>
                    {ncr.id}
                  </td>

                  <td style={styles.td}>
                    {ncr.title}
                  </td>

                  <td style={styles.td}>
                    {ncr.lot_number || ncr.related_inspection_id}
                  </td>

                  <td style={styles.td}>
                    <StatusBadge status={ncr.status} />
                  </td>

                  <td style={styles.td}>
                    {new Date(
                      ncr.created_at
                    ).toLocaleDateString('th-TH')}
                  </td>

                  {canWrite && (
                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onClick={() => openEdit(ncr)}
                      >
                        แก้ไข
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {ncrs.length === 0 && (
            <div style={styles.emptyState}>
              ยังไม่มีรายการ NCR
            </div>
          )}
        </div>
      </div>

      {canWrite && (
        <Modal
          open={modalOpen}
          title={
            editingId
              ? 'แก้ไขข้อมูล NCR'
              : 'สร้างรายการ NCR'
          }
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div style={styles.fieldRow}>
              <label>
                หัวข้อ NCR
              </label>

              <input
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                style={styles.input}
                placeholder="กรอกหัวข้อ NCR"
              />
            </div>

            <div style={styles.fieldRow}>
              <label>
                รายละเอียด
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                style={{
                  ...styles.input,
                  minHeight: '90px',
                  resize: 'vertical',
                }}
                placeholder="กรอกรายละเอียดของปัญหา"
              />
            </div>

            <div style={styles.fieldRow}>
              <label>
                รายการตรวจสอบที่เกี่ยวข้อง
              </label>

              <select
                value={form.related_inspection_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    related_inspection_id: e.target.value,
                  })
                }
                style={styles.input}
              >
                <option value="">
                  เลือกรายการตรวจสอบที่พบปัญหา
                </option>

                {candidateInspections.map((inspection) => (
                  <option
                    key={inspection.id}
                    value={inspection.id}
                  >
                    {inspection.lot_number} -{' '}
                    {inspection.product_name}
                  </option>
                ))}
              </select>
            </div>

            {editingId && (
              <div style={styles.fieldRow}>
                <label>
                  สถานะ
                </label>

                <select
                  value={form.status || 'OPEN'}
                  onChange={(e) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: e.target.value,
                    }))
                  }
                  style={styles.input}
                >
                  <option value="OPEN">
                    เปิดรายการ
                  </option>

                  <option value="IN_PROGRESS">
                    กำลังดำเนินการ
                  </option>

                  <option value="CLOSED">
                    ปิดรายการ
                  </option>
                </select>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={styles.secondaryButton}
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
              >
                {editingId
                  ? 'บันทึกการเปลี่ยนแปลง'
                  : 'สร้าง NCR'}
              </button>
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
    minWidth: '750px',
  },

  th: {
    textAlign: 'left',
    padding: '12px',
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
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
    padding: '7px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  },

  input: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '10px 12px',
    boxSizing: 'border-box',
    marginTop: '6px',
    fontSize: 14,
    fontFamily: 'inherit',
  },

  fieldRow: {
    marginBottom: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '18px',
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
    textAlign: 'center',
    color: '#64748B',
    padding: '30px',
  },
};