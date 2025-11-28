import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, Pause, Trash2, Plus, Zap, 
  Disc, LayoutList, DownloadCloud 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './App.css';

function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'library'
  const [inputUrl, setInputUrl] = useState('');
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('masterPlaylist');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Player States
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const playerRef = useRef(null);
  const appWindow = getCurrentWindow();

  // --- EFEITOS & JANELA ---
  useEffect(() => {
    localStorage.setItem('masterPlaylist', JSON.stringify(playlist));
  }, [playlist]);

  const handleMinimize = () => appWindow.minimize();
  const handleToggleMaximize = async () => {
    const isMax = await appWindow.isMaximized();
    isMax ? appWindow.unmaximize() : appWindow.maximize();
  };
  const handleClose = () => appWindow.close();

  // --- AÇÕES ---
  const addTrack = () => {
    if (!inputUrl) return;
    const newTrack = {
      id: Date.now(),
      url: inputUrl,
      // Nome temporário, em produção usaríamos API
      name: inputUrl.replace(/(^\w+:|^)\/\//, '').split('/')[0] + ' Track' 
    };
    setPlaylist([newTrack, ...playlist]); // Adiciona no topo
    setInputUrl('');
    
    // Pequeno feedback visual: Muda para biblioteca após adicionar
    setTimeout(() => setActiveTab('library'), 300);
  };

  const playTrack = (index) => {
    if (currentTrackIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const deleteTrack = (e, index) => {
    e.stopPropagation();
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    if (currentTrackIndex === index) {
      setIsPlaying(false);
      setCurrentTrackIndex(null);
    } else if (currentTrackIndex > index) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  // --- RENDER ---
  return (
    <div className="app-container">
      {/* Background Animado */}
      <div className="aurora-bg"></div>

      {/* --- TITLEBAR --- */}
      <div className="titlebar" data-tauri-drag-region>
        <div className="brand" style={{pointerEvents:'none'}}>
          <Zap size={16} color="#a855f7" fill="#a855f7" />
          SONIC LAYER PRO
        </div>
        <div className="window-actions">
          <button onClick={handleMinimize} className="win-btn min-btn"></button>
          <button onClick={handleToggleMaximize} className="win-btn max-btn"></button>
          <button onClick={handleClose} className="win-btn close-btn"></button>
        </div>
      </div>

      {/* --- ABAS (NAV) --- */}
      <div className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} 
          onClick={() => setActiveTab('add')}
        >
          <DownloadCloud size={16} style={{marginRight:6, verticalAlign:'middle'}}/>
          BAIXAR / NOVO
          {activeTab === 'add' && <motion.div layoutId="tab-indicator" className="active-indicator" />}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`} 
          onClick={() => setActiveTab('library')}
        >
          <LayoutList size={16} style={{marginRight:6, verticalAlign:'middle'}}/>
          BIBLIOTECA
          {activeTab === 'library' && <motion.div layoutId="tab-indicator" className="active-indicator" />}
        </button>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="content-area">
        <AnimatePresence mode="wait">
          
          {/* ABA 1: ADICIONAR (Central de Comando) */}
          {activeTab === 'add' && (
            <motion.div 
              key="add"
              className="add-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="hero-input-container"
                initial={{ y: 20 }} animate={{ y: 0 }}
              >
                <Disc size={64} color="white" style={{ opacity: 0.1, marginBottom: 20, display:'block', margin:'0 auto 20px' }} />
                <h2 style={{fontSize: '24px', fontWeight:300, marginBottom: '24px'}}>Cole seu link mágico</h2>
                
                <input 
                  className="hero-input"
                  placeholder="https://youtube.com/..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTrack()}
                  autoFocus
                />
                
                <button className="hero-btn" onClick={addTrack}>
                  <Plus size={18} /> Adicionar à Coleção
                </button>
                
                <p style={{fontSize:'12px', color:'rgba(255,255,255,0.3)', marginTop: 24}}>
                  Suporta YouTube, SoundCloud, Vimeo e Twitch
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ABA 2: BIBLIOTECA (Lista) */}
          {activeTab === 'library' && (
            <motion.div 
              key="library"
              className="library-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {playlist.length === 0 ? (
                 <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#555'}}>
                    Vazio como o espaço sideral.
                 </div>
              ) : (
                <div style={{marginTop: '10px'}}>
                  {playlist.map((track, index) => (
                    <motion.div 
                      key={track.id}
                      className={`track-card ${currentTrackIndex === index ? 'active' : ''}`}
                      onClick={() => playTrack(index)}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Ícone ou Equalizador */}
                      <div style={{ width: 24, display:'flex', justifyContent:'center' }}>
                        {currentTrackIndex === index && isPlaying ? (
                          <div className="equalizer active">
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                          </div>
                        ) : (
                          <span style={{color:'var(--text-dim)', fontSize:12}}>{index + 1}</span>
                        )}
                      </div>

                      <div className="track-info">
                        <div className="track-name">{track.name}</div>
                        <div className="track-meta">{track.url}</div>
                      </div>

                      <button className="delete-action" onClick={(e) => deleteTrack(e, index)}>
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- PLAYER GLOBAL (Footer) --- */}
      <div className="master-player">
        <button 
          className="play-toggle" 
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={currentTrackIndex === null}
          style={{ opacity: currentTrackIndex === null ? 0.5 : 1 }}
        >
          {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>

        <div className="track-display">
          <h4>
            {currentTrackIndex !== null ? playlist[currentTrackIndex]?.name : 'Sonic Layer Pro'}
          </h4>
          <div className="progress-container">
            <motion.div 
              className="progress-bar" 
              initial={{ width: 0 }}
              animate={{ width: `${played * 100}%` }}
              transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
            />
          </div>
        </div>

        {/* Info extra (opcional) */}
        <div style={{fontSize:12, color:'var(--text-dim)'}}>
          {Math.round(played * 100)}%
        </div>
      </div>

      {/* Engine Invisível */}
      <div style={{ display: 'none' }}>
        <ReactPlayer
          ref={playerRef}
          url={playlist[currentTrackIndex]?.url}
          playing={isPlaying}
          volume={0.8}
          onProgress={(state) => setPlayed(state.played)}
          onEnded={() => {
            if (currentTrackIndex < playlist.length - 1) playTrack(currentTrackIndex + 1);
            else setIsPlaying(false);
          }}
        />
      </div>
    </div>
  );
}

export default App;