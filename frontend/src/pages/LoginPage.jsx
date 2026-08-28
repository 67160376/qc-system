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
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>QC</div>
        </div>

        <h2 style={{ marginBottom: 8 }}>
          ระบบควบคุมคุณภาพ
        </h2>

        <div style={styles.subtitle}>
          ระบบจัดการควบคุมคุณภาพการผลิต
        </div>

        <form onSubmit={onSubmit}>
          <label style={styles.label}>
            ชื่อผู้ใช้งาน
          </label>

          <input
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="กรอกชื่อผู้ใช้งาน"
            style={styles.input}
          />

          <label
            style={{
              ...styles.label,
              marginTop: 16,
            }}
          >
            รหัสผ่าน
          </label>

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="กรอกรหัสผ่าน"
            style={styles.input}
          />

          {error ? (
            <div style={styles.error}>
              {error}
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
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={styles.footer}>
          QC Manufacturing System
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #2563EB 100%)',
  },

  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: '18px',
    padding: '32px 26px',
    boxShadow: '0 15px 30px rgba(15, 23, 42, 0.25)',
  },

  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 12,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: '16px',
    background: '#2563EB',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 800,
  },

  subtitle: {
    color: '#64748B',
    marginBottom: 24,
  },

  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: 8,
    color: '#334155',
  },

  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: 15,
    marginBottom: 8,
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    marginTop: 18,
    border: 'none',
    borderRadius: '10px',
    background: '#2563EB',
    color: '#fff',
    padding: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  error: {
    marginTop: 12,
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #FCA5A5',
  },

  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
  },
};