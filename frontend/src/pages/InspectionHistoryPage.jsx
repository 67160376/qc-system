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
      setError(
        err.message || 'ไม่สามารถโหลดประวัติการตรวจสอบได้'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const existingNcrInspectionIds = useMemo(
    () =>
      new Set(
        ncrs.map((ncr) =>
          Number(ncr.related_inspection_id)
        )
      ),
    [ncrs]
  );

  const filteredInspections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return inspections.filter((inspection) => {
      const matchesTerm =
        !term ||
        inspection.lot_number
          ?.toLowerCase()
          .includes(term) ||
        inspection.product_name
          ?.toLowerCase()
          .includes(term) ||
        inspection.inspector_name
          ?.toLowerCase()
          .includes(term) ||
        String(inspection.id).includes(term);

      const matchesType =
        typeFilter === 'ALL' ||
        inspection.inspection_type === typeFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        inspection.status === statusFilter;

      return matchesTerm && matchesType && matchesStatus;
    });
  }, [
    inspections,
    searchTerm,
    typeFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const total = inspections.length;

    const passed = inspections.filter(
      (item) => Number(item.failed_quantity) === 0
    ).length;

    const failed = inspections.filter(
      (item) => Number(item.failed_quantity) > 0
    ).length;

    const totalFailedQuantity = inspections.reduce(
      (sum, item) =>
        sum + Number(item.failed_quantity || 0),
      0
    );

    return {
      total,
      passed,
      failed,
      totalFailedQuantity,
    };
  }, [inspections]);

  const handleCreateNCR = async (inspection) => {
    if (
      !canCreateNCR ||
      Number(inspection.failed_quantity) <= 0 ||
      existingNcrInspectionIds.has(
        Number(inspection.id)
      )
    ) {
      return;
    }

    setCreatingId(inspection.id);
    setError('');
    setSuccess('');

    try {
      await api.post('/ncrs', {
        title: `NCR - ${inspection.lot_number}`,
        description: `การตรวจสอบ Lot ${
          inspection.lot_number
        } ของสินค้า ${
          inspection.product_name
        } พบสินค้าที่ไม่ผ่านจำนวน ${
          inspection.failed_quantity
        } ชิ้น จากทั้งหมด ${
          inspection.quantity
        } ชิ้น`,
        related_inspection_id: inspection.id,
      });

      setSuccess(
        `สร้าง NCR สำหรับ Lot ${inspection.lot_number} เรียบร้อยแล้ว`
      );

      await loadData();
    } catch (err) {
      setError(
        err.message || 'ไม่สามารถสร้าง NCR ได้'
      );
    } finally {
      setCreatingId(null);
    }
  };

  const getTypeName = (type) => {
    if (type === 'Incoming')
      return 'ตรวจสอบวัตถุดิบ';

    if (type === 'In-process')
      return 'ตรวจสอบระหว่างผลิต';

    if (type === 'Final')
      return 'ตรวจสอบขั้นสุดท้าย';

    return type;
  };

  const getTypeIcon = (type) => {
    if (type === 'Incoming') return '📥';

    if (type === 'In-process') return '⚙️';

    if (type === 'Final') return '🏁';

    return '🔍';
  };

  const getStatusName = (status) => {
    if (status === 'COMPLETED')
      return 'เสร็จสิ้น';

    if (status === 'FAILED')
      return 'ไม่ผ่าน';

    if (status === 'PENDING')
      return 'รอดำเนินการ';

    return status;
  };

  if (loading) {
    return (
      <Loading text="กำลังโหลดประวัติการตรวจสอบ..." />
    );
  }

  return (
    <div style={styles.page}>

      {/* Hero */}
      <div style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>
            QUALITY CONTROL SYSTEM
          </div>

          <h2 style={styles.title}>
            ประวัติการตรวจสอบคุณภาพ
          </h2>

          <p style={styles.subtitle}>
            ตรวจสอบผลการควบคุมคุณภาพ
            ค้นหาข้อมูล และสร้างรายงาน NCR
            สำหรับรายการที่ไม่ผ่านการตรวจสอบ
          </p>
        </div>

        <button
          onClick={loadData}
          style={styles.refreshButton}
        >
          ↻ รีเฟรชข้อมูล
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📋
          </div>

          <div>
            <div style={styles.summaryLabel}>
              รายการตรวจสอบทั้งหมด
            </div>

            <div style={styles.summaryValue}>
              {summary.total}
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
              ผ่านการตรวจสอบ
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#16A34A',
              }}
            >
              {summary.passed}
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
            ❌
          </div>

          <div>
            <div style={styles.summaryLabel}>
              ไม่ผ่านการตรวจสอบ
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#DC2626',
              }}
            >
              {summary.failed}
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
            ⚠️
          </div>

          <div>
            <div style={styles.summaryLabel}>
              จำนวนสินค้าไม่ผ่าน
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#D97706',
              }}
            >
              {summary.totalFailedQuantity}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error ? (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      ) : null}

      {success ? (
        <div style={styles.success}>
          ✓ {success}
        </div>
      ) : null}

      {/* Filter */}
      <div style={styles.filterPanel}>
        <div style={styles.filterTitle}>
          <div>
            <strong>
              🔎 ค้นหาและกรองข้อมูล
            </strong>

            <div style={styles.filterSubtitle}>
              ค้นหาจากหมายเลข Lot ชื่อสินค้า
              หรือผู้ตรวจสอบ
            </div>
          </div>

          <div style={styles.resultCount}>
            พบ {filteredInspections.length} รายการ
          </div>
        </div>

        <div style={styles.filterBar}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>
              🔍
            </span>

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="ค้นหา Lot, สินค้า, ผู้ตรวจสอบ..."
              style={styles.searchInput}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            style={styles.input}
          >
            <option value="ALL">
              ทุกประเภทการตรวจสอบ
            </option>

            <option value="Incoming">
              📥 ตรวจสอบวัตถุดิบ
            </option>

            <option value="In-process">
              ⚙️ ตรวจสอบระหว่างผลิต
            </option>

            <option value="Final">
              🏁 ตรวจสอบขั้นสุดท้าย
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            style={styles.input}
          >
            <option value="ALL">
              ทุกสถานะ
            </option>

            <option value="COMPLETED">
              ✅ เสร็จสิ้น
            </option>

            <option value="FAILED">
              ❌ ไม่ผ่าน
            </option>

            <option value="PENDING">
              ⏳ รอดำเนินการ
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.panel}>

        <div style={styles.tableHeader}>
          <div>
            <h3 style={{ margin: 0 }}>
              รายการตรวจสอบ
            </h3>

            <p style={styles.tableSubtitle}>
              แสดงรายละเอียดการตรวจสอบทั้งหมด
            </p>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>รหัส</th>

                <th style={styles.th}>
                  หมายเลข Lot
                </th>

                <th style={styles.th}>
                  สินค้า
                </th>

                <th style={styles.th}>
                  ประเภท QC
                </th>

                <th style={styles.th}>
                  ผู้ตรวจสอบ
                </th>

                <th
                  style={{
                    ...styles.th,
                    textAlign: 'center',
                  }}
                >
                  จำนวน
                </th>

                <th
                  style={{
                    ...styles.th,
                    textAlign: 'center',
                  }}
                >
                  ผ่าน
                </th>

                <th
                  style={{
                    ...styles.th,
                    textAlign: 'center',
                  }}
                >
                  ไม่ผ่าน
                </th>

                <th style={styles.th}>
                  สถานะ
                </th>

                <th style={styles.th}>
                  วันที่ตรวจ
                </th>

                <th style={styles.th}>
                  การดำเนินการ
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInspections.map(
                (inspection) => {
                  const alreadyLinked =
                    existingNcrInspectionIds.has(
                      Number(inspection.id)
                    );

                  const hasFailed =
                    Number(
                      inspection.failed_quantity
                    ) > 0;

                  const actionDisabled =
                    !canCreateNCR ||
                    !hasFailed ||
                    alreadyLinked ||
                    creatingId === inspection.id;

                  return (
                    <tr
                      key={inspection.id}
                      style={styles.tr}
                    >
                      <td style={styles.td}>
                        <span style={styles.idTag}>
                          #{inspection.id}
                        </span>
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          fontWeight: 700,
                        }}
                      >
                        {inspection.lot_number}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {inspection.product_name}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.typeTag}>
                          {getTypeIcon(
                            inspection.inspection_type
                          )}

                          {' '}

                          {getTypeName(
                            inspection.inspection_type
                          )}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {inspection.inspector_name ||
                          '-'}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: 'center',
                          fontWeight: 600,
                        }}
                      >
                        {inspection.quantity}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: 'center',
                        }}
                      >
                        <span style={styles.passNumber}>
                          {inspection.passed_quantity}
                        </span>
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={
                            Number(
                              inspection.failed_quantity
                            ) > 0
                              ? styles.failNumber
                              : styles.zeroNumber
                          }
                        >
                          {inspection.failed_quantity}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusTag,
                            ...(inspection.status ===
                            'COMPLETED'
                              ? styles.completed
                              : inspection.status ===
                                'FAILED'
                              ? styles.failed
                              : styles.pending),
                          }}
                        >
                          {getStatusName(
                            inspection.status
                          )}
                        </span>
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          color: '#64748B',
                        }}
                      >
                        {new Date(
                          inspection.created_at
                        ).toLocaleDateString(
                          'th-TH'
                        )}
                      </td>

                      <td style={styles.td}>
                        {hasFailed &&
                        alreadyLinked ? (
                          <span style={styles.ncrCreated}>
                            ✓ สร้าง NCR แล้ว
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleCreateNCR(
                                inspection
                              )
                            }
                            disabled={
                              actionDisabled
                            }
                            style={{
                              ...styles.actionButton,
                              ...(actionDisabled
                                ? styles.actionButtonDisabled
                                : {}),
                            }}
                          >
                            {creatingId ===
                            inspection.id
                              ? 'กำลังสร้าง...'
                              : hasFailed
                              ? '⚠️ สร้าง NCR'
                              : 'ไม่มีสินค้าเสีย'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {filteredInspections.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                🔍
              </div>

              <h3>
                ไม่พบข้อมูลการตรวจสอบ
              </h3>

              <p>
                ลองเปลี่ยนคำค้นหา
                หรือเงื่อนไขการกรองข้อมูล
              </p>
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

  hero: {
    background:
      'linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #2563EB 100%)',
    borderRadius: '18px',
    padding: '28px 30px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    boxShadow:
      '0 14px 35px rgba(37, 99, 235, 0.18)',
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#93C5FD',
    marginBottom: 8,
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
  },

  subtitle: {
    marginBottom: 0,
    color: '#CBD5E1',
    lineHeight: 1.6,
    maxWidth: 650,
  },

  refreshButton: {
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: '10px',
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },

  summaryCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.05)',
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: '12px',
    background: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 600,
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: 800,
    marginTop: 4,
    color: '#0F172A',
  },

  filterPanel: {
    background: '#fff',
    borderRadius: '14px',
    padding: '20px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
  },

  filterTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },

  filterSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },

  resultCount: {
    background: '#EFF6FF',
    color: '#2563EB',
    padding: '7px 12px',
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  filterBar: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(240px, 1.5fr) repeat(2, minmax(180px, 1fr))',
    gap: 12,
  },

  searchWrap: {
    position: 'relative',
  },

  searchIcon: {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
  },

  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '11px 12px 11px 38px',
    fontSize: 14,
    outline: 'none',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '11px 12px',
    background: '#fff',
    fontSize: 14,
  },

  panel: {
    background: '#fff',
    borderRadius: '14px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.05)',
    overflow: 'hidden',
  },

  tableHeader: {
    padding: '20px 20px 14px',
    borderBottom: '1px solid #E2E8F0',
  },

  tableSubtitle: {
    margin: '5px 0 0',
    color: '#64748B',
    fontSize: 13,
  },

  tableWrap: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1250px',
    fontSize: 13,
  },

  th: {
    background: '#F8FAFC',
    color: '#475569',
    textAlign: 'left',
    padding: '13px 14px',
    fontSize: 11,
    letterSpacing: '0.04em',
    fontWeight: 800,
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  },

  tr: {
    borderBottom: '1px solid #F1F5F9',
  },

  td: {
    padding: '14px',
    color: '#334155',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },

  idTag: {
    background: '#F1F5F9',
    color: '#475569',
    borderRadius: '6px',
    padding: '5px 8px',
    fontWeight: 700,
    fontSize: 12,
  },

  typeTag: {
    background: '#F8FAFC',
    padding: '6px 9px',
    borderRadius: '8px',
    fontSize: 12,
    fontWeight: 600,
  },

  passNumber: {
    color: '#15803D',
    fontWeight: 800,
  },

  failNumber: {
    color: '#DC2626',
    fontWeight: 800,
  },

  zeroNumber: {
    color: '#94A3B8',
    fontWeight: 700,
  },

  statusTag: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: 11,
    fontWeight: 800,
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

  actionButton: {
    border: 'none',
    background: '#DC2626',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 11px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
  },

  actionButtonDisabled: {
    background: '#E2E8F0',
    color: '#94A3B8',
    cursor: 'not-allowed',
  },

  ncrCreated: {
    display: 'inline-block',
    background: '#DCFCE7',
    color: '#166534',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 800,
  },

  error: {
    background: '#FEF2F2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
    padding: '13px 15px',
    borderRadius: '10px',
    fontWeight: 600,
  },

  success: {
    background: '#F0FDF4',
    color: '#166534',
    border: '1px solid #BBF7D0',
    padding: '13px 15px',
    borderRadius: '10px',
    fontWeight: 600,
  },

  emptyState: {
    minHeight: 280,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#64748B',
    padding: 30,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
};