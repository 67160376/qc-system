import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menu = [
  {
    name: 'แดชบอร์ด',
    path: '/',
    icon: '📊',
    roles: ['ADMIN', 'QC', 'PRODUCTION'],
  },
  {
    name: 'จัดการสินค้า',
    path: '/products',
    icon: '📦',
    roles: ['ADMIN', 'QC', 'PRODUCTION'],
  },
  {
    name: 'ประวัติการตรวจสอบ',
    path: '/inspection-history',
    icon: '🧾',
    roles: ['ADMIN', 'QC', 'PRODUCTION'],
  },
  {
    name: 'ตรวจสอบวัตถุดิบเข้า',
    path: '/incoming-qc',
    icon: '🔍',
    roles: ['ADMIN', 'QC'],
  },
  {
    name: 'ตรวจสอบระหว่างการผลิต',
    path: '/in-process-qc',
    icon: '⚙️',
    roles: ['ADMIN', 'QC'],
  },
  {
    name: 'ตรวจสอบสินค้าสำเร็จรูป',
    path: '/final-qc',
    icon: '✅',
    roles: ['ADMIN', 'QC'],
  },
  {
    name: 'การแจ้งเตือน',
    path: '/alerts',
    icon: '⚠️',
    roles: ['ADMIN', 'QC', 'PRODUCTION'],
  },
  {
    name: 'ติดตามรายงาน NCR',
    path: '/ncrs',
    icon: '📄',
    roles: ['ADMIN', 'QC', 'PRODUCTION'],
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, hasRole } = useAuth();

  const visibleMenu = menu.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#F8FAFC',
      }}
    >
      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logo}>QC</div>

          <div>
            <strong>ระบบควบคุมคุณภาพ</strong>

            <div style={{ fontSize: 12, color: '#CBD5E1' }}>
              ระบบจัดการคุณภาพการผลิต
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 16px' }}>
          {visibleMenu.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.menuItem,
                  ...(isActive ? styles.activeMenuItem : {}),
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.logoutWrap}>
          <div style={styles.userMeta}>
            <span>{user?.username || 'ผู้ใช้งาน'}</span>

            <strong>{user?.role || 'ไม่ระบุสิทธิ์'}</strong>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={styles.header}>
          <div>
            <strong style={{ fontSize: 28 }}>
              ระบบจัดการควบคุมคุณภาพการผลิต
            </strong>
          </div>

          <div style={styles.rolePill}>
            {user?.role || 'UNKNOWN'}
          </div>
        </header>

        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 260,
    background: '#0F172A',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(148,163,184,0.2)',
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: '10px',
    background: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
  },

  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#E2E8F0',
    textDecoration: 'none',
    padding: '12px 12px',
    borderRadius: '10px',
    marginBottom: '8px',
    fontWeight: 500,
  },

  activeMenuItem: {
    background: '#1E293B',
    color: '#fff',
  },

  logoutWrap: {
    borderTop: '1px solid rgba(148,163,184,0.2)',
    padding: '16px',
  },

  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 12,
    color: '#E2E8F0',
    fontSize: 13,
  },

  logoutButton: {
    width: '100%',
    border: 'none',
    borderRadius: '10px',
    background: '#1E293B',
    color: '#fff',
    padding: '12px',
    cursor: 'pointer',
    fontWeight: 600,
  },

  header: {
    background: '#fff',
    borderBottom: '1px solid #E2E8F0',
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rolePill: {
    background: '#DBEAFE',
    color: '#1D4ED8',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
};