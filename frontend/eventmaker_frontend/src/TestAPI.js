import React, { useState, useEffect } from 'react';

const TestAPI = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Используем наш API клиент
      const { eventAPI } = await import('./api');
      const result = await eventAPI.getAllEvents();
      setData(result);
      console.log('API Response:', result);
    } catch (err) {
      setError(`Ошибка подключения: ${err.message}`);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>🧪 Тест подключения к Django API</h3>
      
      <button 
        onClick={testConnection} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Тестируем...' : 'Тест API'}
      </button>

      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '5px'
        }}>
          ❌ {error}
        </div>
      )}

      {data && (
        <div style={{ 
          color: 'green', 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#e6ffe6',
          borderRadius: '5px'
        }}>
          ✅ Подключение успешно! Получено {Array.isArray(data) ? data.length : 'данных'}: 
          <pre style={{ marginTop: '10px', fontSize: '12px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
