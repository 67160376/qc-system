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

const getRoleName = (role) => {
  const roles = {
    ADMIN: 'ผู้ดูแลระบบ',
    QC: 'เจ้าหน้าที่ควบคุมคุณภาพ',
    PRODUCTION: 'ฝ่ายผลิต',
  };

  return roles[String(role || '').toUpperCase()] || 'ผู้ใช้งาน';
};

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
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        {/* โลโก้ */}
        <div style={styles.logoSection}>
          <div style={styles.logo}>
            <span style={{ fontSize: 20 }}>✓</span>
          </div>

          <div>
            <div style={styles.systemName}>
              QC SYSTEM
            </div>

            <div style={styles.systemSubtitle}>
              ระบบควบคุมคุณภาพสินค้า
            </div>
          </div>
        </div>

        {/* ส่วนรูปประกอบ */}
        <div style={styles.factoryBanner}>
          <div style={styles.bannerOverlay}>
            <div style={styles.bannerIcon}>🏭</div>

            <div>
              <strong style={styles.bannerTitle}>
                Quality Control
              </strong>

              <div style={styles.bannerText}>
                ควบคุมทุกขั้นตอนการผลิต
              </div>
            </div>
          </div>
        </div>

        {/* เมนู */}
        <div style={styles.menuContainer}>
          <div style={styles.menuLabel}>
            เมนูหลัก
          </div>

          <nav style={styles.nav}>
            {visibleMenu.map((item) => {
              const isActive =
                location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.menuItem,
                    ...(isActive
                      ? styles.activeMenuItem
                      : {}),
                  }}
                >
                  <span style={styles.menuIcon}>
                    {item.icon}
                  </span>

                  <span style={styles.menuText}>
                    {item.name}
                  </span>

                  {isActive && (
                    <span style={styles.activeDot} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ผู้ใช้งาน */}
        <div style={styles.bottomSection}>
          <div style={styles.userCard}>
            <div style={styles.avatar}>
              {(user?.username || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div style={styles.userInfo}>
              <strong style={styles.username}>
                {user?.username || 'ผู้ใช้งาน'}
              </strong>

              <span style={styles.userRole}>
                {getRoleName(user?.role)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            <span>🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ส่วนเนื้อหาหลัก */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.headerSmall}>
              ระบบจัดการคุณภาพ
            </div>

            <h1 style={styles.headerTitle}>
              ระบบควบคุมคุณภาพการผลิต
            </h1>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.statusOnline}>
              <span style={styles.onlineDot} />
              ระบบออนไลน์
            </div>

            <div style={styles.rolePill}>
              <span>👤</span>

              {getRoleName(user?.role)}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F1F5F9',
  },

  sidebar: {
    width: 280,
    minHeight: '100vh',
    background:
      'linear-gradient(180deg, #0F172A 0%, #111827 50%, #172554 100%)',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '6px 0 30px rgba(15, 23, 42, 0.12)',
  },

  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '22px 20px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background:
      'linear-gradient(135deg, #2563EB, #4F46E5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
  },

  systemName: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: '0.08em',
  },

  systemSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#94A3B8',
  },

  factoryBanner: {
    margin: '16px',
    minHeight: 110,
    borderRadius: 16,

    backgroundImage:
      'linear-gradient(135deg, rgba(30, 64, 175, 0.9), rgba(15, 23, 42, 0.88)), url("https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=80")',

    backgroundSize: 'cover',
    backgroundPosition: 'center',

    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },

  bannerOverlay: {
    height: '100%',
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    backdropFilter: 'blur(8px)',
  },

  bannerTitle: {
    fontSize: 14,
    display: 'block',
  },

  bannerText: {
    marginTop: 4,
    fontSize: 11,
    color: '#DBEAFE',
  },

  menuContainer: {
    flex: 1,
    padding: '8px 14px 20px',
  },

  menuLabel: {
    padding: '10px 10px 8px',
    fontSize: 10,
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.12em',
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },

  menuItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#CBD5E1',
    textDecoration: 'none',
    padding: '12px 12px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },

  activeMenuItem: {
    color: '#FFFFFF',
    background:
      'linear-gradient(90deg, rgba(37,99,235,0.95), rgba(59,130,246,0.65))',
    boxShadow: '0 6px 18px rgba(37,99,235,0.2)',
  },

  menuIcon: {
    width: 28,
    fontSize: 18,
    display: 'flex',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#FFFFFF',
  },

  bottomSection: {
    padding: 16,
    borderTop: '1px solid rgba(148, 163, 184, 0.15)',
    background: 'rgba(15, 23, 42, 0.35)',
  },

  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 8px 14px',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background:
      'linear-gradient(135deg, #3B82F6, #6366F1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#FFFFFF',
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },

  username: {
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  userRole: {
    fontSize: 11,
    color: '#94A3B8',
  },

  logoutButton: {
    width: '100%',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    color: '#E2E8F0',
    padding: '11px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  main: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    minHeight: 86,
    background: 'rgba(255,255,255,0.95)',
    borderBottom: '1px solid #E2E8F0',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
  },

  headerSmall: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 4,
  },

  headerTitle: {
    margin: 0,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  statusOnline: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12,
    color: '#15803D',
    background: '#F0FDF4',
    padding: '8px 12px',
    borderRadius: 999,
    fontWeight: 700,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#22C55E',
  },

  rolePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #DBEAFE',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
  },

  content: {
    flex: 1,
    padding: 28,
    maxWidth: 1600,
    width: '100%',
    boxSizing: 'border-box',
  },
};