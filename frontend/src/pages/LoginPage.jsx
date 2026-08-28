import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: 'admin',
    password: 'admin123',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/login', form);

      login({
        userData: data.user,
        accessToken: data.token,
      });

      navigate('/');
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ฝั่งภาพและข้อมูลระบบ */}
      <div style={styles.visualSection}>
        <div style={styles.overlay}>
          <div style={styles.brand}>
            <div style={styles.brandLogo}>✓</div>

            <div>
              <div style={styles.brandName}>QC SYSTEM</div>
              <div style={styles.brandSubtitle}>
                ระบบควบคุมคุณภาพการผลิต
              </div>
            </div>
          </div>

          <div style={styles.heroContent}>
            <div style={styles.qualityTag}>
              🏭 ระบบควบคุมคุณภาพ
            </div>

            <h1 style={styles.heroTitle}>
              ยกระดับมาตรฐาน
              <br />
              การควบคุมคุณภาพ
            </h1>

            <p style={styles.heroText}>
              ระบบจัดการและติดตามกระบวนการตรวจสอบคุณภาพสินค้า
              ตั้งแต่วัตถุดิบจนถึงสินค้าสำเร็จรูป
            </p>

            <div style={styles.featureList}>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>✓</div>
                <span>ตรวจสอบคุณภาพแบบเป็นระบบ</span>
              </div>

              <div style={styles.feature}>
                <div style={styles.featureIcon}>📊</div>
                <span>ติดตามผลการตรวจสอบแบบเรียลไทม์</span>
              </div>

              <div style={styles.feature}>
                <div style={styles.featureIcon}>⚠️</div>
                <span>แจ้งเตือนและติดตามปัญหา NCR</span>
              </div>
            </div>
          </div>

          <div style={styles.visualFooter}>
            © 2026 QC Manufacturing System
          </div>
        </div>
      </div>

      {/* ฝั่งเข้าสู่ระบบ */}
      <div style={styles.loginSection}>
        <div style={styles.loginBox}>
          <div style={styles.mobileLogo}>
            <div style={styles.mobileLogoIcon}>✓</div>

            <div>
              <strong>QC SYSTEM</strong>
              <div style={styles.mobileSubtitle}>
                ระบบควบคุมคุณภาพ
              </div>
            </div>
          </div>

          <div style={styles.formHeader}>
            <div style={styles.welcomeText}>
              ยินดีต้อนรับกลับมา 👋
            </div>

            <h2 style={styles.title}>
              เข้าสู่ระบบ
            </h2>

            <p style={styles.description}>
              กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าสู่ระบบ
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <label style={styles.label}>
              ชื่อผู้ใช้งาน
            </label>

            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>👤</span>

              <input
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="กรอกชื่อผู้ใช้งาน"
                style={styles.input}
                autoComplete="username"
              />
            </div>

            <label
              style={{
                ...styles.label,
                marginTop: 18,
              }}
            >
              รหัสผ่าน
            </label>

            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔒</span>

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="กรอกรหัสผ่าน"
                style={styles.input}
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div style={styles.error}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}>◌</span>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span />
            <span>ระบบจัดการคุณภาพการผลิต</span>
            <span />
          </div>

          <div style={styles.securityNote}>
            🔐 ข้อมูลของคุณได้รับการป้องกันอย่างปลอดภัย
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    background: '#FFFFFF',
  },

  visualSection: {
    position: 'relative',
    minHeight: '100vh',
    backgroundImage:
      'url("https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=1600&q=85")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#FFFFFF',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    padding: '36px 52px',
    display: 'flex',
    flexDirection: 'column',
    background:
      'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,64,175,0.82) 55%, rgba(37,99,235,0.7) 100%)',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },

  brandLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background:
      'linear-gradient(135deg, #3B82F6, #6366F1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 800,
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  },

  brandName: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  brandSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#CBD5E1',
  },

  heroContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: 650,
    paddingBottom: 40,
  },

  qualityTag: {
    width: 'fit-content',
    padding: '8px 14px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 24,
  },

  heroTitle: {
    margin: 0,
    fontSize: 48,
    lineHeight: 1.15,
    letterSpacing: '-0.04em',
    fontWeight: 800,
  },

  heroText: {
    marginTop: 22,
    maxWidth: 560,
    color: '#DBEAFE',
    fontSize: 16,
    lineHeight: 1.8,
  },

  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginTop: 30,
  },

  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    fontWeight: 600,
    color: '#E0F2FE',
  },

  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.13)',
    border: '1px solid rgba(255,255,255,0.12)',
  },

  visualFooter: {
    color: '#94A3B8',
    fontSize: 12,
  },

  loginSection: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background:
      'radial-gradient(circle at top right, #EFF6FF 0%, transparent 35%), #FFFFFF',
  },

  loginBox: {
    width: '100%',
    maxWidth: 440,
  },

  mobileLogo: {
    display: 'none',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },

  mobileLogoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: '#2563EB',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
  },

  mobileSubtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 11,
  },

  formHeader: {
    marginBottom: 34,
  },

  welcomeText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },

  title: {
    margin: 0,
    color: '#0F172A',
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },

  description: {
    marginTop: 12,
    color: '#64748B',
    lineHeight: 1.6,
    fontSize: 14,
  },

  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 8,
  },

  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  inputIcon: {
    position: 'absolute',
    left: 15,
    fontSize: 16,
    pointerEvents: 'none',
    zIndex: 1,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px 14px 46px',
    borderRadius: 12,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    fontSize: 15,
    color: '#0F172A',
    outline: 'none',
  },

  error: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#FEF2F2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
    borderRadius: 10,
    padding: '11px 13px',
    fontSize: 13,
  },

  button: {
    width: '100%',
    marginTop: 24,
    border: 'none',
    borderRadius: 12,
    padding: '15px 18px',
    background:
      'linear-gradient(135deg, #2563EB, #4F46E5)',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 10px 24px rgba(37,99,235,0.25)',
  },

  buttonDisabled: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },

  spinner: {
    fontSize: 18,
  },

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '30px 0 18px',
    color: '#94A3B8',
    fontSize: 11,
  },

  securityNote: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
  },
};