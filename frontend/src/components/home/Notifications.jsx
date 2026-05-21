import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, CheckCircle, RefreshCw, Filter, Settings, Check } from 'lucide-react';
import NotificationService from '../../services/notificationService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('');
  const [counts, setCounts] = useState({ urgent: 0, new: 0, recurring: 0 });

  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getNotifications();
      // If data is array
      if (Array.isArray(data)) {
        setNotifications(data);
        updateCounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications([]);
      updateCounts([]);
    }
  };

  const updateCounts = (data) => {
      const counts = {
          urgent: data.filter(n => n.type === 'urgent').length,
          new: data.filter(n => n.type === 'new').length,
          recurring: data.filter(n => n.type === 'recurring').length
      };
      setCounts(counts);
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for refresh event from SocketContext
    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, []);

  const filteredNotifications = filter 
    ? notifications.filter(n => n.type === filter)
    : notifications;

  return (
    <section className="notifications-section" id="notifications-section" style={{ padding: '80px 0', backgroundColor: '#fff' }}>
        <div className="container">
            <div className="notifications-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0 0 10px 0' }}>Latest Updates</h2>
                    <p style={{ color: '#6b7280' }}>Stay informed about new opportunities and deadlines</p>
                </div>
                <div className="notification-controls" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div className="filter-controls" style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                            <select 
                                id="notificationFilter" 
                                className="form-control" 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                style={{ 
                                    padding: '10px 10px 10px 36px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #d1d5db',
                                    appearance: 'none',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">All Notifications</option>
                                <option value="urgent">Urgent</option>
                                <option value="new">New Opportunities</option>
                                <option value="recurring">Regular Updates</option>
                            </select>
                        </div>
                        <button 
                            className="btn" 
                            onClick={fetchNotifications}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                    <div className="notification-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn" style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Check size={18} /> Mark All Read
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="notifications-container" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>
                <div className="notification-summary" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="summary-item" style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span className="summary-count" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', display: 'block' }}>{counts.urgent}</span>
                            <span className="summary-label" style={{ color: '#991b1b', fontWeight: '500' }}>Urgent</span>
                        </div>
                        <AlertTriangle size={32} className="text-red-500 opacity-50" />
                    </div>
                    <div className="summary-item" style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span className="summary-count" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', display: 'block' }}>{counts.new}</span>
                            <span className="summary-label" style={{ color: '#166534', fontWeight: '500' }}>New</span>
                        </div>
                        <Bell size={32} className="text-green-500 opacity-50" />
                    </div>
                    <div className="summary-item" style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span className="summary-count" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', display: 'block' }}>{counts.recurring}</span>
                            <span className="summary-label" style={{ color: '#1e40af', fontWeight: '500' }}>Regular</span>
                        </div>
                        <Calendar size={32} className="text-blue-500 opacity-50" />
                    </div>
                </div>
                
                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredNotifications.length === 0 ? (
                         <div className="no-notifications" style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>No notifications found</div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
                                style={{ 
                                    padding: '20px', 
                                    backgroundColor: notification.isRead ? '#f9fafb' : 'white', 
                                    borderRadius: '12px', 
                                    border: '1px solid #e5e7eb',
                                    borderLeft: notification.type === 'urgent' ? '4px solid #dc2626' : notification.type === 'new' ? '4px solid #16a34a' : '4px solid #2563eb',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    gap: '15px',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div className="notification-icon" style={{ padding: '10px', borderRadius: '50%', backgroundColor: '#f3f4f6' }}>
                                    {notification.type === 'urgent' && <AlertTriangle size={20} className="text-red-600" />}
                                    {notification.type === 'new' && <Bell size={20} className="text-green-600" />}
                                    {notification.type === 'recurring' && <Calendar size={20} className="text-blue-600" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600', color: '#111827' }}>{notification.title}</h4>
                                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{notification.date}</span>
                                    </div>
                                    <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>{notification.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </section>
  );
};

export default Notifications;
