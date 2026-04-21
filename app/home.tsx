export default function Home() {

  const handleDownload = (gameName: string) => {
    alert("Скачивание " + gameName + " началось!");
  };

  const handleBuy = (gameName: string, price: string) => {
    alert("Игра " + gameName + " добавлена в корзину за " + price);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: 48 }}>INDIE STORE</h1>
      <p style={{ fontSize: 20, color: '#aaa', marginBottom: 40 }}>Игры от независимых разработчиков</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
        
        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 50, textAlign: 'center' }}>🧙</div>
          <h3>Dungeon Crawler</h3>
          <p style={{ color: '#ccc' }}>Мрачное подземелье, магия и лут.</p>
          <span style={{ color: '#4ecca3', fontWeight: 'bold' }}>Бесплатно</span>
          <br />
          <button onClick={() => handleDownload('Dungeon Crawler')} style={{ marginTop: 10, backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
            Скачать
          </button>
        </div>

        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 50, textAlign: 'center' }}>🚀</div>
          <h3>Space Miner</h3>
          <p style={{ color: '#ccc' }}>Копай астероиды, строй базу.</p>
          <span style={{ color: '#f9a826', fontWeight: 'bold' }}>299 руб</span>
          <br />
          <button onClick={() => handleBuy('Space Miner', '299 руб')} style={{ marginTop: 10, backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
            Купить
          </button>
        </div>

        <div style={{ backgroundColor: '#16213e', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 50, textAlign: 'center' }}>🌲</div>
          <h3>Silent Pines</h3>
          <p style={{ color: '#ccc' }}>Хоррор в заброшенном лагере.</p>
          <span style={{ color: '#4ecca3', fontWeight: 'bold' }}>Бесплатно</span>
          <br />
          <button onClick={() => handleDownload('Silent Pines')} style={{ marginTop: 10, backgroundColor: '#e94560', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
            Скачать
          </button>
        </div>

      </div>
    </div>
  );
}