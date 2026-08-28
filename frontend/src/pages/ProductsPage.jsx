import { useEffect, useState } from 'react';
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

  const { hasRole } = useAuth();
  const canWrite = hasRole(['ADMIN', 'QC']);

  const loadProducts = async () => {
    setLoading(true);

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

      loadProducts();
    } catch (err) {
      setError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = async () => {
    if (!canWrite || !selectedId) return;

    try {
      await api.del(`/products/${selectedId}`);

      setConfirmOpen(false);
      loadProducts();
    } catch (err) {
      setError(err.message || 'ไม่สามารถลบสินค้าได้');
    }
  };

  if (loading) {
    return <Loading text="กำลังโหลดข้อมูลสินค้า..." />;
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
        <h2 style={{ margin: 0 }}>จัดการสินค้า</h2>

        {canWrite && (
          <button
            onClick={openCreate}
            style={styles.primaryButton}
          >
            + เพิ่มสินค้า
          </button>
        )}
      </div>

      {error ? (
        <div style={styles.error}>{error}</div>
      ) : null}

      <div style={styles.panel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>รหัสสินค้า</th>
              <th>ชื่อสินค้า</th>
              <th>รายละเอียด</th>
              <th>วันที่สร้าง</th>

              {canWrite && (
                <th>จัดการ</th>
              )}
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.product_code}</td>

                <td>{product.product_name}</td>

                <td>{product.description}</td>

                <td>
                  {new Date(
                    product.created_at
                  ).toLocaleDateString('th-TH')}
                </td>

                {canWrite && (
                  <td>
                    <button
                      style={styles.actionButton}
                      onClick={() => openEdit(product)}
                    >
                      แก้ไข
                    </button>

                    <button
                      style={{
                        ...styles.actionButton,
                        ...styles.deleteButton,
                      }}
                      onClick={() => {
                        setSelectedId(product.id);
                        setConfirmOpen(true);
                      }}
                    >
                      ลบ
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canWrite && (
        <Modal
          open={modalOpen}
          title={editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div style={styles.fieldRow}>
              <label>รหัสสินค้า</label>

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
              />
            </div>

            <div style={styles.fieldRow}>
              <label>ชื่อสินค้า</label>

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
              />
            </div>

            <div style={styles.fieldRow}>
              <label>รายละเอียด</label>

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
                }}
                placeholder="กรอกรายละเอียดสินค้า"
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '16px',
              }}
            >
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
                {editing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {canWrite && (
        <ConfirmDialog
          open={confirmOpen}
          title="ลบสินค้า"
          message="คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
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
    marginRight: '8px',
    cursor: 'pointer',
  },

  deleteButton: {
    background: '#FEE2E2',
    color: '#B91C1C',
  },

  input: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '6px',
    boxSizing: 'border-box',
  },

  fieldRow: {
    marginBottom: '14px',
  },

  error: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};