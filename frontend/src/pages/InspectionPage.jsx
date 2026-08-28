import { useEffect, useMemo, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const baseForm = {
  product_id: '',
  lot_number: '',
  quantity: 100,
  passed_quantity: 95,
  failed_quantity: 5,
};

export default function InspectionPage({ type }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(baseForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { hasRole } = useAuth();
  const canWrite = hasRole(['ADMIN', 'QC']);

  const title = useMemo(() => {
    if (type === 'Incoming') return 'การตรวจสอบคุณภาพวัตถุดิบ';
    if (type === 'In-process') return 'การตรวจสอบคุณภาพระหว่างการผลิต';
    return 'การตรวจสอบคุณภาพขั้นสุดท้าย';
  }, [type]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get('/products');

        setProducts(data);

        if (data[0]) {
          setForm((current) => ({
            ...current,
            product_id: String(data[0].id),
          }));
        }
      } catch (err) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canWrite) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/inspections', {
        ...form,
        product_id: Number(form.product_id),
        inspection_type: type,
      });

      setSuccess('บันทึกผลการตรวจสอบเรียบร้อยแล้ว');

      setForm({
        ...baseForm,
        product_id: form.product_id,
      });
    } catch (err) {
      setError(err.message || 'ไม่สามารถบันทึกผลการตรวจสอบได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="กำลังโหลดข้อมูลการตรวจสอบ..." />;
  }

  const pass = Number(form.passed_quantity || 0);
  const fail = Number(form.failed_quantity || 0);

  const result = fail === 0 ? 'PASS' : 'FAIL';

  return (
    <div>
      <h2
        style={{
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        {title}
      </h2>

      {error ? (
        <ErrorMessage message={error} />
      ) : null}

      {success ? (
        <div style={styles.success}>
          {success}
        </div>
      ) : null}

      {!canWrite && (
        <div style={styles.readOnly}>
          คุณมีสิทธิ์ดูข้อมูลเท่านั้น ไม่สามารถเพิ่มหรือแก้ไขผลการตรวจสอบได้
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={styles.card}
      >
        <div style={styles.grid}>
          <div style={styles.field}>
            <label>สินค้า</label>

            <select
              value={form.product_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  product_id: e.target.value,
                })
              }
              style={styles.input}
              disabled={!canWrite}
            >
              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.product_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label>หมายเลขล็อต</label>

            <input
              value={form.lot_number}
              onChange={(e) =>
                setForm({
                  ...form,
                  lot_number: e.target.value,
                })
              }
              style={styles.input}
              placeholder="LOT-001"
              disabled={!canWrite}
            />
          </div>

          <div style={styles.field}>
            <label>จำนวนที่ตรวจสอบ</label>

            <input
              type="number"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: e.target.value,
                })
              }
              style={styles.input}
              disabled={!canWrite}
            />
          </div>

          <div style={styles.field}>
            <label>จำนวนที่ผ่าน</label>

            <input
              type="number"
              value={form.passed_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  passed_quantity: e.target.value,
                })
              }
              style={styles.input}
              disabled={!canWrite}
            />
          </div>

          <div style={styles.field}>
            <label>จำนวนที่ไม่ผ่าน</label>

            <input
              type="number"
              value={form.failed_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  failed_quantity: e.target.value,
                })
              }
              style={styles.input}
              disabled={!canWrite}
            />
          </div>
        </div>

        {type === 'Final' && (
          <div
            style={{
              ...styles.summaryBox,
              borderColor:
                result === 'PASS'
                  ? '#16A34A'
                  : '#DC2626',
            }}
          >
            <div>
              จำนวนที่ตรวจสอบทั้งหมด: {form.quantity}
            </div>

            <div>
              จำนวนที่ผ่าน: {pass}
            </div>

            <div>
              จำนวนที่ไม่ผ่าน: {fail}
            </div>

            <div
              style={{
                color:
                  result === 'PASS'
                    ? '#15803D'
                    : '#B91C1C',
                fontWeight: 700,
              }}
            >
              ผลการตรวจสอบ: {result === 'PASS' ? 'ผ่าน' : 'ไม่ผ่าน'}
            </div>
          </div>
        )}

        {canWrite && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '24px',
            }}
          >
            <button
              type="button"
              style={styles.cancelButton}
              onClick={() =>
                setForm({
                  ...baseForm,
                  product_id: form.product_id,
                })
              }
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving
                ? 'กำลังบันทึก...'
                : 'บันทึกผลการตรวจสอบ'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: 15,
  },

  primaryButton: {
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 18px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  cancelButton: {
    border: 'none',
    background: '#E2E8F0',
    color: '#0F172A',
    borderRadius: '8px',
    padding: '12px 18px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  summaryBox: {
    marginTop: '20px',
    borderRadius: '12px',
    padding: '18px',
    background: '#F8FAFC',
    border: '1px solid',
    lineHeight: '1.8',
    fontWeight: 600,
  },

  success: {
    background: '#DCFCE7',
    color: '#166534',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },

  readOnly: {
    background: '#F1F5F9',
    color: '#475569',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};