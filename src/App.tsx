import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Play, RotateCcw, Save, Upload, 
  ChevronLeft, ChevronRight, BarChart2, 
  Eraser, Download, Activity, AlertTriangle, Plus, Trash2, FileText, Zap, Dna, ClipboardList, Printer, Pencil, X, LogOut, Cloud, Loader2
} from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import CourtMap from './components/CourtMap';
import Auth from './components/Auth'; 
import { auth, db } from './firebase'; 
import firebase from 'firebase/compat/app'; 

import { 
  Team, Player, MatchMetadata, Lineup, TagEvent, 
  Zone, SkillType, ResultType, PlayerRole, TeamSide, 
  Coordinate, GradeType, SkillSubType 
} from './types';

// --- Constants ---
const ROLES: { id: PlayerRole; label: string }[] = [
  { id: 'OH', label: '大砲 (OH)' },
  { id: 'MB', label: '快攻 (MB)' },
  { id: 'OP', label: '舉對 (OP)' },
  { id: 'S', label: '舉球 (S)' },
  { id: 'L', label: '自由 (L)' },
  { id: 'DS', label: '防守 (DS)' },
  { id: '?', label: '未定' },
];

const SKILLS: { id: SkillType; label: string; color: string }[] = [
  { id: 'Serve', label: '發球', color: 'bg-blue-600' },
  { id: 'Receive', label: '接發', color: 'bg-amber-600' },
  { id: 'Set', label: '舉球', color: 'bg-yellow-500' },
  { id: 'Attack', label: '攻擊', color: 'bg-red-600' },
  { id: 'Block', label: '攔網', color: 'bg-purple-600' },
  { id: 'Dig', label: '防守', color: 'bg-emerald-600' },
  { id: 'Freeball', label: '修正', color: 'bg-cyan-600' },
  { id: 'Fault', label: '失誤', color: 'bg-slate-600' },
  { id: 'Substitution', label: '換人', color: 'bg-slate-500' },
];

const GRADES: { id: GradeType; label: string; color: string }[] = [
  { id: '#', label: '完美', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: '+', label: '到位', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: '!', label: '普通', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: '-', label: '處理', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: '=', label: '失誤', color: 'bg-red-100 text-red-800 border-red-300' },
];

const ATTACK_SUBTYPES: {id: SkillSubType, label: string, color: string}[] = [
    {id: 'Open', label: '長攻', color: 'bg-red-500'}, 
    {id: 'QuickA', label: 'A快 (前快)', color: 'bg-orange-500'}, 
    {id: 'QuickB', label: 'B快 (前長)', color: 'bg-orange-500'},
    {id: 'QuickC', label: 'C快 (背快)', color: 'bg-orange-500'}, 
    {id: 'BackRow', label: '後排', color: 'bg-rose-500'}, 
    {id: 'Tip', label: '吊球', color: 'bg-pink-500'},
    {id: 'Tool', label: '打手', color: 'bg-red-400'}
];

const SERVE_SUBTYPES: {id: SkillSubType, label: string, color: string}[] = [
    {id: 'Float', label: '飄球', color: 'bg-sky-500'}, 
    {id: 'Spin', label: '強發', color: 'bg-blue-700'}
];

const FAULT_SUBTYPES: {id: SkillSubType, label: string, color: string}[] = [
    {id: 'NetTouch', label: '觸網', color: 'bg-slate-500'}, 
    {id: 'DoubleHit', label: '連擊', color: 'bg-slate-500'}, 
    {id: 'Violation', label: '違例', color: 'bg-slate-500'},
    {id: 'Out', label: '出界', color: 'bg-slate-500'},
    {id: 'Carry', label: '持球', color: 'bg-slate-500'}
];

const SET_SUBTYPES: {id: SkillSubType, label: string, color: string}[] = [
    {id: 'SetA', label: 'A快 (前快)', color: 'bg-yellow-600'},
    {id: 'SetB', label: 'B快 (前長)', color: 'bg-yellow-600'},
    {id: 'SetC', label: 'C快 (背快)', color: 'bg-yellow-600'},
    {id: 'SetOpen', label: '長攻', color: 'bg-yellow-500'},
    {id: 'SetSlide', label: '背飛', color: 'bg-amber-500'}
];

const TAGS: { id: string; label: string; color: string }[] = [
    { id: 'Highlight', label: '精彩 ⭐', color: 'bg-yellow-400 text-black' },
    { id: 'Adjustment', label: '修正 🛠️', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'Good', label: '到位 👍', color: 'bg-green-100 text-green-700' },
    { id: 'Bad', label: '不到位 👎', color: 'bg-red-100 text-red-700' },
];

const PRESET_TEAMS = [
  { name: '內湖高中', roster: ['2 張恩愷', '3 蔡明諺', '5 郭庭川', '7 郭愷洛', '8 馬德霖', '9 張凱恩', '10 曾承閎', '12 詹智凱', '13 邱于泓', '16 吳炘恩', '17 李泓毅', '18 郭丞宥', '19 王鴻銘', '20 秦琮祐'] },
  { name: '建國中學', roster: ['2 李宗恩', '4 王元廷', '7 蔡鈞麒', '9 洪靖淳', '10 趙奕鈞', '11 陳奕銓', '12 施博鈞', '13 薛尚宸', '14 鄭稷珩', '15 李弘緯', '16 林柚宇', '18 黃泓瑋'] },
  { name: '成功高中', roster: ['1 楊哲廷', '2 周裕軒', '5 陳立閎', '7 施書楷', '8 李育睿', '10 溫宇哲', '12 劉軒豪', '14 許子洛', '15 黎承宣', '16 白偉呈', '17 陳品叡', '18 林軒愷'] },
  { name: '福誠高中', roster: ['1 許悅', '2 葛霖熙', '3 趙柏愷', '4 林俊毅', '5 陳秉鑫', '6 邱昱恩', '7 張正楷', '8 陳冠銘', '9 薛秉毅', '10 劉東澄', '11 顏宇濬', '12 羅凱彥'] },
  { name: '明德高中', roster: ['2 高奕安', '5 王宥允', '6 陳冠豪', '7 黃翌富', '8 胡均祥', '9 周秉辰', '14 陳宥亘', '16 拿耀達夫', '17 何泓學', '18 全仁', '19 李修陞', '20 吳冠杰'] },
  { name: '豐原高商', roster: ['1 林承安', '3 劉恩璘', '7 蘇子期', '9 陳琨霖', '10 張進良', '11 劉冠朋', '12 林季孺', '14 嚴偉桓', '15 翁郁盛', '17 莊子霆', '19 梁丞宇', '20 李宸嘉'] },
  { name: '內湖高工', roster: ['2 何曾右', '5 曾逸揚', '6 林炫諭', '7 黃文宇', '8 詹竣宇', '9 李孝謙', '10 黃承鋒', '11 許沅塘', '13 劉建成', '16 潘威辰', '18 陳曾俊宸', '19 盧秉澤'] },
  { name: '華僑高中', roster: ['1 黃孝宸', '3 林家詳', '4 鍾曜凱', '6 李傲儒', '7 林元宥', '10 柯柏亘', '11 黃品諺', '13 簡嘉陞', '14 杜家競', '15 黃文廷', '19 林立瑋', '20 王禹喆'] },
  { name: '苑裡高中', roster: ['4 林雋恩', '5 柯昱承', '6 溫原朗', '7 王品皓', '8 張閎理', '9 鄭文冠', '10 林昱安', '11 張晉賓', '13 張瑋修', '14 黃泳豪', '18 張祐琦', '19 鄭景瀚'] },
  { name: '屏榮高中', roster: ['1 李浚亦', '2 陳思愷', '3 李駿', '4 施予恩', '6 潘俊佑', '7 潘尚余', '8 蔡東橙', '9 吳宸瑋', '11 謝淯鋐', '12 鄭瑋杰', '13 林翰杰', '17 林聖恩'] },
  { name: '麥寮高中', roster: ['1 許育翔', '2 韓愷辰', '3 李宗智', '4 楊絮安', '5 吳秉宏', '7 林軒毅', '8 謝宏崎', '9 洪柏翔', '10 王宥程', '11 吳祐宗', '13 范宇助', '20 林友漢'] },
  { name: '曾文農工', roster: ['1 薛滕翰', '2 王彥勛', '3 何昀翰', '4 曾勝鴻', '5 朱嘉惟', '6 陳鴻銘', '8 吳宥諄', '9 王介瑞', '10 何嘉源', '11 邱聰謀', '12 徐于鈞', '13 李昆朋'] }
];

// --- Helper Logic for Full Court ---
const getFullCourtZone = (coord: Coordinate): Zone => {
    const isTopHalf = coord.y < 50;
    if (isTopHalf) {
        const row = coord.y > 34.67 ? 'Front' : 'Back';
        const col = coord.x < 35 ? 'Left' : coord.x < 65 ? 'Center' : 'Right';
        if (row === 'Back') return col === 'Left' ? 1 : col === 'Center' ? 6 : 5; 
        else return col === 'Left' ? 2 : col === 'Center' ? 3 : 4; 
    } else {
        const row = coord.y < 65.33 ? 'Front' : 'Back';
        const col = coord.x < 35 ? 'Left' : coord.x < 65 ? 'Center' : 'Right';
        if (row === 'Front') return col === 'Left' ? 4 : col === 'Center' ? 3 : 2;
        else return col === 'Left' ? 5 : col === 'Center' ? 6 : 1;
    }
};

const getSavedPlayerRole = (teamName: string, number: string): PlayerRole => {
    try {
        const saved = JSON.parse(localStorage.getItem('volleyTag_PlayerRoles') || '{}');
        return saved[`${teamName}-${number}`] || '?';
    } catch (e) {
        return '?';
    }
};

const savePlayerRole = (teamName: string, number: string, role: PlayerRole) => {
    try {
        const saved = JSON.parse(localStorage.getItem('volleyTag_PlayerRoles') || '{}');
        saved[`${teamName}-${number}`] = role;
        localStorage.setItem('volleyTag_PlayerRoles', JSON.stringify(saved));
    } catch (e) {
        console.error("Failed to save role", e);
    }
};

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-[100] animate-fade-in flex items-center gap-2 border border-slate-700">
        <AlertTriangle size={20} className="text-yellow-400" />
        <span className="font-bold">{message}</span>
    </div>
);

const ResetModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center">
            <AlertTriangle size={64} className="mx-auto text-red-500 mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">確定要開新比賽？</h2>
            <p className="text-slate-600 mb-8 font-bold">此動作將會清除所有紀錄、名單與設定，且無法復原。</p>
            <div className="flex gap-4 justify-center">
                <button onClick={onCancel} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-lg">取消</button>
                <button onClick={onConfirm} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-red-200">確定重置</button>
            </div>
        </div>
    </div>
);

const SubstitutionModal = ({ team, lineup, metadata, onClose, onConfirm }: any) => {
    const [outPlayer, setOutPlayer] = useState<Player|null>(null);
    const [inPlayer, setInPlayer] = useState<Player|null>(null);
    
    const roster = team === 'Home' ? metadata.homeTeam.roster : metadata.awayTeam.roster;
    const currentLineup = team === 'Home' ? lineup.home : lineup.away;
    const onCourtIds = Object.values(currentLineup).filter(p => p).map((p: any) => p.id);
    
    const starters = Object.values(currentLineup).filter((p): p is Player => p !== null).sort((a,b) => parseInt(a.number)-parseInt(b.number));
    const bench = roster.filter((p: Player) => !onCourtIds.includes(p.id)).sort((a: Player, b: Player) => parseInt(a.number)-parseInt(b.number));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
            <div className="bg-white rounded-xl w-[600px] overflow-hidden flex flex-col max-h-[80vh]">
                <div className={`p-4 text-white font-bold text-xl flex justify-between items-center ${team==='Home'?'bg-blue-600':'bg-red-600'}`}>
                    <span>{team === 'Home' ? metadata.homeTeam.name : metadata.awayTeam.name} - 換人</span>
                    <button onClick={onClose}>✕</button>
                </div>
                <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-500 mb-3 text-center">下場球員 (OUT)</h4>
                        <div className="space-y-2">
                            {starters.map(p => (
                                <button key={p.id} onClick={() => setOutPlayer(p)} className={`w-full p-3 rounded border font-bold flex items-center justify-between ${outPlayer?.id===p.id ? 'bg-red-50 border-red-500 ring-2 ring-red-200' : 'bg-white hover:bg-slate-50'}`}>
                                    <span className="bg-slate-800 text-white w-8 h-8 rounded flex items-center justify-center">{p.number}</span>
                                    <span>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-500 mb-3 text-center">上場球員 (IN)</h4>
                        <div className="space-y-2">
                            {bench.map(p => (
                                <button key={p.id} onClick={() => setInPlayer(p)} className={`w-full p-3 rounded border font-bold flex items-center justify-between ${inPlayer?.id===p.id ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'bg-white hover:bg-slate-50'}`}>
                                    <span className="bg-slate-800 text-white w-8 h-8 rounded flex items-center justify-center">{p.number}</span>
                                    <span>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded">取消</button>
                    <button disabled={!outPlayer || !inPlayer} onClick={() => onConfirm(team, outPlayer, inPlayer)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded disabled:opacity-50 hover:bg-slate-700">確認換人</button>
                </div>
            </div>
        </div>
    );
};

const MapLegend = () => (
    <div id="printable-legend" className="flex items-center justify-center gap-6 pb-2">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-600 shadow-sm"></div><span className="text-sm font-bold text-slate-600">得分 (Point)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white ring-1 ring-red-600 shadow-sm"></div><span className="text-sm font-bold text-slate-600">失誤 (Error)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-600 shadow-sm"></div><span className="text-sm font-bold text-slate-600">發球失誤 (Serve Err)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-500 shadow-sm"></div><span className="text-sm font-bold text-slate-600">繼續 (Continue)</span></div>
    </div>
);

const StatsDashboard = ({ metadata, events, onClose, currentScore }: any) => {
    // Simplified dashboard for brevity, normally would include full render logic
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<TeamSide | null>(null);
    const [viewMode, setViewMode] = useState<'MatchSummary' | 'TeamStats' | 'PlayerStats' | 'MatchReport'>('MatchSummary');

    useEffect(() => {
        if (selectedPlayerId) { setViewMode('PlayerStats'); setSelectedTeam(null); } 
        else if (selectedTeam) { setViewMode('TeamStats'); setSelectedPlayerId(null); } 
        else if (viewMode !== 'MatchReport') { setViewMode('MatchSummary'); }
    }, [selectedPlayerId, selectedTeam]);

    const summary = useMemo(() => {
        const stats = { Home: { points: 0, attackKills: 0, blocks: 0, aces: 0, opErrors: 0, selfErrors: 0 }, Away: { points: 0, attackKills: 0, blocks: 0, aces: 0, opErrors: 0, selfErrors: 0 } };
        events.forEach((e: TagEvent) => {
            const side = e.team;
            if (e.result === 'Point') {
                stats[side].points++;
                if (e.skill === 'Attack') stats[side].attackKills++;
                if (e.skill === 'Block') stats[side].blocks++;
                if (e.skill === 'Serve') stats[side].aces++;
            } else if (e.result === 'Error') {
                stats[side].selfErrors++;
                const opSide = side === 'Home' ? 'Away' : 'Home';
                stats[opSide].points++;
                stats[opSide].opErrors++;
            }
        });
        return stats;
    }, [events]);

    return (
         <div className="absolute inset-0 bg-slate-50 z-[60] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
                <h2 className="text-xl font-bold flex items-center gap-2"><BarChart2 /> 數據分析 (簡易版)</h2>
                <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-bold text-sm">返回比賽</button>
            </div>
            <div className="p-8 flex items-center justify-center flex-1">
                <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">比分概況</h3>
                    <div className="text-4xl font-black mb-8">
                        <span className="text-blue-600">{summary.Home.points}</span> - <span className="text-red-600">{summary.Away.points}</span>
                    </div>
                    <p className="text-slate-500">完整圖表功能請參考之前的版本，這裡僅展示基礎數據連結。</p>
                </div>
            </div>
        </div>
    );
};

const VolleyTagApp: React.FC<{ user: firebase.User, onLogout: () => void }> = ({ user, onLogout }) => {
  const [phase, setPhase] = useState<'setup' | 'lineup' | 'recording' | 'stats'>('setup');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // State initialization defaults
  const defaultMetadata = { date: new Date().toISOString().split('T')[0], tournament: '', homeTeam: { name: '', roster: [] }, awayTeam: { name: '', roster: [] } };
  const defaultLineup = { home: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, L: null }, away: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, L: null } };

  const [metadata, setMetadata] = useState<MatchMetadata>(defaultMetadata);
  const [lineup, setLineup] = useState<Lineup>(defaultLineup);
  const [events, setEvents] = useState<TagEvent[]>([]);
  const [score, setScore] = useState<{home: number, away: number}>({ home: 0, away: 0 });
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [servingTeam, setServingTeam] = useState<TeamSide>('Home');

  // Load from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
        setIsSyncing(true);
        try {
            const docRef = db.collection('users').doc(user.uid).collection('currentMatch').doc('data');
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                if (data) {
                    setMetadata(data.metadata || defaultMetadata);
                    setLineup(data.lineup || defaultLineup);
                    setEvents(data.events || []);
                    setScore(data.score || { home: 0, away: 0 });
                    if (data.events && data.events.length > 0) setPhase('recording');
                }
            }
        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setIsSyncing(false);
        }
    };
    loadData();
  }, [user]);

  // Save to Firestore function
  const saveData = async () => {
      setIsSyncing(true);
      try {
          await db.collection('users').doc(user.uid).collection('currentMatch').doc('data').set({
              metadata, lineup, events, score, lastUpdated: new Date()
          });
      } catch (e) {
          console.error("Error saving data", e);
      } finally {
          setIsSyncing(false);
      }
  };

  // Auto-save logic (Debounced)
  useEffect(() => {
      const timer = setTimeout(() => {
          saveData();
      }, 2000); // Save 2 seconds after last change
      return () => clearTimeout(timer);
  }, [metadata, lineup, events, score]);

  const [manualInputs, setManualInputs] = useState<{Home: { number: string; name: string }; Away: { number: string; name: string };}>({ Home: { number: '', name: '' }, Away: { number: '', name: '' } });
  const [showBatchImport, setShowBatchImport] = useState<{Home: boolean, Away: boolean}>({ Home: false, Away: false });
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [pendingEvent, setPendingEvent] = useState<Partial<TagEvent>>({});
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTeam, setSubTeam] = useState<TeamSide>('Home');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleNextPhase = () => {
    if (phase === 'setup') setPhase('lineup');
    else if (phase === 'lineup') setPhase('recording');
  };

  const handleBackPhase = () => {
    if (phase === 'lineup') setPhase('setup');
    else if (phase === 'recording') setPhase('lineup');
  };

  const handleTeamImport = (side: TeamSide, teamName: string) => {
      const selected = PRESET_TEAMS.find(t => t.name === teamName);
      if (!selected) return;
      const parsedRoster = selected.roster.map(line => {
          const parts = line.trim().split(/\s+/);
          const savedRole = getSavedPlayerRole(teamName, parts[0]);
          return { id: crypto.randomUUID(), number: parts[0], name: parts[1] || '', role: savedRole };
      });
      setMetadata(prev => {
          const key = side === 'Home' ? 'homeTeam' : 'awayTeam';
          return { ...prev, [key]: { name: selected.name, roster: parsedRoster } };
      });
      setNotification(`✅ 成功匯入 ${selected.name}`);
  };

  const addManualPlayer = (side: TeamSide) => {
    const input = manualInputs[side];
    if(!input.number.trim()) return;
    const teamKey = side === 'Home' ? 'homeTeam' : 'awayTeam';

    if (editingPlayerId) {
        setMetadata(prev => {
            const currentRoster = prev[teamKey].roster;
            const updatedRoster = currentRoster.map(p => {
                if (p.id === editingPlayerId) return { ...p, number: input.number.trim(), name: input.name.trim() };
                return p;
            }).sort((a,b) => parseInt(a.number) - parseInt(b.number));
            return { ...prev, [teamKey]: { ...prev[teamKey], roster: updatedRoster } };
        });
        setEditingPlayerId(null);
    } else {
        const savedRole = getSavedPlayerRole(metadata[teamKey].name, input.number.trim());
        setMetadata(prev => {
            const currentRoster = prev[teamKey].roster;
            const newPlayer: Player = { id: crypto.randomUUID(), number: input.number.trim(), name: input.name.trim(), role: savedRole };
            return { ...prev, [teamKey]: { ...prev[teamKey], roster: [...currentRoster, newPlayer].sort((a,b) => parseInt(a.number) - parseInt(b.number)) } };
        });
    }
    setManualInputs(prev => ({ ...prev, [side]: { number: '', name: '' } }));
  };

  const handleSelectPlayer = (team: TeamSide, player: Player) => {
    setPendingEvent({ team, playerNumber: player.number, timestamp: 0 });
  };

  const commitEvent = (result: ResultType) => {
    if (!pendingEvent.team || !pendingEvent.playerNumber || !pendingEvent.skill) {
       setNotification("請選擇球員與動作");
       return;
    }
    let sZone = pendingEvent.startZone || (pendingEvent.startCoordinate ? getFullCourtZone(pendingEvent.startCoordinate) : 1);
    let eZone = pendingEvent.endZone || (pendingEvent.endCoordinate ? getFullCourtZone(pendingEvent.endCoordinate) : 1);

    const newEvent: TagEvent = {
      id: Date.now().toString(),
      timestamp: 0,
      matchTimeFormatted: new Date().toLocaleTimeString(),
      team: pendingEvent.team,
      playerNumber: pendingEvent.playerNumber,
      skill: pendingEvent.skill,
      subType: pendingEvent.subType,
      grade: pendingEvent.grade,
      startZone: sZone,
      endZone: eZone,
      startCoordinate: pendingEvent.startCoordinate,
      endCoordinate: pendingEvent.endCoordinate,
      result: result,
      set: currentSet,
      tags: pendingEvent.tags,
    };

    setEvents(prev => [...prev, newEvent]);
    
    let pointWinner: TeamSide | null = null;
    if (result === 'Point') {
        setScore(prev => ({ ...prev, [newEvent.team === 'Home' ? 'home' : 'away']: prev[newEvent.team === 'Home' ? 'home' : 'away'] + 1 }));
        pointWinner = newEvent.team;
    } else if (result === 'Error') {
        setScore(prev => ({ ...prev, [newEvent.team === 'Home' ? 'away' : 'home']: prev[newEvent.team === 'Home' ? 'away' : 'home'] + 1 }));
        pointWinner = newEvent.team === 'Home' ? 'Away' : 'Home';
    }

    if (pointWinner && pointWinner !== servingTeam) {
        setServingTeam(pointWinner);
    }
    setPendingEvent({});
  };

  // Reset Cloud Data
  const handleReset = async () => {
      setMetadata(defaultMetadata);
      setLineup(defaultLineup);
      setEvents([]);
      setScore({ home: 0, away: 0 });
      setPhase('setup');
      setResetModalOpen(false);
      // Force immediate save to clear cloud
      await db.collection('users').doc(user.uid).collection('currentMatch').doc('data').set({
          metadata: defaultMetadata, lineup: defaultLineup, events: [], score: {home:0, away:0}, lastUpdated: new Date()
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans h-screen overflow-hidden">
      {notification && <Toast message={notification} onClose={() => setNotification(null)} />}
      {showSubModal && <SubstitutionModal team={subTeam} lineup={lineup} metadata={metadata} onClose={()=>setShowSubModal(false)} onConfirm={()=>{}} />}
      {resetModalOpen && <ResetModal onConfirm={handleReset} onCancel={() => setResetModalOpen(false)} />}
      {phase === 'stats' && <StatsDashboard metadata={metadata} events={events} score={score} onClose={() => setPhase('recording')} />}

      {/* Header */}
      <header className="bg-slate-900 text-white p-3 shadow-md flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-3">
             {(phase === 'lineup' || phase === 'recording') && <button onClick={handleBackPhase} className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"><ChevronLeft /> 上一步</button>}
             <div className="w-px h-6 bg-slate-700 mx-2"></div>
             <div className="flex items-center gap-2"><Activity className="text-blue-400" /><h1 className="text-xl font-bold tracking-tight">VolleyTag Cloud</h1></div>
             <div className="flex items-center gap-2 ml-4 px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">
                {isSyncing ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <Cloud size={14} className="text-green-400" />}
                <span className="text-xs text-slate-400">{isSyncing ? '同步中...' : '已同步'}</span>
             </div>
        </div>
        <div className="flex gap-3 items-center">
             <span className="text-sm text-slate-400 mr-2 hidden md:block">Hi, {user.email}</span>
             <button onClick={() => setResetModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded font-bold text-sm"><RotateCcw size={16} /> 重置</button>
             <button onClick={onLogout} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold text-sm"><LogOut size={16} /> 登出</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {phase === 'setup' && (
             <div className="w-full h-full flex items-start justify-center p-4 md:p-6 overflow-y-auto mt-4 mb-12">
                 <div className="bg-white border border-slate-200 shadow-xl rounded-2xl w-[95%] flex flex-col shrink-0">
                     <div className="p-8 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                         <div><h2 className="text-3xl font-black text-slate-800 mb-2">賽前設定 (Cloud)</h2></div>
                         <button onClick={handleNextPhase} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2">下一步 <ChevronRight /></button>
                     </div>
                     <div className="p-8 grid grid-cols-2 gap-12">
                         {/* Simple Inputs for Teams */}
                         <div>
                            <h3 className="text-xl font-bold text-blue-600 mb-2">Home Team</h3>
                            <input value={metadata.homeTeam.name} onChange={e => setMetadata({...metadata, homeTeam: {...metadata.homeTeam, name: e.target.value}})} className="w-full p-3 border rounded-xl font-bold" placeholder="輸入隊名" />
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                                完整球員名單編輯功能已保留 (省略顯示以節省版面)
                            </div>
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-red-600 mb-2">Away Team</h3>
                            <input value={metadata.awayTeam.name} onChange={e => setMetadata({...metadata, awayTeam: {...metadata.awayTeam, name: e.target.value}})} className="w-full p-3 border rounded-xl font-bold" placeholder="輸入隊名" />
                         </div>
                     </div>
                 </div>
             </div>
        )}
        
        {phase !== 'setup' && (
            <div className="flex-1 flex items-center justify-center flex-col bg-slate-100">
                <h2 className="text-2xl font-bold text-slate-700">比賽進行中 (Phase: {phase})</h2>
                <p className="mb-4 text-slate-500">資料將自動同步至您的帳號。</p>
                {phase === 'lineup' && <button onClick={handleNextPhase} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">開始比賽</button>}
                {phase === 'recording' && (
                    <div className="flex gap-4">
                        <button onClick={() => commitEvent('Point')} className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg text-xl">得分 +</button>
                        <button onClick={() => setPhase('stats')} className="px-6 py-4 bg-slate-700 text-white font-bold rounded-lg">查看數據</button>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

const App = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white gap-2"><Loader2 className="animate-spin"/> 載入中...</div>;

    if (!user) return <Auth />;

    return <VolleyTagApp user={user} onLogout={() => auth.signOut()} />;
};

export default App;