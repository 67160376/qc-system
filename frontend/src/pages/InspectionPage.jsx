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

  const pageConfig = useMemo(() => {
    if (type === 'Incoming') {
      return {
        title: 'ตรวจสอบวัตถุดิบเข้า',
        subtitle: 'บันทึกและตรวจสอบคุณภาพของวัตถุดิบก่อนเข้าสู่กระบวนการผลิต',
        icon: '📥',
        color: '#2563EB',
        lightColor: '#EFF6FF',
      };
    }

    if (type === 'In-process') {
      return {
        title: 'ตรวจสอบระหว่างการผลิต',
        subtitle: 'ติดตามและตรวจสอบคุณภาพของสินค้าในระหว่างกระบวนการผลิต',
        icon: '⚙️',
        color: '#7C3AED',
        lightColor: '#F5F3FF',
      };
    }

    return {
      title: 'ตรวจสอบสินค้าสำเร็จรูป',
      subtitle: 'ตรวจสอบคุณภาพขั้นสุดท้ายก่อนส่งมอบสินค้า',
      icon: '🏆',
      color: '#16A34A',
      lightColor: '#F0FDF4',
    };
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

  const quantity = Number(form.quantity || 0);
  const pass = Number(form.passed_quantity || 0);
  const fail = Number(form.failed_quantity || 0);

  const passRate =
    quantity > 0
      ? Math.min(100, Math.round((pass / quantity) * 100))
      : 0;

  const failRate =
    quantity > 0
      ? Math.min(100, Math.round((fail / quantity) * 100))
      : 0;

  const result = fail === 0 ? 'PASS' : 'FAIL';

  return (
    <div style={styles.page}>
      {/* Banner */}
      <div
        style={{
          ...styles.hero,
          background: `linear-gradient(135deg, ${pageConfig.color}, ${pageConfig.color}CC)`,
        }}
      >
        <div style={styles.heroContent}>
          <div
            style={{
              ...styles.heroIcon,
              background: pageConfig.lightColor,
            }}
          >
            {pageConfig.icon}
          </div>

          <div>
            <div style={styles.heroLabel}>
              ระบบควบคุมคุณภาพ
            </div>

            <h2 style={styles.heroTitle}>
              {pageConfig.title}
            </h2>

            <p style={styles.heroSubtitle}>
              {pageConfig.subtitle}
            </p>
          </div>
        </div>

        <div style={styles.heroBadge}>
          QC INSPECTION
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : null}

      {success ? (
        <div style={styles.success}>
          <span style={{ fontSize: 20 }}>✓</span>
          <div>
            <strong>สำเร็จ</strong>
            <div>{success}</div>
          </div>
        </div>
      ) : null}

      {!canWrite && (
        <div style={styles.readOnly}>
          <span style={{ fontSize: 22 }}>🔒</span>

          <div>
            <strong>โหมดดูข้อมูลเท่านั้น</strong>
            <div>
              คุณมีสิทธิ์ดูข้อมูล แต่ไม่สามารถเพิ่มหรือแก้ไขผลการตรวจสอบได้
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📦</div>

          <div>
            <div style={styles.summaryLabel}>
              จำนวนที่ตรวจสอบ
            </div>

            <div style={styles.summaryValue}>
              {quantity}
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '4px solid #16A34A',
          }}
        >
          <div style={styles.summaryIcon}>✅</div>

          <div>
            <div style={styles.summaryLabel}>
              จำนวนที่ผ่าน
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#16A34A',
              }}
            >
              {pass}
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: '4px solid #DC2626',
          }}
        >
          <div style={styles.summaryIcon}>❌</div>

          <div>
            <div style={styles.summaryLabel}>
              จำนวนที่ไม่ผ่าน
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: '#DC2626',
              }}
            >
              {fail}
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            borderTop: `4px solid ${
              passRate >= 95 ? '#16A34A' : '#F59E0B'
            }`,
          }}
        >
          <div style={styles.summaryIcon}>📊</div>

          <div>
            <div style={styles.summaryLabel}>
              อัตราการผ่าน
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color:
                  passRate >= 95
                    ? '#16A34A'
                    : '#F59E0B',
              }}
            >
              {passRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        style={styles.card}
      >
        <div style={styles.cardHeader}>
          <div>
            <h3 style={{ margin: 0 }}>
              📝 บันทึกผลการตรวจสอบ
            </h3>

            <p style={styles.cardSubtitle}>
              กรอกข้อมูลและผลการตรวจสอบสินค้า
            </p>
          </div>

          <div
            style={{
              ...styles.typeBadge,
              background: pageConfig.lightColor,
              color: pageConfig.color,
            }}
          >
            {pageConfig.icon} {pageConfig.title}
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.grid}>
          {/* Product */}
          <div style={styles.field}>
            <label style={styles.label}>
              📦 สินค้า
            </label>

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

          {/* Lot Number */}
          <div style={styles.field}>
            <label style={styles.label}>
              🔢 หมายเลขล็อต
            </label>

            <input
              value={form.lot_number}
              onChange={(e) =>
                setForm({
                  ...form,
                  lot_number: e.target.value,
                })
              }
              style={styles.input}
              placeholder="เช่น LOT-001"
              disabled={!canWrite}
            />
          </div>
        </div>

        <div style={styles.sectionTitle}>
          <span>📊</span>
          ผลการตรวจสอบ
        </div>

        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>
              จำนวนที่ตรวจสอบ
            </label>

            <input
              type="number"
              min="0"
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
            <label style={styles.label}>
              จำนวนที่ผ่าน
            </label>

            <input
              type="number"
              min="0"
              value={form.passed_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  passed_quantity: e.target.value,
                })
              }
              style={{
                ...styles.input,
                borderColor: '#86EFAC',
              }}
              disabled={!canWrite}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              จำนวนที่ไม่ผ่าน
            </label>

            <input
              type="number"
              min="0"
              value={form.failed_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  failed_quantity: e.target.value,
                })
              }
              style={{
                ...styles.input,
                borderColor: '#FCA5A5',
              }}
              disabled={!canWrite}
            />
          </div>
        </div>

        {/* Progress */}
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <strong>สรุปผลการตรวจสอบ</strong>

            <span>
              ผ่าน {passRate}% | ไม่ผ่าน {failRate}%
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                width: `${passRate}%`,
                background: '#16A34A',
                height: '100%',
              }}
            />

            <div
              style={{
                width: `${failRate}%`,
                background: '#DC2626',
                height: '100%',
              }}
            />
          </div>
        </div>

        {/* Final QC Result */}
        {type === 'Final' && (
          <div
            style={{
              ...styles.resultBox,
              background:
                result === 'PASS'
                  ? '#F0FDF4'
                  : '#FEF2F2',
              borderColor:
                result === 'PASS'
                  ? '#86EFAC'
                  : '#FCA5A5',
            }}
          >
            <div style={styles.resultIcon}>
              {result === 'PASS'
                ? '🎉'
                : '⚠️'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={styles.resultLabel}>
                ผลการตรวจสอบขั้นสุดท้าย
              </div>

              <div
                style={{
                  ...styles.resultText,
                  color:
                    result === 'PASS'
                      ? '#15803D'
                      : '#B91C1C',
                }}
              >
                {result === 'PASS'
                  ? 'ผ่านการตรวจสอบ'
                  : 'ไม่ผ่านการตรวจสอบ'}
              </div>
            </div>

            <div
              style={{
                ...styles.resultBadge,
                background:
                  result === 'PASS'
                    ? '#16A34A'
                    : '#DC2626',
              }}
            >
              {result}
            </div>
          </div>
        )}

        {canWrite && (
          <div style={styles.buttonRow}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => {
                setForm({
                  ...baseForm,
                  product_id: form.product_id,
                });

                setSuccess('');
                setError('');
              }}
            >
              ↺ ล้างข้อมูล
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.primaryButton,
                background: pageConfig.color,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? 'กำลังบันทึก...'
                : '💾 บันทึกผลการตรวจสอบ'}
            </button>
          </div>
        )}
      </form>
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
    borderRadius: '20px',
    padding: '28px 30px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)',
  },

  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },

  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
  },

  heroLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    opacity: 0.8,
    marginBottom: 4,
  },

  heroTitle: {
    margin: 0,
    fontSize: 28,
  },

  heroSubtitle: {
    margin: '8px 0 0',
    opacity: 0.9,
    fontSize: 14,
  },

  heroBadge: {
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: '9px 14px',
    borderRadius: '999px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 16,
  },

  summaryCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    borderTop: '4px solid #2563EB',
    boxShadow:
      '0 8px 24px rgba(15, 23, 42, 0.05)',
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: '14px',
    background: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 600,
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0F172A',
    marginTop: 4,
  },

  card: {
    background: '#fff',
    padding: '26px',
    borderRadius: '18px',
    boxShadow:
      '0 10px 30px rgba(15, 23, 42, 0.06)',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },

  cardSubtitle: {
    color: '#64748B',
    margin: '6px 0 0',
    fontSize: 14,
  },

  typeBadge: {
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  divider: {
    height: 1,
    background: '#E2E8F0',
    margin: '22px 0',
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 800,
    fontSize: 16,
    color: '#0F172A',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 18,
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: 700,
    color: '#334155',
  },

  input: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: 14,
    boxSizing: 'border-box',
    background: '#fff',
  },

  progressSection: {
    marginTop: 28,
    padding: '18px',
    borderRadius: '14px',
    background: '#F8FAFC',
  },

  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    color: '#475569',
    fontSize: 13,
  },

  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    display: 'flex',
    background: '#E2E8F0',
  },

  resultBox: {
    marginTop: 22,
    border: '1px solid',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  resultIcon: {
    fontSize: 32,
  },

  resultLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 600,
  },

  resultText: {
    fontSize: 20,
    fontWeight: 800,
    marginTop: 4,
  },

  resultBadge: {
    color: '#fff',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 800,
  },

  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 28,
  },

  primaryButton: {
    border: 'none',
    color: '#fff',
    borderRadius: '10px',
    padding: '13px 20px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  },

  cancelButton: {
    border: '1px solid #CBD5E1',
    background: '#fff',
    color: '#475569',
    borderRadius: '10px',
    padding: '13px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  success: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#F0FDF4',
    color: '#166534',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #86EFAC',
  },

  readOnly: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#F8FAFC',
    color: '#475569',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
};