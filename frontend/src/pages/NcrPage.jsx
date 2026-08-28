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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
        (inspection) =>
          Number(inspection.failed_quantity) > 0
      ),
    [inspections]
  );

  const filteredNcrs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return ncrs.filter((ncr) => {
      const matchesSearch =
        !term ||
        String(ncr.id).includes(term) ||
        ncr.title?.toLowerCase().includes(term) ||
        ncr.lot_number?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'ALL' ||
        ncr.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [ncrs, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: ncrs.length,
      open: ncrs.filter(
        (ncr) => ncr.status === 'OPEN'
      ).length,
      progress: ncrs.filter(
        (ncr) => ncr.status === 'IN_PROGRESS'
      ).length,
      closed: ncrs.filter(
        (ncr) => ncr.status === 'CLOSED'
      ).length,
    };
  }, [ncrs]);

  const openCreate = () => {
    if (!canWrite) return;

    setEditingId(null);
    setForm(blankForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (ncr) => {
    if (!canWrite) return;

    setEditingId(ncr.id);

    setForm({
      title: ncr.title || '',
      description: ncr.description || '',
      related_inspection_id: String(
        ncr.related_inspection_id || ''
      ),
      status: ncr.status || 'OPEN',
    });

    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canWrite) return;

    setError('');

    if (!form.title.trim()) {
      setError('กรุณากรอกหัวข้อ NCR');
      return;
    }

    if (!form.description.trim()) {
      setError('กรุณากรอกรายละเอียด NCR');
      return;
    }

    if (!form.related_inspection_id) {
      setError(
        'กรุณาเลือกรายการตรวจสอบที่เกี่ยวข้อง'
      );
      return;
    }

    const payload = {
      ...form,
      related_inspection_id: Number(
        form.related_inspection_id
      ),
      status: form.status || 'OPEN',
    };

    try {
      if (editingId) {
        await api.put(
          `/ncrs/${editingId}`,
          payload
        );
      } else {
        await api.post('/ncrs', payload);
      }

      setModalOpen(false);
      setForm(blankForm);

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          'ไม่สามารถบันทึกข้อมูล NCR ได้'
      );
    }
  };

  if (loading) {
    return (
      <Loading text="กำลังโหลดข้อมูล NCR..." />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            QUALITY CONTROL SYSTEM
          </p>

          <h2 style={styles.title}>
            ติดตามรายการ NCR
          </h2>

          <p style={styles.subtitle}>
            จัดการและติดตามปัญหาที่พบจากการตรวจสอบคุณภาพสินค้า
          </p>
        </div>

        {canWrite && (
          <button
            onClick={openCreate}
            style={styles.primaryButton}
          >
            ＋ สร้าง NCR
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📋
          </div>

          <div>
            <div style={styles.summaryNumber}>
              {summary.total}
            </div>

            <div style={styles.summaryLabel}>
              NCR ทั้งหมด
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '3px solid #2563EB',
          }}
        >
          <div style={styles.summaryIcon}>
            🔵
          </div>

          <div>
            <div style={styles.summaryNumber}>
              {summary.open}
            </div>

            <div style={styles.summaryLabel}>
              เปิดรายการ
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '3px solid #F59E0B',
          }}
        >
          <div style={styles.summaryIcon}>
            🟡
          </div>

          <div>
            <div style={styles.summaryNumber}>
              {summary.progress}
            </div>

            <div style={styles.summaryLabel}>
              กำลังดำเนินการ
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '3px solid #16A34A',
          }}
        >
          <div style={styles.summaryIcon}>
            🟢
          </div>

          <div>
            <div style={styles.summaryNumber}>
              {summary.closed}
            </div>

            <div style={styles.summaryLabel}>
              ปิดรายการแล้ว
            </div>
          </div>
        </div>
      </div>

      {!canWrite && (
        <div style={styles.readOnly}>
          👁️ คุณอยู่ในโหมดดูข้อมูลเท่านั้น
          เฉพาะผู้ใช้ ADMIN และ QC
          เท่านั้นที่สามารถสร้างหรือแก้ไข NCR ได้
        </div>
      )}

      {error ? (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      ) : null}

      {/* Search & Filter */}
      <div style={styles.filterCard}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>
            🔍
          </span>

          <input
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="ค้นหารหัส NCR, หัวข้อ หรือ Lot..."
            style={styles.searchInput}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          style={styles.filterSelect}
        >
          <option value="ALL">
            ทุกสถานะ
          </option>

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

        <button
          onClick={loadData}
          style={styles.refreshButton}
        >
          ↻ รีเฟรช
        </button>
      </div>

      {/* Table */}
      <div style={styles.panel}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.tableTitle}>
              รายการ NCR
            </h3>

            <p style={styles.tableSubtitle}>
              แสดง {filteredNcrs.length} จาก {ncrs.length} รายการ
            </p>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  รหัส NCR
                </th>

                <th style={styles.th}>
                  หัวข้อ
                </th>

                <th style={styles.th}>
                  Lot ที่เกี่ยวข้อง
                </th>

                <th style={styles.th}>
                  สถานะ
                </th>

                <th style={styles.th}>
                  วันที่สร้าง
                </th>

                {canWrite && (
                  <th
                    style={{
                      ...styles.th,
                      textAlign: 'center',
                    }}
                  >
                    การจัดการ
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredNcrs.map((ncr) => (
                <tr
                  key={ncr.id}
                  style={styles.tr}
                >
                  <td style={styles.td}>
                    <span style={styles.idBadge}>
                      NCR-{String(ncr.id).padStart(
                        3,
                        '0'
                      )}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.ncrTitle}>
                      {ncr.title}
                    </div>

                    {ncr.description && (
                      <div
                        style={
                          styles.description
                        }
                      >
                        {ncr.description}
                      </div>
                    )}
                  </td>

                  <td style={styles.td}>
                    <span style={styles.lotBadge}>
                      {ncr.lot_number ||
                        ncr.related_inspection_id}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <StatusBadge
                      status={ncr.status}
                    />
                  </td>

                  <td style={styles.td}>
                    <div style={styles.date}>
                      {ncr.created_at
                        ? new Date(
                            ncr.created_at
                          ).toLocaleDateString(
                            'th-TH'
                          )
                        : '-'}
                    </div>
                  </td>

                  {canWrite && (
                    <td
                      style={{
                        ...styles.td,
                        textAlign: 'center',
                      }}
                    >
                      <button
                        style={styles.editButton}
                        onClick={() =>
                          openEdit(ncr)
                        }
                      >
                        ✏️ แก้ไข
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNcrs.length === 0 && (
            <div style={styles.emptyState}>
              <div
                style={styles.emptyIcon}
              >
                📄
              </div>

              <h3
                style={{
                  margin: '0 0 6px',
                }}
              >
                ไม่พบรายการ NCR
              </h3>

              <p
                style={{
                  margin: 0,
                }}
              >
                ลองเปลี่ยนคำค้นหาหรือตัวกรอง
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {canWrite && (
        <Modal
          open={modalOpen}
          title={
            editingId
              ? '✏️ แก้ไขข้อมูล NCR'
              : '📋 สร้างรายการ NCR'
          }
          onClose={() => {
            setModalOpen(false);
            setError('');
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={styles.formIntro}>
              {editingId
                ? 'แก้ไขรายละเอียดและอัปเดตสถานะของ NCR'
                : 'กรอกรายละเอียดปัญหาที่พบจากการตรวจสอบคุณภาพ'}
            </div>

            <div style={styles.fieldRow}>
              <label style={styles.label}>
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
                placeholder="เช่น พบสินค้าชำรุดจากการตรวจสอบ"
              />
            </div>

            <div style={styles.fieldRow}>
              <label style={styles.label}>
                รายละเอียดปัญหา
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
                  minHeight: '110px',
                  resize: 'vertical',
                }}
                placeholder="อธิบายรายละเอียดของปัญหาที่พบ..."
              />
            </div>

            <div style={styles.fieldRow}>
              <label style={styles.label}>
                รายการตรวจสอบที่เกี่ยวข้อง
              </label>

              <select
                value={form.related_inspection_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    related_inspection_id:
                      e.target.value,
                  })
                }
                style={styles.input}
              >
                <option value="">
                  เลือกรายการตรวจสอบที่พบปัญหา
                </option>

                {candidateInspections.map(
                  (inspection) => (
                    <option
                      key={inspection.id}
                      value={inspection.id}
                    >
                      {inspection.lot_number} -{' '}
                      {inspection.product_name}
                      {' '}
                      ({inspection.failed_quantity} ไม่ผ่าน)
                    </option>
                  )
                )}
              </select>
            </div>

            {editingId && (
              <div style={styles.fieldRow}>
                <label style={styles.label}>
                  สถานะ NCR
                </label>

                <select
                  value={form.status || 'OPEN'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  style={styles.input}
                >
                  <option value="OPEN">
                    🔵 เปิดรายการ
                  </option>

                  <option value="IN_PROGRESS">
                    🟡 กำลังดำเนินการ
                  </option>

                  <option value="CLOSED">
                    🟢 ปิดรายการ
                  </option>
                </select>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setError('');
                }}
                style={styles.secondaryButton}
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
              >
                {editingId
                  ? '💾 บันทึกการเปลี่ยนแปลง'
                  : '＋ สร้าง NCR'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },

  eyebrow: {
    margin: '0 0 6px',
    color: '#2563EB',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  title: {
    margin: 0,
    color: '#0F172A',
    fontSize: 28,
  },

  subtitle: {
    margin: '8px 0 0',
    color: '#64748B',
    fontSize: 14,
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },

  summaryCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow:
      '0 6px 20px rgba(15, 23, 42, 0.05)',
  },

  summaryIcon: {
    fontSize: 28,
  },

  summaryNumber: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0F172A',
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },

  filterCard: {
    background: '#fff',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow:
      '0 6px 20px rgba(15, 23, 42, 0.04)',
  },

  searchWrapper: {
    position: 'relative',
    flex: 1,
  },

  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
  },

  searchInput: {
    width: '100%',
    padding: '11px 12px 11px 38px',
    borderRadius: 9,
    border: '1px solid #CBD5E1',
    boxSizing: 'border-box',
    fontSize: 14,
  },

  filterSelect: {
    padding: '11px 12px',
    borderRadius: 9,
    border: '1px solid #CBD5E1',
    background: '#fff',
    fontSize: 14,
    minWidth: 180,
  },

  refreshButton: {
    border: '1px solid #CBD5E1',
    background: '#F8FAFC',
    color: '#334155',
    borderRadius: 9,
    padding: '11px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  panel: {
    background: '#fff',
    borderRadius: 16,
    padding: 18,
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.05)',
  },

  tableHeader: {
    marginBottom: 16,
  },

  tableTitle: {
    margin: 0,
    color: '#0F172A',
    fontSize: 18,
  },

  tableSubtitle: {
    margin: '4px 0 0',
    color: '#64748B',
    fontSize: 13,
  },

  tableWrapper: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    minWidth: '850px',
    borderCollapse: 'collapse',
  },

  th: {
    textAlign: 'left',
    padding: '13px 12px',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 800,
    background: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  },

  tr: {
    borderBottom: '1px solid #F1F5F9',
  },

  td: {
    padding: '15px 12px',
    color: '#334155',
    verticalAlign: 'middle',
  },

  idBadge: {
    display: 'inline-block',
    padding: '5px 9px',
    borderRadius: 6,
    background: '#EFF6FF',
    color: '#2563EB',
    fontWeight: 700,
    fontSize: 12,
  },

  ncrTitle: {
    color: '#0F172A',
    fontWeight: 700,
  },

  description: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    maxWidth: 280,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  lotBadge: {
    background: '#F1F5F9',
    color: '#475569',
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 12,
    fontWeight: 600,
  },

  date: {
    color: '#64748B',
    fontSize: 13,
  },

  primaryButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: 9,
    padding: '11px 16px',
    cursor: 'pointer',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  secondaryButton: {
    border: 'none',
    background: '#E2E8F0',
    color: '#334155',
    borderRadius: 9,
    padding: '11px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  editButton: {
    border: 'none',
    background: '#EFF6FF',
    color: '#2563EB',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  input: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: 9,
    padding: '11px 12px',
    boxSizing: 'border-box',
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },

  fieldRow: {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column',
  },

  label: {
    color: '#334155',
    fontWeight: 700,
    fontSize: 14,
  },

  formIntro: {
    color: '#64748B',
    background: '#F8FAFC',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 1.5,
  },

  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },

  readOnly: {
    background: '#EFF6FF',
    color: '#1E40AF',
    border: '1px solid #BFDBFE',
    padding: '12px 14px',
    borderRadius: 10,
    marginBottom: 18,
    fontSize: 14,
  },

  error: {
    background: '#FEF2F2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
    padding: '12px 14px',
    borderRadius: 10,
    marginBottom: 18,
  },

  emptyState: {
    minHeight: 240,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#64748B',
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
};