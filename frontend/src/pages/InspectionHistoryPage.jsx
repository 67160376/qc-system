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
      setError(err.message || 'ไม่สามารถโหลดประวัติการตรวจสอบได้');
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

      const matchesType =
        typeFilter === 'ALL' ||
        inspection.inspection_type === typeFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        inspection.status === statusFilter;

      return matchesTerm && matchesType && matchesStatus;
    });
  }, [inspections, searchTerm, typeFilter, statusFilter]);

  const handleCreateNCR = async (inspection) => {
    if (
      !canCreateNCR ||
      Number(inspection.failed_quantity) <= 0 ||
      existingNcrInspectionIds.has(Number(inspection.id))
    ) {
      return;
    }

    setCreatingId(inspection.id);
    setError('');
    setSuccess('');

    try {
      await api.post('/ncrs', {
        title: `NCR - ${inspection.lot_number}`,
        description: `การตรวจสอบ Lot ${inspection.lot_number} ของสินค้า ${inspection.product_name} พบสินค้าที่ไม่ผ่านจำนวน ${inspection.failed_quantity} ชิ้น จากทั้งหมด ${inspection.quantity} ชิ้น`,
        related_inspection_id: inspection.id,
      });

      setSuccess(`สร้าง NCR สำหรับ Lot ${inspection.lot_number} เรียบร้อยแล้ว`);

      await loadData();
    } catch (err) {
      setError(err.message || 'ไม่สามารถสร้าง NCR ได้');
    } finally {
      setCreatingId(null);
    }
  };

  const getTypeName = (type) => {
    if (type === 'Incoming') return 'ตรวจสอบวัตถุดิบ';
    if (type === 'In-process') return 'ตรวจสอบระหว่างผลิต';
    if (type === 'Final') return 'ตรวจสอบขั้นสุดท้าย';

    return type;
  };

  const getStatusName = (status) => {
    if (status === 'COMPLETED') return 'เสร็จสิ้น';
    if (status === 'FAILED') return 'ไม่ผ่าน';
    if (status === 'PENDING') return 'รอดำเนินการ';

    return status;
  };

  if (loading) {
    return <Loading text="กำลังโหลดประวัติการตรวจสอบ..." />;
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
        <div>
          <h2 style={{ margin: 0 }}>ประวัติการตรวจสอบคุณภาพ</h2>
          <p style={{ color: '#64748B', marginTop: 6 }}>
            ตรวจสอบข้อมูลและสร้างรายงาน NCR สำหรับสินค้าที่ไม่ผ่านการตรวจสอบ
          </p>
        </div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      {success ? <div style={styles.success}>{success}</div> : null}

      <div style={styles.filterBar}>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="ค้นหา Lot, สินค้า, ผู้ตรวจสอบ..."
          style={styles.input}
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          style={styles.input}
        >
          <option value="ALL">ทุกประเภทการตรวจสอบ</option>
          <option value="Incoming">ตรวจสอบวัตถุดิบ</option>
          <option value="In-process">ตรวจสอบระหว่างผลิต</option>
          <option value="Final">ตรวจสอบขั้นสุดท้าย</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={styles.input}
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="COMPLETED">เสร็จสิ้น</option>
          <option value="FAILED">ไม่ผ่าน</option>
          <option value="PENDING">รอดำเนินการ</option>
        </select>
      </div>

      <div style={styles.panel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>รหัส</th>
              <th>หมายเลข Lot</th>
              <th>สินค้า</th>
              <th>ประเภทการตรวจ</th>
              <th>ผู้ตรวจสอบ</th>
              <th>จำนวนทั้งหมด</th>
              <th>ผ่าน</th>
              <th>ไม่ผ่าน</th>
              <th>สถานะ</th>
              <th>วันที่ตรวจ</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>

          <tbody>
            {filteredInspections.map((inspection) => {
              const alreadyLinked =
                existingNcrInspectionIds.has(Number(inspection.id));

              const hasFailed =
                Number(inspection.failed_quantity) > 0;

              const actionDisabled =
                !canCreateNCR ||
                !hasFailed ||
                alreadyLinked ||
                creatingId === inspection.id;

              return (
                <tr key={inspection.id}>
                  <td>{inspection.id}</td>

                  <td>{inspection.lot_number}</td>

                  <td>{inspection.product_name}</td>

                  <td>
                    {getTypeName(inspection.inspection_type)}
                  </td>

                  <td>
                    {inspection.inspector_name || '-'}
                  </td>

                  <td>{inspection.quantity}</td>

                  <td style={{ color: '#16A34A', fontWeight: 600 }}>
                    {inspection.passed_quantity}
                  </td>

                  <td
                    style={{
                      color:
                        Number(inspection.failed_quantity) > 0
                          ? '#DC2626'
                          : '#64748B',
                      fontWeight: 600,
                    }}
                  >
                    {inspection.failed_quantity}
                  </td>

                  <td>
                    <span
                      style={{
                        ...styles.statusTag,
                        ...(inspection.status === 'COMPLETED'
                          ? styles.completed
                          : inspection.status === 'FAILED'
                          ? styles.failed
                          : styles.pending),
                      }}
                    >
                      {getStatusName(inspection.status)}
                    </span>
                  </td>

                  <td>
                    {new Date(
                      inspection.created_at
                    ).toLocaleDateString('th-TH')}
                  </td>

                  <td>
                    {hasFailed && alreadyLinked ? (
                      <span style={styles.tag}>
                        สร้าง NCR แล้ว
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleCreateNCR(inspection)
                        }
                        disabled={actionDisabled}
                        style={{
                          ...styles.actionButton,
                          ...(actionDisabled
                            ? styles.actionButtonDisabled
                            : {}),
                        }}
                      >
                        {creatingId === inspection.id
                          ? 'กำลังสร้าง...'
                          : hasFailed
                          ? 'สร้าง NCR'
                          : 'ไม่พบสินค้าเสีย'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredInspections.length === 0 && (
          <div style={styles.emptyState}>
            ไม่พบข้อมูลการตรวจสอบที่ตรงกับเงื่อนไข
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  filterBar: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1.5fr) repeat(2, minmax(160px, 1fr))',
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
    fontSize: 14,
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
    minWidth: '1200px',
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

  statusTag: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 700,
  },

  completed: {
    background: '#DCFCE7',
    color: '#166534',
  },

  failed: {
    background: '#FEE2E2',
    color: '#991B1B',
  },

  pending: {
    background: '#FEF3C7',
    color: '#92400E',
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
    textAlign: 'center',
  },
};