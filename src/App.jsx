import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, Pause, Trash2, Plus, Zap, 
  Disc, LayoutList, DownloadCloud, Music 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './App.css';

function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('add');
  const [inputUrl, setInputUrl] = useState('');
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('masterPlaylist');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Player States
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
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

  // --- EXTRAIR METADADOS DA URL ---
  const extractVideoInfo = (url) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return {
        id: youtubeMatch[1],
        platform: 'youtube',
        name: `YouTube Video - ${youtubeMatch[1].substring(0, 8)}`,
        thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`
      };
    }
    
    // SoundCloud
    if (url.includes('soundcloud.com')) {
      const parts = url.split('/').filter(p => p);
      return {
        id: Date.now().toString(),
        platform: 'soundcloud',
        name: parts[parts.length - 1]?.replace(/-/g, ' ') || 'SoundCloud Track',
        thumbnail: null
      };
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        id: vimeoMatch[1],
        platform: 'vimeo',
        name: `Vimeo Video - ${vimeoMatch[1]}`,
        thumbnail: null
      };
    }
    
    // Genérico
    return {
      id: Date.now().toString(),
      platform: 'generic',
      name: 'Áudio/Vídeo',
      thumbnail: null
    };
  };

  // --- AÇÕES ---
  const addTrack = () => {
    if (!inputUrl.trim()) return;
    
    // Verifica se a URL é suportada
    if (!ReactPlayer.canPlay(inputUrl)) {
      alert('URL não suportada! Use YouTube, SoundCloud, Vimeo ou Twitch.');
      return;
    }
    
    const info = extractVideoInfo(inputUrl);
    const newTrack = {
      id: Date.now(),
      url: inputUrl,
      name: info.name,
      platform: info.platform,
      thumbnail: info.thumbnail,
      addedAt: new Date().toISOString()
    };
    
    setPlaylist([newTrack, ...playlist]);
    setInputUrl('');
    
    setTimeout(() => setActiveTab('library'), 300);
  };

  const playTrack = (index) => {
    if (currentTrackIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setReady(false);
      setPlayed(0);
    }
  };

  const deleteTrack = (e, index) => {
    e.stopPropagation();
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    if (currentTrackIndex === index) {
      setIsPlaying(false);
      setCurrentTrackIndex(null);
      setPlayed(0);
    } else if (currentTrackIndex > index) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const togglePlayPause = () => {
    if (currentTrackIndex === null && playlist.length > 0) {
      playTrack(0);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const skipToNext = () => {
    if (currentTrackIndex !== null && currentTrackIndex < playlist.length - 1) {
      playTrack(currentTrackIndex + 1);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTrack = currentTrackIndex !== null ? playlist[currentTrackIndex] : null;

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
          BIBLIOTECA ({playlist.length})
          {activeTab === 'library' && <motion.div layoutId="tab-indicator" className="active-indicator" />}
        </button>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="content-area">
        <AnimatePresence mode="wait">
          
          {/* ABA 1: ADICIONAR */}
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
                  placeholder="https://youtube.com/watch?v=..."
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

          {/* ABA 2: BIBLIOTECA */}
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
                 <div style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#555', gap:16}}>
                    <Music size={48} style={{opacity:0.3}} />
                    <p>Vazio como o espaço sideral.</p>
                    <button 
                      onClick={() => setActiveTab('add')} 
                      style={{
                        background:'rgba(168,85,247,0.1)', 
                        border:'1px solid rgba(168,85,247,0.3)',
                        padding:'8px 16px',
                        borderRadius:8,
                        color:'#a855f7',
                        cursor:'pointer',
                        fontSize:12
                      }}
                    >
                      Adicionar primeira música
                    </button>
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
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      {/* Thumbnail ou Ícone */}
                      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        {track.thumbnail ? (
                          <img 
                            src={track.thumbnail} 
                            alt={track.name}
                            style={{width:'100%', height:'100%', objectFit:'cover'}}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div style={{
                            width:'100%', 
                            height:'100%', 
                            background:'rgba(168,85,247,0.1)',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center'
                          }}>
                            <Music size={20} color="#a855f7" />
                          </div>
                        )}
                      </div>

                      {/* Número ou Equalizador */}
                      <div style={{ width: 32, display:'flex', justifyContent:'center', marginLeft:12 }}>
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
                        <div className="track-meta">
                          <span style={{textTransform:'uppercase', fontSize:10, opacity:0.6}}>
                            {track.platform}
                          </span>
                        </div>
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
          onClick={togglePlayPause}
          disabled={playlist.length === 0}
          style={{ opacity: playlist.length === 0 ? 0.5 : 1 }}
        >
          {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>

        <div className="track-display">
          <h4>
            {currentTrack ? currentTrack.name : 'Sonic Layer Pro'}
          </h4>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4}}>
            <span style={{fontSize:10, color:'var(--text-dim)', minWidth:35}}>
              {formatTime(played * duration)}
            </span>
            <div className="progress-container" style={{flex:1}}>
              <motion.div 
                className="progress-bar" 
                style={{ width: `${played * 100}%` }}
              />
            </div>
            <span style={{fontSize:10, color:'var(--text-dim)', minWidth:35}}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Badge de status */}
        {ready && isPlaying && (
          <div style={{
            fontSize:10, 
            color:'#22c55e',
            background:'rgba(34,197,94,0.1)',
            padding:'4px 8px',
            borderRadius:4,
            border:'1px solid rgba(34,197,94,0.2)'
          }}>
            PLAYING
          </div>
        )}
      </div>

      {/* Engine Invisível - ReactPlayer com configuração correta */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
        {currentTrack && (
          <ReactPlayer
            ref={playerRef}
            url={currentTrack.url}
            playing={isPlaying}
            volume={0.8}
            width="0"
            height="0"
            config={{
              youtube: {
                playerVars: { 
                  showinfo: 0,
                  controls: 0,
                  modestbranding: 1
                }
              },
              soundcloud: {
                options: {
                  auto_play: false,
                  buying: false,
                  sharing: false,
                  download: false,
                  show_artwork: true
                }
              }
            }}
            onReady={() => {
              setReady(true);
              console.log('Player ready:', currentTrack.name);
            }}
            onStart={() => console.log('Playback started')}
            onPlay={() => console.log('Playing...')}
            onPause={() => console.log('Paused')}
            onBuffer={() => console.log('Buffering...')}
            onError={(error) => {
              console.error('Player error:', error);
              alert('Erro ao reproduzir. Verifique a URL e tente novamente.');
            }}
            onProgress={(state) => {
              setPlayed(state.played);
            }}
            onDuration={(dur) => {
              setDuration(dur);
              console.log('Duration:', dur);
            }}
            onEnded={() => {
              console.log('Track ended');
              skipToNext();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;