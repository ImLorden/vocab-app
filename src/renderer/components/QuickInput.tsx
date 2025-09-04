import React, { useState, useEffect } from 'react';

const QuickInput: React.FC = () => {
  const [word, setWord] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const input = document.getElementById('word-input');
    if (input) {
      input.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || isTranslating) return;

    setIsTranslating(true);
    setMessage('正在翻译...');
    
    try {
      const result = await window.electronAPI.words.add(word.trim(), sourceLanguage);
      console.log('Translation result:', result);
      setMessage('翻译成功！');
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error) {
      console.error('Error adding word:', error);
      setMessage('翻译失败：' + (error as Error).message);
      setIsTranslating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.close();
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', 
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#1f2937', fontSize: '20px', margin: 0, fontWeight: 'bold' }}>
            添加新单词
          </h1>
          <button 
            onClick={() => window.close()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              单词
            </label>
            <input
              id="word-input"
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: '1px solid #d1d5db',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="输入要翻译的单词..."
              disabled={isTranslating}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              源语言
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: '1px solid #d1d5db',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              disabled={isTranslating}
            >
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="it">Italian</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!word.trim() || isTranslating}
            style={{ 
              width: '100%', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none',
              background: (!word.trim() || isTranslating) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: (!word.trim() || isTranslating) ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {isTranslating ? '翻译中...' : '翻译并保存'}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '16px', 
            padding: '8px 12px', 
            borderRadius: '6px', 
            background: message.includes('失败') ? '#fee2e2' : '#dcfce7',
            color: message.includes('失败') ? '#dc2626' : '#16a34a',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '16px', margin: '16px 0 0 0' }}>
          按 ESC 关闭窗口
        </p>
      </div>
    </div>
  );
};

export default QuickInput;