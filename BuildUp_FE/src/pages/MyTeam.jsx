import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getAllPremierLeaguePlayers, getTeams } from '../api/teamApi.js';
import '../css/MyTeam.css';

// 지정 프리셋 포메이션 정의 (DF - MF - FW 합계는 모두 10)
const FORMATION_PRESETS = [
  { label: '4-3-3', df: 4, mf: 3, fw: 3 },
  { label: '4-4-2', df: 4, mf: 4, fw: 2 },
  { label: '3-5-2', df: 3, mf: 5, fw: 2 },
  { label: '3-4-3', df: 3, mf: 4, fw: 3 },
  { label: '4-2-3-1', df: 4, mf: 5, fw: 1 },
  { label: '5-3-2', df: 5, mf: 3, fw: 2 },
  { label: '5-4-1', df: 5, mf: 4, fw: 1 },
  { label: '4-1-4-1', df: 4, mf: 5, fw: 1 },
  { label: '5-2-3', df: 5, mf: 2, fw: 3 },
  { label: '10-0-0', df: 10, mf: 0, fw: 0 },
  { label: '0-0-10', df: 0, mf: 0, fw: 10 },
  { label: '0-10-0', df: 0, mf: 10, fw: 0 },
  { label: '2-3-5', df: 2, mf: 3, fw: 5 },
];

const LOCAL_STORAGE_KEY = 'buildup_custom_squad_v1';

export default function MyTeam() {
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const currentUser = useSelector((state) => state.auth?.user);

  // 1. 전체 선수 & 구단 데이터
  const [allPlayers, setAllPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. 팀 및 포메이션 상태
  const [teamName, setTeamName] = useState('나만의 드림 스쿼드');
  const [formation, setFormation] = useState({ df: 4, mf: 3, fw: 3 });
  
  // 커스텀 포메이션 입력기 상태 (각 위치 1~5, 합계 10)
  const [customDf, setCustomDf] = useState(4);
  const [customMf, setCustomMf] = useState(3);
  const [customFw, setCustomFw] = useState(3);

  // 3. 필드 11개 슬롯 상태
  // slot: { id: number, pos: 'FW'|'MF'|'DF'|'GK', player: Player|null }
  const [slots, setSlots] = useState([]);

  // 클릭으로 선수 배치할 때 활성화된 대상 슬롯 ID
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // 드래그 앤 드롭 중 대상 슬롯 하이라이트
  const [dragOverSlotId, setDragOverSlotId] = useState(null);

  // 피치 및 자유 드래그 위치 이동 관리
  const pitchRef = useRef(null);
  const dragInfoRef = useRef(null); // { slotId, startX, startY, hasMoved }
  const [activeDragSlotId, setActiveDragSlotId] = useState(null);

  // 4. 선수 검색 & 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosTab, setSelectedPosTab] = useState('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');

  // 5. 토스트 알림 상태
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 포메이션별 기본 좌표 계산 헬퍼 (DF, MF, FW, GK)
  const calculateDefaultCoordinates = (dfCount, mfCount, fwCount) => {
    const getXPositions = (count) => {
      if (count <= 0) return [];
      if (count === 1) return [50];
      if (count === 2) return [32, 68];
      if (count === 3) return [20, 50, 80];
      if (count === 4) return [15, 38, 62, 85];
      if (count === 5) return [12, 31, 50, 69, 88];
      const step = 76 / (count - 1);
      return Array.from({ length: count }, (_, i) => Math.round(12 + i * step));
    };

    const coords = [];
    let idCounter = 0;

    // FW (공격수): y 약 18%
    const fwX = getXPositions(fwCount);
    fwX.forEach((x) => {
      coords.push({ id: idCounter++, pos: 'FW', x, y: 18 });
    });

    // MF (미드필더): y 약 48%
    const mfX = getXPositions(mfCount);
    mfX.forEach((x) => {
      coords.push({ id: idCounter++, pos: 'MF', x, y: 48 });
    });

    // DF (수비수): y 약 74%
    const dfX = getXPositions(dfCount);
    dfX.forEach((x) => {
      coords.push({ id: idCounter++, pos: 'DF', x, y: 74 });
    });

    // GK (골키퍼 1명 고정): y 약 91%, x = 50%
    coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });

    return coords;
  };

  // 포메이션 생성 헬퍼 함수 (각 슬롯에 기본 좌표 부여)
  const buildInitialSlots = (dfCount, mfCount, fwCount, existingSlots = []) => {
    const existingPlayersByPos = {
      FW: [],
      MF: [],
      DF: [],
      GK: [],
    };

    // 기존에 배치된 선수들을 포지션별로 모음
    existingSlots.forEach((s) => {
      if (s.player) {
        existingPlayersByPos[s.pos]?.push(s.player);
      }
    });

    const defaultCoords = calculateDefaultCoordinates(dfCount, mfCount, fwCount);
    const posCounters = { FW: 0, MF: 0, DF: 0, GK: 0 };

    return defaultCoords.map((coord) => {
      const pIdx = posCounters[coord.pos]++;
      return {
        id: coord.id,
        pos: coord.pos,
        x: coord.x,
        y: coord.y,
        player: existingPlayersByPos[coord.pos]?.[pIdx] || null,
      };
    });
  };

  // 초기 데이터 로드 및 로컬스토리지 복원
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [playersData, teamsData] = await Promise.all([
          getAllPremierLeaguePlayers(),
          getTeams(),
        ]);

        if (!isMounted) return;

        setAllPlayers(playersData || []);
        setTeams(teamsData || []);

        // 로컬스토리지에서 이전 저장된 스쿼드 복원 시도
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.formation) {
              setTeamName(parsed.teamName || '나만의 드림 스쿼드');
              setFormation(parsed.formation);
              setCustomDf(parsed.formation.df || 4);
              setCustomMf(parsed.formation.mf || 3);
              setCustomFw(parsed.formation.fw || 3);

              if (Array.isArray(parsed.slots) && parsed.slots.length === 11) {
                // 저장된 플레이어 ID로 최신 선수 객체 매핑 및 좌표 복원
                const defaultCoords = calculateDefaultCoordinates(
                  parsed.formation.df ?? 4,
                  parsed.formation.mf ?? 3,
                  parsed.formation.fw ?? 3
                );

                const restoredSlots = parsed.slots.map((s, idx) => {
                  const matchedPlayer = s.player?.playerId
                    ? (playersData || []).find((p) => p.playerId === s.player.playerId) || s.player
                    : null;
                  return {
                    ...s,
                    x: s.x !== undefined ? s.x : defaultCoords[idx]?.x ?? 50,
                    y: s.y !== undefined ? s.y : defaultCoords[idx]?.y ?? 50,
                    player: matchedPlayer,
                  };
                });
                setSlots(restoredSlots);
                return;
              }
            }
          } catch (e) {
            console.warn('[MyTeam] 로컬스토리지 복원 실패, 기본값으로 초기화:', e);
          }
        }

        // 기본 4-3-3 포메이션으로 초기 슬롯 생성
        setSlots(buildInitialSlots(4, 3, 3));
      } catch (err) {
        console.error('[MyTeam] 데이터 로드 오류:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 커스텀 포메이션 합계 계산 (1~5 규칙 및 합계 10)
  const customSum = customDf + customMf + customFw;
  const isCustomSumValid = customSum === 10;

  // 포메이션 변경 핸들러
  const handleApplyFormation = (newDf, newMf, newFw) => {
    if (newDf + newMf + newFw !== 10) {
      showToast(`⚠️ 수비+중앙+공격 합계는 10명이어야 합니다. (현재: ${newDf + newMf + newFw}명)`);
      return;
    }
    if (newDf < 0 || newDf > 10 || newMf < 0 || newMf > 10 || newFw < 0 || newFw > 10) {
      showToast('⚠️ 각 위치(수비, 중앙, 공격)는 최소 0명, 최대 10명까지 가능합니다.');
      return;
    }

    setFormation({ df: newDf, mf: newMf, fw: newFw });
    setCustomDf(newDf);
    setCustomMf(newMf);
    setCustomFw(newFw);
    setSlots((prev) => buildInitialSlots(newDf, newMf, newFw, prev));
    setSelectedSlotId(null);
    showToast(`✅ 포메이션이 ${newDf}-${newMf}-${newFw}로 변경되었습니다.`);
  };

  // 프리셋 클릭
  const handlePresetSelect = (preset) => {
    handleApplyFormation(preset.df, preset.mf, preset.fw);
  };

  // 커스텀 스텝퍼 변경 핸들러 (최소 0명 ~ 최대 10명 제어)
  const handleCustomStepper = (pos, delta) => {
    if (pos === 'DF') {
      const next = Math.max(0, Math.min(10, customDf + delta));
      setCustomDf(next);
    } else if (pos === 'MF') {
      const next = Math.max(0, Math.min(10, customMf + delta));
      setCustomMf(next);
    } else if (pos === 'FW') {
      const next = Math.max(0, Math.min(10, customFw + delta));
      setCustomFw(next);
    }
  };

  // 이미 필드에 배치된 선수 ID Set
  const assignedPlayerIds = useMemo(() => {
    const ids = new Set();
    slots.forEach((s) => {
      if (s.player?.playerId) ids.add(s.player.playerId);
    });
    return ids;
  }, [slots]);

  // 필터링된 선수 목록
  const filteredPlayers = useMemo(() => {
    let list = allPlayers;

    // 1. 포지션 필터
    if (selectedPosTab !== 'ALL') {
      list = list.filter((p) => p.mainPosition === selectedPosTab);
    }

    // 2. 구단 필터
    if (selectedTeamFilter !== 'ALL') {
      const numTeamId = Number(selectedTeamFilter);
      list = list.filter((p) => p.teamId === numTeamId);
    }

    // 3. 검색어 필터
    if (searchTerm.trim()) {
      const kw = searchTerm.trim().toLowerCase();
      list = list.filter((p) => {
        const nameKor = (p.nameKor || '').toLowerCase();
        const nameEn = (p.name || '').toLowerCase();
        const teamKor = (p.teamNameKor || '').toLowerCase();
        const teamEn = (p.teamName || '').toLowerCase();
        return (
          nameKor.includes(kw) ||
          nameEn.includes(kw) ||
          teamKor.includes(kw) ||
          teamEn.includes(kw)
        );
      });
    }

    return list;
  }, [allPlayers, selectedPosTab, selectedTeamFilter, searchTerm]);

  // 슬롯에 선수 배치 (GK는 GK, DF는 DF, MF는 MF, FW는 FW에만 배치 가능)
  const assignPlayerToSlot = (slotId, player) => {
    const targetSlot = slots.find((s) => s.id === slotId);
    if (!targetSlot) return false;

    if (targetSlot.pos !== player.mainPosition) {
      showToast(`⚠️ ${targetSlot.pos} 슬롯에는 ${targetSlot.pos} 선수만 배치할 수 있습니다. (${player.nameKor || player.name}: ${player.mainPosition})`);
      return false;
    }

    setSlots((prev) => {
      // 만약 선수가 이미 다른 슬롯에 배치되어 있다면 그 슬롯을 비움 (이동)
      const next = prev.map((s) => {
        if (s.player?.playerId === player.playerId) {
          return { ...s, player: null };
        }
        if (s.id === slotId) {
          return { ...s, player };
        }
        return s;
      });
      return next;
    });
    setSelectedSlotId(null);
    showToast(`⚽ ${player.nameKor || player.name} (${player.mainPosition}) 선수가 배치되었습니다.`);
    return true;
  };

  // 두 슬롯의 선수 맞바꿈 (Swap) - 포지션 일치 검증
  const swapSlots = (slotIdA, slotIdB) => {
    const slotA = slots.find((s) => s.id === slotIdA);
    const slotB = slots.find((s) => s.id === slotIdB);
    if (!slotA || !slotB) return;

    // slotA의 선수가 slotB의 포지션과 다르면 맞바꿈 불가
    if (slotA.player && slotA.player.mainPosition !== slotB.pos) {
      showToast(`⚠️ ${slotA.player.nameKor || slotA.player.name} (${slotA.player.mainPosition}) 선수는 ${slotB.pos} 슬롯에 들어갈 수 없습니다.`);
      return;
    }
    // slotB의 선수가 slotA의 포지션과 다르면 맞바꿈 불가
    if (slotB.player && slotB.player.mainPosition !== slotA.pos) {
      showToast(`⚠️ ${slotB.player.nameKor || slotB.player.name} (${slotB.player.mainPosition}) 선수는 ${slotA.pos} 슬롯에 들어갈 수 없습니다.`);
      return;
    }

    setSlots((prev) => {
      return prev.map((s) => {
        if (s.id === slotIdA) return { ...s, player: slotB.player };
        if (s.id === slotIdB) return { ...s, player: slotA.player };
        return s;
      });
    });
    showToast('🔄 두 선수의 위치를 맞바꿨습니다.');
  };

  // 슬롯에서 선수 제거
  const handleRemovePlayerFromSlot = (slotId, e) => {
    if (e) e.stopPropagation();
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, player: null } : s))
    );
    if (selectedSlotId === slotId) setSelectedSlotId(null);
  };

  // 슬롯 클릭 핸들러
  const handleSlotClick = (slotId) => {
    if (selectedSlotId === slotId) {
      setSelectedSlotId(null); // 토글 해제
    } else {
      setSelectedSlotId(slotId);
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        setSelectedPosTab(slot.pos); // 해당 슬롯 포지션으로 우측 탭 자동 전환
      }
    }
  };

  // 선수 목록에서 선수 클릭 시 배치 (GK는 GK, DF는 DF, MF는 MF, FW는 FW에만 배치)
  const handlePlayerCardClick = (player) => {
    // 1. 이미 선택된 슬롯이 있는 경우
    if (selectedSlotId !== null) {
      assignPlayerToSlot(selectedSlotId, player);
      return;
    }

    // 2. 선택된 슬롯이 없는 경우: 선수의 포지션과 일치하는 빈 슬롯 탐색
    const emptyMatchingSlot = slots.find(
      (s) => s.pos === player.mainPosition && !s.player
    );
    if (emptyMatchingSlot) {
      assignPlayerToSlot(emptyMatchingSlot.id, player);
      return;
    }

    // 3. 해당 포지션 빈 슬롯이 없는 경우 안내
    showToast(`⚠️ 비어있는 ${player.mainPosition} 슬롯이 없습니다. 교체할 ${player.mainPosition} 슬롯을 먼저 클릭해주세요.`);
  };

  // =========================================================
  // 드래그 & 드롭 (HTML5 Drag & Drop) 이벤트
  // =========================================================

  // 1. 선수 카드 드래그 시작 (검색 목록)
  const handleDragStartFromRoster = (e, player) => {
    const dragPayload = {
      type: 'ROSTER_PLAYER',
      player,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // 2. 필드 슬롯 드래그 시작 (필드 내 맞바꿈)
  const handleDragStartFromSlot = (e, slotId) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.player) return;

    const dragPayload = {
      type: 'PITCH_SLOT',
      slotId,
      player: slot.player,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'move';
  };

  // 3. 슬롯 위로 드래그 진입 / 이동
  const handleDragOverSlot = (e, slotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeaveSlot = (slotId) => {
    if (dragOverSlotId === slotId) {
      setDragOverSlotId(null);
    }
  };

  // 4. 슬롯에 드롭
  const handleDropOnSlot = (e, targetSlotId) => {
    e.preventDefault();
    setDragOverSlotId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      if (data.type === 'ROSTER_PLAYER' && data.player) {
        // 검색 목록에서 필드로 드롭
        assignPlayerToSlot(targetSlotId, data.player);
      } else if (data.type === 'PITCH_SLOT' && data.slotId !== undefined) {
        // 필드 슬롯 간 맞바꿈 (Swap)
        if (data.slotId !== targetSlotId) {
          swapSlots(data.slotId, targetSlotId);
        }
      }
    } catch (err) {
      console.error('[MyTeam] 드롭 파싱 오류:', err);
    }
  };

  // =========================================================
  // 필드 위 슬롯 자유 드래그 이동 (Pointer Drag)
  // =========================================================
  const handleSlotPointerDown = (slotId, e) => {
    // 마우스 우클릭 제외, 삭제 버튼 클릭 제외
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.slot-remove-btn')) return;

    const pitchEl = pitchRef.current;
    if (!pitchEl) return;

    dragInfoRef.current = {
      slotId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };

    setActiveDragSlotId(slotId);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleSlotPointerMove = (slotId, e) => {
    const dragInfo = dragInfoRef.current;
    if (!dragInfo || dragInfo.slotId !== slotId) return;

    const dx = Math.abs(e.clientX - dragInfo.startX);
    const dy = Math.abs(e.clientY - dragInfo.startY);
    if (dx > 3 || dy > 3) {
      dragInfo.hasMoved = true;
    }

    if (!dragInfo.hasMoved) return;

    const pitchEl = pitchRef.current;
    if (!pitchEl) return;

    const rect = pitchEl.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    // 경기장 내부 영역 제한 (좌우 6~94%, 상하 7~93%)
    const clampedX = Math.max(6, Math.min(94, Math.round(rawX * 10) / 10));
    const clampedY = Math.max(7, Math.min(93, Math.round(rawY * 10) / 10));

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, x: clampedX, y: clampedY } : s
      )
    );
  };

  const handleSlotPointerUp = (slotId, e) => {
    const dragInfo = dragInfoRef.current;
    if (dragInfo && dragInfo.slotId === slotId) {
      if (!dragInfo.hasMoved) {
        // 단순 클릭(이동 없음)일 때는 정상 슬롯 선택 동작 수행
        handleSlotClick(slotId);
      }
    }
    dragInfoRef.current = null;
    setActiveDragSlotId(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // 피치 빈 잔디 공간에 선수 드롭
  const handleDropOnPitch = (e) => {
    e.preventDefault();
    setDragOverSlotId(null);

    const pitchEl = pitchRef.current;
    if (!pitchEl) return;

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.type === 'ROSTER_PLAYER' && data.player) {
        const rect = pitchEl.getBoundingClientRect();
        const dropX = Math.max(6, Math.min(94, Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10));
        const dropY = Math.max(7, Math.min(93, Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10));

        // 해당 포지션 빈 슬롯만 찾기 (GK는 GK, DF는 DF, MF는 MF, FW는 FW)
        const emptySlot = slots.find((s) => s.pos === data.player.mainPosition && !s.player);

        if (emptySlot) {
          setSlots((prev) =>
            prev.map((s) => {
              if (s.player?.playerId === data.player.playerId) return { ...s, player: null };
              if (s.id === emptySlot.id) return { ...s, player: data.player, x: dropX, y: dropY };
              return s;
            })
          );
          showToast(`⚽ ${data.player.nameKor || data.player.name} (${data.player.mainPosition}) 선수가 배치되었습니다.`);
        } else {
          showToast(`⚠️ 비어있는 ${data.player.mainPosition} 슬롯이 없습니다. 교체할 ${data.player.mainPosition} 슬롯 위에 직접 드롭해주세요.`);
        }
      }
    } catch (err) {}
  };

  // 포메이션 기본 좌표로 재정렬
  const handleResetPositions = () => {
    const defaultCoords = calculateDefaultCoordinates(formation.df, formation.mf, formation.fw);

    setSlots((prev) =>
      prev.map((s) => {
        const c = defaultCoords.find((dc) => dc.id === s.id) || {
          x: s.x ?? 50,
          y: s.y ?? 50,
        };
        return {
          ...s,
          x: c.x,
          y: c.y,
        };
      })
    );
    showToast('🔄 선수들의 위치가 포메이션 기본 위치로 재정렬되었습니다.');
  };

  // =========================================================
  // 편의 기능: 초기화, 자동완성, 저장, 공유
  // =========================================================

  // 스쿼드 전체 초기화
  const handleResetSquad = () => {
    if (window.confirm('현재 필드에 배치된 모든 선수를 비우시겠습니까?')) {
      setSlots((prev) => prev.map((s) => ({ ...s, player: null })));
      setSelectedSlotId(null);
      showToast('스쿼드가 초기화되었습니다.');
    }
  };

  // 포지션별 자동 완성 (Auto-Fill) - 포지션 엄격 일치 (GK는 GK, DF는 DF, MF는 MF, FW는 FW)
  const handleAutoFillSquad = () => {
    const usedIds = new Set(assignedPlayerIds);

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.player) return slot; // 이미 채워진 슬롯은 유지

        // 해당 슬롯 포지션(GK, DF, MF, FW)과 100% 일치하며 아직 미배치된 선수 찾기
        const candidate = allPlayers.find(
          (p) => p.mainPosition === slot.pos && !usedIds.has(p.playerId)
        );

        if (candidate) {
          usedIds.add(candidate.playerId);
          return { ...slot, player: candidate };
        }

        return slot;
      })
    );

    showToast('⚡ 빈 슬롯들이 포지션(GK/DF/MF/FW)에 맞게 자동 완성되었습니다!');
  };

  // 스쿼드 로컬 저장
  const handleSaveSquad = () => {
    const payload = {
      teamName: teamName.trim() || '나만의 드림 스쿼드',
      formation,
      slots,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      showToast('💾 나만의 스쿼드가 브라우저에 성공적으로 저장되었습니다!');
    } catch (e) {
      showToast('저장 중 오류가 발생했습니다.');
    }
  };

  // 스쿼드 라인업 텍스트 복사 (공유)
  const handleCopyLineup = () => {
    const assignedCount = slots.filter((s) => s.player).length;
    let text = `[PL:UG] ${teamName} (${formation.df}-${formation.mf}-${formation.fw})\n`;
    text += `총 ${assignedCount}/11명 완성\n\n`;

    const fwList = slots.filter((s) => s.pos === 'FW' && s.player).map((s) => s.player.nameKor || s.player.name);
    const mfList = slots.filter((s) => s.pos === 'MF' && s.player).map((s) => s.player.nameKor || s.player.name);
    const dfList = slots.filter((s) => s.pos === 'DF' && s.player).map((s) => s.player.nameKor || s.player.name);
    const gkList = slots.filter((s) => s.pos === 'GK' && s.player).map((s) => s.player.nameKor || s.player.name);

    text += `FW: ${fwList.join(', ') || '(비어있음)'}\n`;
    text += `MF: ${mfList.join(', ') || '(비어있음)'}\n`;
    text += `DF: ${dfList.join(', ') || '(비어있음)'}\n`;
    text += `GK: ${gkList.join(', ') || '(비어있음)'}\n`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 스쿼드 라인업이 클립보드에 복사되었습니다!');
    });
  };

  // 현재 완성된 인원수 (총 11명)
  const filledCount = slots.filter((s) => s.player).length;

  // 슬롯들을 포메이션 행(FW, MF, DF, GK)으로 분류
  const fwSlots = slots.filter((s) => s.pos === 'FW');
  const mfSlots = slots.filter((s) => s.pos === 'MF');
  const dfSlots = slots.filter((s) => s.pos === 'DF');
  const gkSlots = slots.filter((s) => s.pos === 'GK');

  return (
    <div className="myteam-page">
      <div className="myteam-container">
        {/* 1. 상단 헤더 & 툴바 */}
        <header className="myteam-header">
          <div className="myteam-title-box">
            <h1>
              나만의 팀 & 포메이션 빌더
              <span className="myteam-title-badge">PL:UG MY TEAM</span>
            </h1>
            <p>포메이션을 자유롭게 설정하고, 원하는 프리미어리그 선수들을 필드에 드래그하거나 클릭하여 배치하세요.</p>
          </div>

          <div className="myteam-toolbar">
            <input
              type="text"
              className="myteam-name-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="구단명 입력"
              title="팀 이름 변경"
            />

            <div className="myteam-squad-counter">
              <span>스쿼드:</span>
              <span className="counter-num">{filledCount} / 11명</span>
            </div>

            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={handleResetSquad} title="스쿼드 초기화">
              🗑️ 비우기
            </button>
            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={handleAutoFillSquad} title="스쿼드 자동 채우기">
              ⚡ 자동완성
            </button>
            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={handleCopyLineup} title="라인업 텍스트 복사">
              📋 공유
            </button>
            <button type="button" className="myteam-btn myteam-btn-primary" onClick={handleSaveSquad} title="스쿼드 저장">
              💾 저장하기
            </button>
          </div>
        </header>

        {/* 2. 포메이션 설정 바 */}
        <section className="formation-panel" aria-label="포메이션 설정">
          <div className="formation-panel-inner">
            {/* 프리셋 포메이션 선택기 */}
            <div className="formation-presets-row">
              <span className="formation-label">⭐ 추천 포메이션:</span>
              <div className="preset-chip-group">
                {FORMATION_PRESETS.map((p) => {
                  const isActive =
                    formation.df === p.df &&
                    formation.mf === p.mf &&
                    formation.fw === p.fw;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      className={`preset-chip ${isActive ? 'active' : ''}`}
                      onClick={() => handlePresetSelect(p)}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 커스텀 포메이션 조작 행 (합계 10명) */}
            <div className="formation-custom-row">
              <span className="formation-label">⚙️ 커스텀 포메이션 (총합 10명):</span>

              <div className="custom-steppers">
                {/* 수비수 (DF) */}
                <div className="stepper-item">
                  <span className="stepper-tag df">DF 수비</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('DF', -1)}
                    disabled={customDf <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="stepper-input"
                    value={customDf}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                      setCustomDf(v);
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('DF', 1)}
                    disabled={customDf >= 10}
                  >
                    +
                  </button>
                </div>

                {/* 미드필더 (MF) */}
                <div className="stepper-item">
                  <span className="stepper-tag mf">MF 미드</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('MF', -1)}
                    disabled={customMf <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="stepper-input"
                    value={customMf}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                      setCustomMf(v);
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('MF', 1)}
                    disabled={customMf >= 10}
                  >
                    +
                  </button>
                </div>

                {/* 공격수 (FW) */}
                <div className="stepper-item">
                  <span className="stepper-tag fw">FW 공격</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('FW', -1)}
                    disabled={customFw <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="stepper-input"
                    value={customFw}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                      setCustomFw(v);
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('FW', 1)}
                    disabled={customFw >= 10}
                  >
                    +
                  </button>
                </div>

                <div className="stepper-gk-info">
                  🧤 GK 골키퍼: 1명 고정
                </div>
              </div>

              {/* 합계 및 적용 버튼 */}
              <div className="formation-status-indicator">
                <span className={`sum-badge ${isCustomSumValid ? 'valid' : 'invalid'}`}>
                  {isCustomSumValid
                    ? `✓ 합계: ${customSum}/10명 (완료)`
                    : `⚠️ 합계: ${customSum}/10명 (10명이어야 합니다)`}
                </span>

                <button
                  type="button"
                  className="myteam-btn myteam-btn-primary"
                  onClick={() => handleApplyFormation(customDf, customMf, customFw)}
                  disabled={!isCustomSumValid}
                  style={{ opacity: isCustomSumValid ? 1 : 0.4, cursor: isCustomSumValid ? 'pointer' : 'not-allowed' }}
                >
                  포메이션 적용
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 메인 빌더 레이아웃 (축구 경기장 피치 vs 선수 검색 패널) */}
        <div className="myteam-main-layout">
          {/* 3-A. 축구 경기장 (Pitch) */}
          <section className="myteam-pitch-card">
            <div className="pitch-header-info">
              <div className="pitch-formation-display">
                <span>📍 현재 포메이션:</span>
                <span style={{ color: '#00ff87' }}>{formation.df}-{formation.mf}-{formation.fw}</span>
                <button
                  type="button"
                  className="myteam-btn-mini"
                  onClick={handleResetPositions}
                  title="선수들을 포메이션 기본 위치로 재정렬"
                >
                  🔄 위치 정렬
                </button>
              </div>
              <div className="pitch-hint">
                {selectedSlotId !== null ? (
                  <span style={{ color: '#00ff87', fontWeight: 700 }}>
                    👉 우측 목록에서 배치할 선수를 클릭하세요!
                  </span>
                ) : (
                  '💡 선수를 드래그하여 필드 원하는 곳으로 자유롭게 움직이세요'
                )}
              </div>
            </div>

            <div
              className="myteam-pitch"
              ref={pitchRef}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={handleDropOnPitch}
            >
              {/* 축구장 라인 그래픽 */}
              <div className="pitch-lines">
                <div className="pitch-box-top" />
                <div className="pitch-center-circle" />
                <div className="pitch-center-spot" />
                <div className="pitch-box-bottom" />
                <div className="pitch-box-bottom-small" />
              </div>

              {/* 자유 이동 배치된 11개 슬롯들 */}
              {slots.map((slot) => renderSlot(slot))}
            </div>
          </section>

          {/* 3-B. 선수 검색 & 로스터 패널 */}
          <section className="myteam-roster-panel" aria-label="선수 검색 및 명단">
            <div className="roster-header">
              <h2>
                선수 검색 & 영입
                <span className="roster-count">{filteredPlayers.length}명 검색됨</span>
              </h2>
            </div>

            {/* 검색창 */}
            <div className="roster-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="roster-search-input"
                placeholder="선수명, 구단명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="검색어 지우기"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 필터 탭 (포지션 탭 + 팀 드롭다운) */}
            <div className="roster-filters">
              <div className="position-filter-tabs">
                {['ALL', 'FW', 'MF', 'DF', 'GK'].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    className={`pos-tab ${selectedPosTab === pos ? 'active' : ''}`}
                    onClick={() => setSelectedPosTab(pos)}
                  >
                    {pos === 'ALL' ? '전체' : pos}
                  </button>
                ))}
              </div>

              <select
                className="team-filter-select"
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
              >
                <option value="ALL">전체 20개 구단</option>
                {teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamNameKor || t.teamName}
                  </option>
                ))}
              </select>
            </div>

            {/* 선수 목록 스크롤 */}
            <div className="roster-list-scroll">
              {loading ? (
                <div className="roster-empty-state">선수 데이터를 불러오는 중입니다...</div>
              ) : filteredPlayers.length === 0 ? (
                <div className="roster-empty-state">검색 조건에 맞는 선수가 없습니다.</div>
              ) : (
                filteredPlayers.map((player) => {
                  const isAssigned = assignedPlayerIds.has(player.playerId);
                  return (
                    <div
                      key={player.playerId}
                      className={`roster-player-card ${isAssigned ? 'is-assigned' : ''}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStartFromRoster(e, player)}
                      onClick={() => handlePlayerCardClick(player)}
                      title={isAssigned ? '이미 스쿼드에 배치된 선수입니다 (클릭 시 이동)' : '드래그하거나 클릭하여 배치'}
                    >
                      <div className="player-card-left">
                        <span className={`player-pos-tag ${player.mainPosition.toLowerCase()}`}>
                          {player.mainPosition}
                        </span>

                        <div className="player-names">
                          <span className="player-name-kor">
                            {player.nameKor || player.name}
                          </span>
                          <span className="player-sub-info">
                            {player.teamNameKor || player.teamName} · {player.detailPosition || player.mainPosition}
                          </span>
                        </div>
                      </div>

                      <div className="player-card-right">
                        {isAssigned ? (
                          <span className="in-squad-badge">배치됨</span>
                        ) : (
                          <button
                            type="button"
                            className="card-action-btn"
                            title="필드에 배치"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayerCardClick(player);
                            }}
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 토스트 알림 메시지 */}
      {toastMessage && (
        <div className="myteam-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );

  // 슬롯 렌더링 헬퍼
  function renderSlot(slot) {
    const isSelected = selectedSlotId === slot.id;
    const isDragOver = dragOverSlotId === slot.id;
    const isPointerDragging = activeDragSlotId === slot.id;
    const hasPlayer = Boolean(slot.player);

    return (
      <div
        key={slot.id}
        className={`pitch-slot ${isSelected ? 'slot-selected' : ''} ${
          isDragOver ? 'drop-target-active' : ''
        } ${isPointerDragging ? 'is-dragging' : ''}`}
        style={{
          left: `${slot.x ?? 50}%`,
          top: `${slot.y ?? 50}%`,
        }}
        onPointerDown={(e) => handleSlotPointerDown(slot.id, e)}
        onPointerMove={(e) => handleSlotPointerMove(slot.id, e)}
        onPointerUp={(e) => handleSlotPointerUp(slot.id, e)}
        onPointerCancel={(e) => handleSlotPointerUp(slot.id, e)}
        onDragOver={(e) => handleDragOverSlot(e, slot.id)}
        onDragLeave={() => handleDragLeaveSlot(slot.id)}
        onDrop={(e) => handleDropOnSlot(e, slot.id)}
        draggable={hasPlayer}
        onDragStart={(e) => handleDragStartFromSlot(e, slot.id)}
        title={
          hasPlayer
            ? `${slot.player.nameKor || slot.player.name} (${slot.pos}) - 드래그하여 필드 원하는 위치로 이동하거나 ✕를 눌러 제거`
            : `${slot.pos} 빈 슬롯 - 드래그하여 원하는 위치로 이동하거나 클릭하여 선수 영입`
        }
      >
        {hasPlayer ? (
          <div className="slot-filled-card">
            <button
              type="button"
              className="slot-remove-btn"
              onClick={(e) => handleRemovePlayerFromSlot(slot.id, e)}
              title="선수 제외"
            >
              ✕
            </button>

            <div className="slot-player-avatar-box">
              <span className="slot-player-jersey">👕</span>
              {slot.player.teamEmblem && (
                <img
                  src={slot.player.teamEmblem}
                  alt={slot.player.teamName || 'team'}
                  className="slot-team-crest"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="slot-player-info">
              <span className="slot-player-name">
                {slot.player.nameKor || slot.player.name}
              </span>
              <span className="slot-player-team">
                {slot.player.teamNameKor || slot.player.teamName}
              </span>
            </div>
          </div>
        ) : (
          <div className="slot-empty-circle">
            <span className={`slot-pos-badge ${slot.pos.toLowerCase()}`}>
              {slot.pos}
            </span>
            <span className="slot-plus-icon">+</span>
          </div>
        )}
      </div>
    );
  }
}

