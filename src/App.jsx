import { useState, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import LevelSelectScreen from './components/LevelSelectScreen';
import SwipeScreen from './components/SwipeScreen';
import ReviewScreen from './components/ReviewScreen';
import SentenceScreen from './components/SentenceScreen';
import ImportScreen from './components/ImportScreen';
import './App.css';

export default function App() {
  const [screen, setScreen]           = useState('home');
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [refreshKey, setRefreshKey]   = useState(0);

  const navigate = useCallback((s) => setScreen(s), []);

  const openSentence = (word) => {
    setSelectedWord(word);
    setScreen('sentence');
  };

  const refresh = () => setRefreshKey(n => n + 1);

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setScreen('swipe');
  };

  const tabs = [
    { id: 'home',         label: 'Home',   icon: '🏠' },
    { id: 'level-select', label: 'Swipe',  icon: '🃏' },
    { id: 'review',       label: 'Review', icon: '📚' },
    { id: 'import',       label: 'Data',   icon: '📂' },
  ];

  const activeTab = screen === 'swipe' ? 'level-select' : screen;

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={navigate} key={`home-${refreshKey}`} />;
      case 'level-select':
        return <LevelSelectScreen onSelectLevel={handleSelectLevel} onNavigate={navigate} key={`ls-${refreshKey}`} />;
      case 'swipe':
        return <SwipeScreen onNavigate={navigate} selectedLevel={selectedLevel} key={`swipe-${refreshKey}-${selectedLevel}`} />;
      case 'review':
        return <ReviewScreen onNavigate={navigate} onOpenSentence={openSentence} key={`review-${refreshKey}`} />;
      case 'sentence':
        return <SentenceScreen word={selectedWord} onBack={() => setScreen('review')} key={selectedWord?.id} />;
      case 'import':
        return <ImportScreen onNavigate={navigate} onRefresh={refresh} key={screen} />;
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      <div className="screen-container">
        {renderScreen()}
      </div>

      {screen !== 'sentence' && (
        <nav className="bottom-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => navigate(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
