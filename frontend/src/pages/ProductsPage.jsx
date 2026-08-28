import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const blankProduct = {
  product_code: '',
  product_name: '',
  description: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankProduct);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasRole } = useAuth();
  const canWrite = hasRole(['ADMIN', 'QC']);

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((product) => {
      return (
        product.product_code?.toLowerCase().includes(keyword) ||
        product.product_name?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword)
      );
    });
  }, [products, searchTerm]);

  const openCreate = () => {
    if (!canWrite) return;

    setEditing(null);
    setForm(blankProduct);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    if (!canWrite) return;

    setEditing(product.id);

    setForm({
      product_code: product.product_code,
      product_name: product.product_name,
      description: product.description || '',
    });

    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canWrite) return;

    setError('');

    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
      } else {
        await api.post('/products', form);
      }

      setModalOpen(false);
      setForm(blankProduct);

      await loadProducts();
    } catch (err) {
      setError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = async () => {
    if (!canWrite || !selectedId) return;

    setError('');

    try {
      await api.del(`/products/${selectedId}`);

      setConfirmOpen(false);
      setSelectedId(null);

      await loadProducts();
    } catch (err) {
      setError(err.message || 'ไม่สามารถลบสินค้าได้');
    }
  };

  if (loading) {
    return <Loading text="กำลังโหลดข้อมูลสินค้า..." />;
  }

  return (
    <div style={styles.page}>
      {/* ส่วนหัว */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div>
            <div style={styles.eyebrow}>
              PRODUCT MANAGEMENT
            </div>

            <h2 style={styles.heroTitle}>
              จัดการข้อมูลสินค้า
            </h2>

            <p style={styles.heroText}>
              จัดการ เพิ่ม แก้ไข และติดตามข้อมูลสินค้าภายในระบบควบคุมคุณภาพ
            </p>
          </div>

          <div style={styles.heroIcon}>
            📦
          </div>
        </div>
      </div>

      {/* สรุปข้อมูล */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📦
          </div>

          <div>
            <div style={styles.summaryLabel}>
              จำนวนสินค้าทั้งหมด
            </div>

            <div style={styles.summaryValue}>
              {products.length}
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            🔎
          </div>

          <div>
            <div style={styles.summaryLabel}>
              รายการที่แสดง
            </div>

            <div style={styles.summaryValue}>
              {filteredProducts.length}
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            🏭
          </div>

          <div>
            <div style={styles.summaryLabel}>
              สถานะระบบสินค้า
            </div>

            <div style={styles.summaryStatus}>
              พร้อมใช้งาน
            </div>
          </div>
        </div>
      </div>

      {/* แถบค้นหา */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <span style={{ fontSize: 18 }}>
            🔍
          </span>

          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="ค้นหาจากรหัสสินค้า ชื่อสินค้า หรือรายละเอียด..."
            style={styles.searchInput}
          />
        </div>

        <div style={styles.toolbarRight}>
          <button
            onClick={loadProducts}
            style={styles.refreshButton}
          >
            ↻ รีเฟรช
          </button>

          {canWrite && (
            <button
              onClick={openCreate}
              style={styles.primaryButton}
            >
              + เพิ่มสินค้า
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}

      {/* ตารางสินค้า */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h3 style={{ margin: 0 }}>
              รายการสินค้า
            </h3>

            <div style={styles.panelSubtitle}>
              แสดงสินค้า {filteredProducts.length} รายการ
            </div>
          </div>

          <span style={styles.countBadge}>
            {filteredProducts.length} รายการ
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48 }}>
              📦
            </div>

            <strong>
              ไม่พบข้อมูลสินค้า
            </strong>

            <span>
              ลองค้นหาด้วยคำอื่น หรือเพิ่มสินค้าใหม่เข้าสู่ระบบ
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    สินค้า
                  </th>

                  <th style={styles.th}>
                    รหัสสินค้า
                  </th>

                  <th style={styles.th}>
                    รายละเอียด
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
                      จัดการ
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    style={styles.tr}
                  >
                    <td style={styles.td}>
                      <div style={styles.productInfo}>
                        <div style={styles.productAvatar}>
                          📦
                        </div>

                        <div>
                          <div style={styles.productName}>
                            {product.product_name}
                          </div>

                          <div style={styles.productId}>
                            ID #{product.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={styles.codeBadge}>
                        {product.product_code}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.description}>
                        {product.description || 'ไม่มีรายละเอียด'}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div>
                        {new Date(
                          product.created_at
                        ).toLocaleDateString('th-TH')}
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
                          onClick={() => openEdit(product)}
                        >
                          ✏️ แก้ไข
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={() => {
                            setSelectedId(product.id);
                            setConfirmOpen(true);
                          }}
                        >
                          🗑️ ลบ
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal เพิ่ม / แก้ไขสินค้า */}
      {canWrite && (
        <Modal
          open={modalOpen}
          title={editing ? '✏️ แก้ไขสินค้า' : '📦 เพิ่มสินค้าใหม่'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div style={styles.fieldRow}>
              <label style={styles.label}>
                รหัสสินค้า
              </label>

              <input
                value={form.product_code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    product_code: e.target.value,
                  })
                }
                style={styles.input}
                placeholder="เช่น PRD-001"
                required
              />
            </div>

            <div style={styles.fieldRow}>
              <label style={styles.label}>
                ชื่อสินค้า
              </label>

              <input
                value={form.product_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    product_name: e.target.value,
                  })
                }
                style={styles.input}
                placeholder="กรอกชื่อสินค้า"
                required
              />
            </div>

            <div style={styles.fieldRow}>
              <label style={styles.label}>
                รายละเอียดสินค้า
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
                  minHeight: '100px',
                  resize: 'vertical',
                }}
                placeholder="กรอกรายละเอียดสินค้า"
              />
            </div>

            <div style={styles.formActions}>
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
                {editing
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มสินค้า'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ยืนยันการลบ */}
      {canWrite && (
        <ConfirmDialog
          open={confirmOpen}
          title="🗑️ ลบสินค้า"
          message="คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การดำเนินการนี้อาจไม่สามารถย้อนกลับได้"
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirmOpen(false);
            setSelectedId(null);
          }}
        />
      )}
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
    boxShadow: '0 12px 30px rgba(37, 99, 235, 0.15)',
  },

  heroContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#BFDBFE',
    marginBottom: 8,
  },

  heroTitle: {
    margin: 0,
    fontSize: 30,
    letterSpacing: '-0.03em',
  },

  heroText: {
    margin: '10px 0 0',
    color: '#DBEAFE',
    maxWidth: 620,
    lineHeight: 1.6,
  },

  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: '22px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 44,
    flexShrink: 0,
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 18,
  },

  summaryCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
    border: '1px solid #F1F5F9',
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: '14px',
    background: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 700,
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0F172A',
    marginTop: 3,
  },

  summaryStatus: {
    fontSize: 18,
    fontWeight: 800,
    color: '#16A34A',
    marginTop: 4,
  },

  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },

  searchBox: {
    flex: '1 1 360px',
    maxWidth: 560,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '0 14px',
    boxShadow:
      '0 4px 14px rgba(15, 23, 42, 0.03)',
  },

  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: '13px 0',
    fontSize: 14,
    background: 'transparent',
  },

  toolbarRight: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },

  refreshButton: {
    border: '1px solid #CBD5E1',
    background: '#fff',
    color: '#334155',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  panel: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.04)',
    border: '1px solid #F1F5F9',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },

  panelSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },

  countBadge: {
    background: '#EFF6FF',
    color: '#1D4ED8',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 800,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '850px',
  },

  th: {
    textAlign: 'left',
    padding: '12px',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 800,
    borderBottom: '1px solid #E2E8F0',
    background: '#F8FAFC',
  },

  tr: {
    borderBottom: '1px solid #F1F5F9',
  },

  td: {
    padding: '14px 12px',
    verticalAlign: 'middle',
    color: '#334155',
    fontSize: 14,
  },

  productInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  productAvatar: {
    width: 42,
    height: 42,
    borderRadius: '12px',
    background: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },

  productName: {
    fontWeight: 800,
    color: '#0F172A',
  },

  productId: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },

  codeBadge: {
    display: 'inline-block',
    background: '#F1F5F9',
    color: '#334155',
    padding: '6px 9px',
    borderRadius: '7px',
    fontSize: 12,
    fontWeight: 700,
  },

  description: {
    maxWidth: 300,
    color: '#64748B',
    lineHeight: 1.5,
  },

  primaryButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '10px',
    padding: '11px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  secondaryButton: {
    border: 'none',
    background: '#E2E8F0',
    color: '#0F172A',
    borderRadius: '10px',
    padding: '11px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  editButton: {
    border: 'none',
    background: '#EFF6FF',
    color: '#1D4ED8',
    borderRadius: '8px',
    padding: '8px 10px',
    marginRight: 8,
    cursor: 'pointer',
    fontWeight: 700,
  },

  deleteButton: {
    border: 'none',
    background: '#FEF2F2',
    color: '#B91C1C',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  fieldRow: {
    marginBottom: 16,
  },

  label: {
    display: 'block',
    fontWeight: 700,
    color: '#334155',
    marginBottom: 7,
  },

  input: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '11px 13px',
    boxSizing: 'border-box',
    fontSize: 14,
    outline: 'none',
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },

  emptyState: {
    minHeight: 260,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: '#64748B',
    textAlign: 'center',
    background: '#F8FAFC',
    border: '1px dashed #CBD5E1',
    borderRadius: '12px',
    padding: 20,
  },

  error: {
    background: '#FEF2F2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
    padding: '12px 14px',
    borderRadius: '10px',
  },
};