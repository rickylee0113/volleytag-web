
import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play, Pause, Rewind, FastForward, Clock, Youtube, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  onTimeUpdate: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Global declaration for YouTube API
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ onTimeUpdate, videoRef }) => {
  const [sourceType, setSourceType] = useState<'file' | 'youtube' | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // YouTube Player Instance
  const playerRef = useRef<any>(null);
  const youtubeIntervalRef = useRef<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSourceType('file');
      setErrorMessage(null);
    }
  };

  const handleYoutubeLoad = () => {
    setErrorMessage(null); // Clear previous errors
    // Extract ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeId.match(regExp);

    if (match && match[2].length === 11) {
      setSourceType('youtube');
      // Load API if not loaded
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
          initYoutubePlayer(match[2]);
        };
      } else {
        initYoutubePlayer(match[2]);
      }
    } else {
      setErrorMessage("無效的 YouTube 網址，請檢查格式。");
    }
  };

  const initYoutubePlayer = (videoId: string) => {
    // If player exists, load new video
    if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(videoId);
        return;
    }

    // Create new player
    try {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'controls': 0, // Hide default controls
            'rel': 0,
            'modestbranding': 1
          },
          events: {
            'onReady': (event: any) => {
               setDuration(event.target.getDuration());
               setErrorMessage(null);
            },
            'onStateChange': (event: any) => {
               setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
            'onError': (event: any) => {
                let msg = "發生錯誤。";
                if (event.data === 2) msg = "無效的參數。";
                if (event.data === 5) msg = "HTML5 播放器錯誤。";
                if (event.data === 100) msg = "影片找不到或已被設為私人。";
                if (event.data === 101 || event.data === 150) msg = "擁有者禁止在其他網站播放此影片。";
                
                setErrorMessage(`YouTube 錯誤: ${msg} 請嘗試其他影片。`);
                setSourceType(null); // Reset to selection screen
                playerRef.current = null; // Reset player ref to force re-init on next try if needed
            }
          }
        });
    } catch (e) {
        setErrorMessage("無法初始化 YouTube 播放器。");
    }
  };

  // Sync YouTube time
  useEffect(() => {
    if (sourceType === 'youtube') {
      youtubeIntervalRef.current = window.setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate(time);
        }
      }, 500);
    } else {
      if (youtubeIntervalRef.current) clearInterval(youtubeIntervalRef.current);
    }
    return () => {
       if (youtubeIntervalRef.current) clearInterval(youtubeIntervalRef.current);
    };
  }, [sourceType, onTimeUpdate]);

  const togglePlay = () => {
    if (sourceType === 'file' && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    } else if (sourceType === 'youtube' && playerRef.current && playerRef.current.playVideo) {
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (sourceType === 'file' && videoRef.current) {
      videoRef.current.currentTime += seconds;
    } else if (sourceType === 'youtube' && playerRef.current && playerRef.current.getCurrentTime) {
      const curr = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(curr + seconds, true);
    }
  };

  const setSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (sourceType === 'file' && videoRef.current) {
      videoRef.current.playbackRate = rate;
    } else if (sourceType === 'youtube' && playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, sourceType]);

  if (!sourceType) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-8 border-r border-slate-700">
        <h2 className="text-xl font-semibold mb-6 text-white">選擇影片來源 (Video Source)</h2>
        
        <div className="flex gap-8 w-full max-w-2xl">
            {/* File Upload Option */}
            <div className="flex-1 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center hover:border-blue-500 transition-colors">
                <Upload size={48} className="mb-4 text-blue-500" />
                <h3 className="text-lg font-medium mb-2 text-white">本機影片檔</h3>
                <p className="text-sm text-center mb-4">支援 MP4, WebM 格式</p>
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    瀏覽檔案
                    <input type="file" accept="video/mp4,video/webm" onChange={handleFileChange} className="hidden" />
                </label>
            </div>

            <div className="flex items-center text-slate-600 font-bold">或</div>

            {/* YouTube Option */}
            <div className="flex-1 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center hover:border-red-500 transition-colors">
                <Youtube size={48} className="mb-4 text-red-500" />
                <h3 className="text-lg font-medium mb-2 text-white">YouTube 網址</h3>
                <p className="text-sm text-center mb-4">貼上影片連結</p>
                <div className="flex flex-col w-full gap-2">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="https://youtube.com/..." 
                            className={`flex-1 bg-slate-900 border rounded px-2 py-1 text-sm text-white focus:outline-none ${errorMessage ? 'border-red-500' : 'border-slate-600 focus:border-red-500'}`}
                            value={youtubeId}
                            onChange={(e) => {
                                setYoutubeId(e.target.value);
                                setErrorMessage(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleYoutubeLoad()}
                        />
                        <button 
                            onClick={handleYoutubeLoad}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-bold whitespace-nowrap"
                        >
                            載入
                        </button>
                    </div>
                    {errorMessage && (
                        <div className="flex items-center gap-1 text-red-400 text-xs">
                            <AlertCircle size={12} />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {sourceType === 'file' && (
             <video
                ref={videoRef}
                src={videoSrc!}
                className="max-w-full max-h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />
        )}
        {/* We keep the Youtube div mounted but hide it if we need to show error/menu, handled by parent condition */}
        <div id="youtube-player" className={`w-full h-full ${sourceType === 'youtube' ? 'block' : 'hidden'} pointer-events-none`}></div>
      </div>

      {/* Controls Area */}
      <div className="bg-slate-800 p-4 border-t border-slate-700">
        {/* Progress Bar */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
            <span>{formatTime(currentTime)}</span>
            <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={currentTime}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    if (sourceType === 'file' && videoRef.current) videoRef.current.currentTime = val;
                    if (sourceType === 'youtube' && playerRef.current && playerRef.current.seekTo) playerRef.current.seekTo(val, true);
                    setCurrentTime(val);
                }}
                className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span>{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button 
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                
                <button onClick={() => skip(-5)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center gap-0.5" title="快退 5 秒">
                    <Rewind size={20} />
                    <span className="text-[10px]">-5s</span>
                </button>

                <button onClick={() => skip(5)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center gap-0.5" title="快轉 5 秒">
                    <FastForward size={20} />
                    <span className="text-[10px]">+5s</span>
                </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
                <span className="text-xs text-slate-400 pl-2 flex items-center gap-1">
                    <Clock size={12} /> 速度
                </span>
                {[0.5, 0.75, 1.0].map((rate) => (
                    <button
                        key={rate}
                        onClick={() => setSpeed(rate)}
                        className={`text-xs px-2 py-1 rounded ${playbackRate === rate ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                    >
                        {rate}x
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;