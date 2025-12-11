
import React, { useRef, useState } from 'react';
import { Zone, Coordinate, ResultType, SkillType } from '../types';

interface TrajectoryData {
  start: Coordinate;
  end: Coordinate;
  result: ResultType;
  skill?: SkillType; // Added skill to determine specific colors
}

interface CourtMapProps {
  label: string;
  selectedZone?: Zone;
  onCoordinateSelect?: (coord: Coordinate) => void;
  onTrajectorySelect?: (start: Coordinate, end: Coordinate) => void;
  colorClass?: string;
  compact?: boolean;
  heatmapPoints?: (Coordinate & { result?: ResultType })[];
  trajectories?: TrajectoryData[]; 
  pendingTrajectory?: { start: Coordinate, end: Coordinate };
  netPosition?: 'top' | 'bottom' | 'center'; 
  watermark?: string;
  topWatermark?: string;
  bottomWatermark?: string;
  trajectoryMode?: boolean; 
}

const CourtMap: React.FC<CourtMapProps> = ({ 
    label, selectedZone, onCoordinateSelect, onTrajectorySelect, colorClass = "bg-orange-100", 
    compact = false, heatmapPoints, trajectories, pendingTrajectory, netPosition = 'bottom', 
    watermark, topWatermark, bottomWatermark, trajectoryMode = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Coordinate | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Coordinate | null>(null);

  const getPercentage = (e: React.MouseEvent | MouseEvent) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!trajectoryMode) {
          if (onCoordinateSelect) onCoordinateSelect(getPercentage(e));
          return;
      }
      setIsDragging(true);
      const start = getPercentage(e);
      setDragStart(start);
      setDragCurrent(start);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging && trajectoryMode) {
          setDragCurrent(getPercentage(e));
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (isDragging && trajectoryMode && dragStart) {
          const end = getPercentage(e);
          setIsDragging(false);
          const dist = Math.sqrt(Math.pow(end.x - dragStart.x, 2) + Math.pow(end.y - dragStart.y, 2));
          if (dist < 2) {
             if(onCoordinateSelect) onCoordinateSelect(end);
          } else {
             if(onTrajectorySelect) onTrajectorySelect(dragStart, end);
          }
          setDragStart(null);
          setDragCurrent(null);
      }
  };

  const handleClick = (e: React.MouseEvent) => {
      if (trajectoryMode) return; 
      if (onCoordinateSelect) onCoordinateSelect(getPercentage(e));
  };

  const getPointColor = (result?: ResultType) => {
      switch (result) {
          case 'Point': return 'bg-green-500 border-green-700'; 
          case 'Error': return 'bg-red-500 border-red-700'; 
          default: return 'bg-gray-400 border-gray-600';
      }
  };

  // Updated color logic
  const getStrokeColor = (result?: ResultType, skill?: SkillType) => {
      if (skill === 'Serve' && result === 'Error') return '#3b82f6'; // Blue for Serve Error
      switch (result) {
          case 'Point': return '#22c55e'; // Green
          case 'Error': return '#ef4444'; // Red
          default: return '#9ca3af'; // Gray
      }
  };

  const isNetTop = netPosition === 'top';
  const isNetCenter = netPosition === 'center';

  return (
    <div className={`flex flex-col h-full w-full ${compact ? 'justify-center' : ''}`}>
      {!compact && label && <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 text-center">{label}</span>}
      
      {/* Outer Container (Gym Floor / Out of Bounds) */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        onClick={handleClick}
        className={`relative w-full flex-1 min-h-0 bg-slate-200 cursor-crosshair overflow-hidden flex flex-col border border-slate-300 shadow-inner`}
      >
        
        {/* Inner Court Area (Playing Surface) */}
        {/* UPDATE: Reduced inset to 5% X / 4% Y (approx 1/3 of previous padding) */}
        <div className={`absolute top-[4%] bottom-[4%] left-[5%] right-[5%] bg-orange-100 border-4 border-white shadow-sm z-0`}>
            {/* Watermarks (Inside Court) */}
            {watermark && !topWatermark && !bottomWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <span className="text-6xl font-black text-slate-900 transform -rotate-12 whitespace-nowrap select-none">{watermark}</span>
                </div>
            )}
            {isNetCenter && (topWatermark || bottomWatermark) && (
                <>
                    {topWatermark && (
                        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10 z-0">
                            <span className="text-5xl font-black text-slate-900 transform -rotate-12 whitespace-nowrap select-none">{topWatermark}</span>
                        </div>
                    )}
                    {bottomWatermark && (
                        <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none opacity-10 z-0">
                            <span className="text-5xl font-black text-slate-900 transform -rotate-12 whitespace-nowrap select-none">{bottomWatermark}</span>
                        </div>
                    )}
                </>
            )}

            {/* Grid Lines (Inside Court) */}
            <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
                {isNetCenter ? (
                    <>
                        <div className="absolute top-[50%] w-full h-1 bg-slate-800"></div> {/* Center Net Line on Floor */}
                        <div className="absolute top-[33.33%] w-full h-px bg-slate-800 dashed"></div> {/* Attack Line Top */}
                        <div className="absolute top-[66.66%] w-full h-px bg-slate-800 dashed"></div> {/* Attack Line Bottom */}
                    </>
                ) : (
                    <>
                        <div className={`absolute w-full h-px bg-slate-800 ${isNetTop ? 'top-[33.33%]' : 'bottom-[33.33%]'}`}></div>
                    </>
                )}
                <div className="absolute left-[33.33%] h-full w-px bg-slate-800"></div>
                <div className="absolute left-[66.66%] h-full w-px bg-slate-800"></div>
            </div>
        </div>

        {/* Visual Net (Extends slightly beyond court) */}
        {isNetCenter && (
             <div className="absolute top-[50%] left-[3%] right-[3%] h-1.5 bg-slate-900 z-10 shadow-md flex items-center justify-center -translate-y-1/2">
             </div>
        )}

        {/* SVG Layer (Trajectories) - Covers Entire Floor */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20">
            <defs>
                <marker id="arrowhead-drag" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker id="arrowhead-draft" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                </marker>
                <marker id="arrowhead-point" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
                </marker>
                <marker id="arrowhead-error" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                </marker>
                <marker id="arrowhead-serve-error" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                </marker>
                <marker id="arrowhead-continue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
                </marker>
            </defs>

            {trajectories && trajectories.map((traj, idx) => {
                const color = getStrokeColor(traj.result, traj.skill);
                // Determine marker based on logic
                let marker = 'url(#arrowhead-continue)';
                if (traj.result === 'Point') marker = 'url(#arrowhead-point)';
                else if (traj.skill === 'Serve' && traj.result === 'Error') marker = 'url(#arrowhead-serve-error)';
                else if (traj.result === 'Error') marker = 'url(#arrowhead-error)';

                return (
                    <g key={idx} opacity="0.8">
                        <line 
                            x1={`${traj.start.x}%`} y1={`${traj.start.y}%`} 
                            x2={`${traj.end.x}%`} y2={`${traj.end.y}%`} 
                            stroke={color} strokeWidth="2" markerEnd={marker} 
                        />
                        <circle cx={`${traj.start.x}%`} cy={`${traj.start.y}%`} r="3" fill="#fbbf24" stroke="white" strokeWidth="1" />
                    </g>
                );
            })}

            {pendingTrajectory && !isDragging && (
                <g opacity="1">
                    <line 
                        x1={`${pendingTrajectory.start.x}%`} y1={`${pendingTrajectory.start.y}%`} 
                        x2={`${pendingTrajectory.end.x}%`} y2={`${pendingTrajectory.end.y}%`} 
                        stroke="#fbbf24" strokeWidth="4" markerEnd="url(#arrowhead-draft)" 
                        strokeDasharray="5,5"
                    />
                    <circle cx={`${pendingTrajectory.start.x}%`} cy={`${pendingTrajectory.start.y}%`} r="5" fill="#fbbf24" stroke="white" strokeWidth="2" />
                </g>
            )}

            {isDragging && dragStart && dragCurrent && (
                <>
                    <line 
                        x1={`${dragStart.x}%`} y1={`${dragStart.y}%`} 
                        x2={`${dragCurrent.x}%`} y2={`${dragCurrent.y}%`} 
                        stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowhead-drag)" 
                        strokeDasharray="5,5"
                    />
                    <circle cx={`${dragStart.x}%`} cy={`${dragStart.y}%`} r="4" fill="#ef4444" />
                </>
            )}
        </svg>

        {selectedZone && !trajectoryMode && (!heatmapPoints || heatmapPoints.length === 0) && (
             <div className="absolute inset-0 pointer-events-none bg-orange-500/10 z-0"></div>
        )}

        {heatmapPoints && heatmapPoints.map((pt, idx) => (
            <div 
                key={idx}
                className={`absolute rounded-full border border-white shadow-sm pointer-events-none z-20 ${getPointColor(pt.result)}`}
                style={{
                    left: `${pt.x}%`,
                    top: `${pt.y}%`,
                    width: '10px', 
                    height: '10px', 
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.9 
                }}
            />
        ))}
      </div>
    </div>
  );
};

export default CourtMap;
