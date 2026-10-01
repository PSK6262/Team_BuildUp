import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice.js';
import { getMyShopData, purchaseShopItem } from '../api/userApi.js';
import '../css/PointShop.css';

// 포인트샵 판매 아이템 목록 (아이콘 & 이모티콘)
export const SHOP_ITEMS = [
  // --- 아이콘 카테고리 ---
  {
    id: 'icon_golden_trophy',
    type: 'icon',
    categoryName: '아이콘',
    name: '골든 트로피',
    visual: '🏆',
    price: 300,
    desc: '프리미어리그 챔피언의 영광을 상징하는 황금 트로피 프로필 아이콘',
  },
  {
    id: 'icon_classic_ball',
    type: 'icon',
    categoryName: '아이콘',
    name: '불타는 축구공',
    visual: '⚽',
    price: 150,
    desc: '경기장을 뜨겁게 달구는 클래식 축구공 시그니처 아이콘',
  },
  {
    id: 'icon_golden_boot',
    type: 'icon',
    categoryName: '아이콘',
    name: '골든 부츠',
    visual: '👟',
    price: 250,
    desc: '리그 최고의 골잡이에게 주어지는 득점왕 골든부츠 아이콘',
  },
  {
    id: 'icon_crown_legend',
    type: 'icon',
    categoryName: '아이콘',
    name: '황금 왕관',
    visual: '👑',
    price: 400,
    desc: 'PL 명예의 전당 레전드를 위한 시그니처 크라운 프로필 아이콘',
  },
  {
    id: 'icon_iron_shield',
    type: 'icon',
    categoryName: '아이콘',
    name: '철벽 방패',
    visual: '🛡️',
    price: 200,
    desc: '무실점 클린시트를 지켜내는 단단한 수호의 방패 아이콘',
  },
  {
    id: 'icon_captain_armband',
    type: 'icon',
    categoryName: '아이콘',
    name: '캡틴 완장',
    visual: '🎖️',
    price: 250,
    desc: '피치 위 팀을 이끄는 리더십의 상징 주장 완장 아이콘',
  },
  {
    id: 'icon_magic_playmaker',
    type: 'icon',
    categoryName: '아이콘',
    name: '마법의 패서',
    visual: '🎯',
    price: 350,
    desc: '환상적인 어시스트를 찔러주는 플레이메이커의 마법 아이콘',
  },
  {
    id: 'icon_gk_gloves',
    type: 'icon',
    categoryName: '아이콘',
    name: '거미손 글러브',
    visual: '🧤',
    price: 200,
    desc: '슈퍼 세이브로 팀을 구원하는 수문장의 골키퍼 글러브 아이콘',
  },

  // --- 이모티콘 카테고리 ---
  {
    id: 'emoticon_goal_fire',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '골 세레머니',
    visual: '🔥',
    price: 100,
    desc: '짜릿한 득점 순간 열광하는 시그니처 축하 응원 이모티콘',
  },
  {
    id: 'emoticon_red_card',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '심판 레드카드',
    visual: '🟥',
    price: 150,
    desc: '거친 파울과 판정에 분노를 표현하는 레드카드 이모티콘',
  },
  {
    id: 'emoticon_victory_party',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '승리의 축포',
    visual: '🎉',
    price: 120,
    desc: '극적인 역전승과 우승을 자축하는 화려한 팡파르 이모티콘',
  },
  {
    id: 'emoticon_var_check',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: 'VAR 판독중',
    visual: '📺',
    price: 150,
    desc: '숨죽이고 주심의 판독을 기다리는 긴장감 넘치는 VAR 모니터',
  },
  {
    id: 'emoticon_loud_whistle',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '열광의 나팔',
    visual: '📣',
    price: 100,
    desc: '경기장을 가득 메우는 서포터즈의 열렬한 함성과 나팔 이모티콘',
  },
  {
    id: 'emoticon_brick_wall',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '통곡의 벽',
    visual: '🧱',
    price: 120,
    desc: '상대의 파상 공세를 빈틈없이 막아내는 짠물 수비 이모티콘',
  },
  {
    id: 'emoticon_peace_victory',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '승점 3점 V',
    visual: '✌️',
    price: 80,
    desc: '경기 종료 휘슬 후 승점 3점을 만끽하는 승리의 V 이모티콘',
  },
  {
    id: 'emoticon_crying_fan',
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '눈물바다',
    visual: '😭',
    price: 80,
    desc: '아쉬운 실점과 패배에 눈물 흘리는 서포터즈의 오열 이모티콘',
  },
];

export default function PointShop() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const user = useSelector((state) => state.auth.user);

  // USERS 테이블의 로그인된 user_id가 보유한 POINT 기반:
  // - 로그인이 안 되어 있거나 point가 0인 경우: 0 출력
  // - 포인트를 가지고 있는 경우: 현재 가지고 있는 포인트 출력
  const getDisplayPoint = (u, loggedIn) => {
    if (!loggedIn || !u || !u.userId) return 0;
    const pt = Number(u.point);
    return !isNaN(pt) && pt > 0 ? pt : 0;
  };

  const [currentPoint, setCurrentPoint] = useState(() => getDisplayPoint(user, isLoggedIn));

  // 구매 완료한 아이템 ID 목록 (로그인한 user_id별 로컬 스토리지 연동)
  const [purchasedItemIds, setPurchasedItemIds] = useState(() => {
    try {
      if (!isLoggedIn || !user?.userId) return [];
      const saved = localStorage.getItem(`buildup_purchased_items_${user.userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, icon, emoticon, my
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // 마운트 시 USERS 테이블의 최신 POINT 및 DB 인벤토리 데이터 동기화
  useEffect(() => {
    // 이전 가상 mock 포인트 캐시가 남아있다면 제거
    try {
      localStorage.removeItem('buildup_user_points');
    } catch {}

    const token = localStorage.getItem('buildup_token');
    if (!token || !isLoggedIn || !user?.userId) {
      setCurrentPoint(0);
      setPurchasedItemIds([]);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    fetch('/api/users/me', { headers })
      .then((res) => {
        if (!res.ok) throw new Error('인증 실패');
        return res.json();
      })
      .then((data) => {
        const freshUser = data.data || data.user;
        if (freshUser) {
          dispatch(updateUser(freshUser));
          const pt = Number(freshUser.point);
          setCurrentPoint(!isNaN(pt) && pt > 0 ? pt : 0);
        }
      })
      .catch(() => {
        setCurrentPoint(getDisplayPoint(user, isLoggedIn));
      });

    // DB USER_INVENTORY와 localStorage 보유 아이템 동기화
    getMyShopData()
      .then((shopData) => {
        if (shopData && Array.isArray(shopData.inventory)) {
          const dbItemIds = shopData.inventory
            .map((inv) => {
              const matched = SHOP_ITEMS.find((s) => s.name === inv.itemName);
              return matched ? matched.id : null;
            })
            .filter(Boolean);

          setPurchasedItemIds((prev) => {
            const merged = Array.from(new Set([...prev, ...dbItemIds]));
            try {
              localStorage.setItem(`buildup_purchased_items_${user.userId}`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [dispatch, isLoggedIn, user?.userId]);

  // Redux user 객체 변경 시(포인트 적립 등) 실시간 동기화
  useEffect(() => {
    setCurrentPoint(getDisplayPoint(user, isLoggedIn));
    if (isLoggedIn && user?.userId) {
      try {
        const saved = localStorage.getItem(`buildup_purchased_items_${user.userId}`);
        setPurchasedItemIds(saved ? JSON.parse(saved) : []);
      } catch {
        setPurchasedItemIds([]);
      }
    } else {
      setPurchasedItemIds([]);
    }
  }, [user, isLoggedIn]);

  // 토스트 메시지 자동 소멸
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleOpenPurchaseModal = (item) => {
    if (purchasedItemIds.includes(item.id)) return;

    if (!isLoggedIn || !user || !user.userId) {
      if (window.confirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?')) {
        window.location.assign('/plug/login');
      }
      return;
    }

    if (currentPoint < item.price) {
      alert(`포인트가 부족합니다!\n현재 보유 포인트: ${currentPoint.toLocaleString()} P\n필요 포인트: ${item.price.toLocaleString()} P\n\n승부예측이나 미니게임을 통해 포인트를 모아보세요!`);
      return;
    }

    setSelectedItemForPurchase(item);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItemForPurchase || !isLoggedIn || !user?.userId) return;

    const item = selectedItemForPurchase;
    const nextPoint = Math.max(0, currentPoint - item.price);
    const nextPurchased = Array.from(new Set([...purchasedItemIds, item.id]));

    setCurrentPoint(nextPoint);
    setPurchasedItemIds(nextPurchased);

    // localStorage 보유 아이템 및 구매 내역 즉시 반영
    try {
      localStorage.setItem(`buildup_purchased_items_${user.userId}`, JSON.stringify(nextPurchased));

      const historyKey = `buildup_purchase_history_${user.userId}`;
      const prevHistoryRaw = localStorage.getItem(historyKey);
      const prevHistory = prevHistoryRaw ? JSON.parse(prevHistoryRaw) : [];
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const orderedAtStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const newOrderEntry = {
        orderId: `LOCAL_${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type === 'icon' ? 'ICON' : 'EMOTICON',
        categoryName: item.categoryName,
        point: item.price,
        imageUrl: item.visual,
        description: item.desc,
        orderStatus: 'COMPLETED',
        orderedAt: orderedAtStr,
      };
      localStorage.setItem(historyKey, JSON.stringify([newOrderEntry, ...prevHistory]));
    } catch {}

    // 백엔드 DB 연동 (USER_INVENTORY, ITEM_ORDERS, POINT_TRANSACTIONS, USERS.POINT)
    try {
      const result = await purchaseShopItem(item);
      if (result && result.user) {
        dispatch(updateUser(result.user));
        const dbPt = Number(result.user.point);
        if (!isNaN(dbPt)) {
          setCurrentPoint(Math.max(0, dbPt));
        }
      } else {
        dispatch(updateUser({ ...user, point: nextPoint }));
      }
    } catch {
      dispatch(updateUser({ ...user, point: nextPoint }));
    }

    setSelectedItemForPurchase(null);
    setToastMessage(`🎉 [${item.name}] 구매가 완료되었습니다!`);
  };

  // 탭 필터링
  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'my') return purchasedItemIds.includes(item.id);
    return item.type === activeTab;
  });

  const iconCount = SHOP_ITEMS.filter((i) => i.type === 'icon').length;
  const emoticonCount = SHOP_ITEMS.filter((i) => i.type === 'emoticon').length;
  const myCount = purchasedItemIds.length;

  // 모바일 반응형 2열 2줄 (4개씩) 청크 분할 (팀 소개 페이지 선수단 스쿼드 반응형 방식)
  const pageSize = 4;
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < filteredItems.length; i += pageSize) {
      chunks.push(filteredItems.slice(i, i + pageSize));
    }
    return chunks;
  }, [filteredItems]);
  const totalPages = pages.length;

  const trackRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (el && el.clientWidth > 0) {
      const page = Math.round(el.scrollLeft / el.clientWidth);
      if (page !== currentPage && page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    }
  };

  const scrollToPage = (pageIdx) => {
    if (!trackRef.current) return;
    const targetLeft = pageIdx * trackRef.current.clientWidth;
    trackRef.current.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });
    setCurrentPage(pageIdx);
  };

  // 탭 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(0);
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
  }, [activeTab]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartXRef.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
    if (deltaX > 8 || deltaY > 8) {
      isSwipingRef.current = true;
    }
  };

  return (
    <main className="point-page-container">
      <div className="point-page-wrapper">
        {/* 헤더 영역 (경기 일정 페이지 스타일 100% 일치) */}
        <header className="point-page-header">
          <span className="point-page-eyebrow">PREMIER LEAGUE POINT SHOP</span>
          <h1 className="point-page-title">프리미어리그 포인트샵</h1>
          <p className="point-page-desc">
            모아놓은 포인트로 아이콘, 이모티콘을 구매하세요!!
          </p>
        </header>

        {/* 상단 보유 포인트 배너 */}
        <section className="point-balance-banner" aria-label="내 포인트 현황">
          <div className="point-balance-left">
            <div className="point-coin-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9.5" stroke="#78350f" strokeWidth="2" fill="#ffd000"/>
                <text x="12" y="16.5" textAnchor="middle" fill="#78350f" fontSize="13" fontWeight="900" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">P</text>
              </svg>
            </div>
            <div>
              <div className="point-balance-label">내 보유 포인트</div>
              <div className="point-balance-value">
                {currentPoint.toLocaleString()}
                <span className="point-balance-unit">P</span>
              </div>
            </div>
          </div>

          <div className="point-balance-right">
            {isLoggedIn ? (
              <a href="/plug/mypage" className="point-history-link" title="마이페이지에서 포인트 변동 이력 보기">
                <span>포인트 내역 보기</span>
                <span aria-hidden="true">→</span>
              </a>
            ) : (
              <div className="point-login-prompt">
                <span>로그인하고 포인트를 적립해보세요!</span>
                <a href="/plug/login" className="point-login-btn">로그인</a>
              </div>
            )}
          </div>
        </section>

        {/* 카테고리 필터 탭 */}
        <nav className="point-category-tabs" aria-label="포인트샵 카테고리">
          <button
            type="button"
            className={`point-tab-btn ${activeTab === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            <span>전체</span>
            <span className="point-tab-count">{SHOP_ITEMS.length}</span>
          </button>

          <button
            type="button"
            className={`point-tab-btn ${activeTab === 'icon' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('icon')}
          >
            <span>아이콘</span>
            <span className="point-tab-count">{iconCount}</span>
          </button>

          <button
            type="button"
            className={`point-tab-btn ${activeTab === 'emoticon' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('emoticon')}
          >
            <span>이모티콘</span>
            <span className="point-tab-count">{emoticonCount}</span>
          </button>

          <button
            type="button"
            className={`point-tab-btn ${activeTab === 'my' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <span>내 보관함</span>
            <span className="point-tab-count">{myCount}</span>
          </button>
        </nav>

        {/* 아이템 그리드 & 모바일 스쿼드형 슬라이더 */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
            <p style={{ fontSize: '16px', fontWeight: '700' }}>
              {activeTab === 'my' ? '보유한 아이템이 없습니다. 마음에 드는 아이템을 구매해보세요!' : '해당 카테고리의 상품이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="point-squad-slider-container">
            {/* 모바일 반응형 상단 네비게이션 헤더 (2페이지 이상 시 노출) */}
            {totalPages > 1 && (
              <div className="point-squad-slider-nav" aria-label="상품 목록 넘기기">
                <button
                  type="button"
                  className="point-squad-arrow-btn point-squad-arrow-prev"
                  onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  aria-label="이전 상품 목록 보기"
                >
                  ‹
                </button>
                <span className="point-squad-page-indicator">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  className="point-squad-arrow-btn point-squad-arrow-next"
                  onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  aria-label="다음 상품 목록 보기"
                >
                  ›
                </button>
              </div>
            )}

            <div
              ref={trackRef}
              className="point-squad-slider-track point-items-grid"
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              {pages.map((pageItems, pageIdx) => (
                <div key={pageIdx} className="point-squad-slide">
                  {pageItems.map((item) => {
                    const isOwned = purchasedItemIds.includes(item.id);

                    return (
                      <article key={item.id} className="point-item-card">
                        {/* 상단 뱃지 */}
                        <span className={`point-item-badge point-item-badge--${item.type}`}>
                          {item.categoryName}
                        </span>

                        {/* 시각적 미리보기 */}
                        <div className="point-item-preview-box">
                          <span className="point-item-visual">{item.visual}</span>
                        </div>

                        {/* 정보 영역 */}
                        <div className="point-item-info">
                          <h3 className="point-item-title">{item.name}</h3>
                          <p className="point-item-desc">{item.desc}</p>

                          <div className="point-item-action-row">
                            <div className="point-item-price">
                              <span>{item.price.toLocaleString()} P</span>
                            </div>

                            {isOwned ? (
                              <button type="button" className="point-buy-btn point-buy-btn--owned" disabled>
                                ✓ 보유중
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="point-buy-btn point-buy-btn--active"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSwipingRef.current) return;
                                  handleOpenPurchaseModal(item);
                                }}
                              >
                                구매하기
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 모바일 반응형 하단 인디케이터 점 & 스와이프 안내 문구 */}
            {totalPages > 1 && (
              <div className="point-squad-slider-footer">
                <div className="point-squad-dots">
                  {pages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`point-squad-dot ${currentPage === idx ? 'is-active' : ''}`}
                      onClick={() => scrollToPage(idx)}
                      aria-label={`${idx + 1}페이지로 이동`}
                    />
                  ))}
                </div>
                <span className="point-squad-swipe-hint">스와이프하여 넘겨보기 ↔</span>
              </div>
            )}
          </div>
        )}

        {/* 구매 확인 모달창 */}
        {selectedItemForPurchase && (
          <div className="point-modal-backdrop" onClick={() => setSelectedItemForPurchase(null)}>
            <div className="point-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="point-modal-visual">{selectedItemForPurchase.visual}</div>
              <h3 className="point-modal-title">[{selectedItemForPurchase.name}] 구매</h3>
              <p className="point-modal-text">
                선택하신 {selectedItemForPurchase.categoryName}을(를) 구매하시겠습니까?
              </p>

              <div className="point-modal-summary-box">
                <span>차감 포인트</span>
                <span style={{ fontWeight: '800', color: '#e90052' }}>
                  -{selectedItemForPurchase.price.toLocaleString()} P
                </span>
              </div>

              <div className="point-modal-summary-box">
                <span>구매 후 잔여 포인트</span>
                <span style={{ fontWeight: '800', color: '#00ff87' }}>
                  {(currentPoint - selectedItemForPurchase.price).toLocaleString()} P
                </span>
              </div>

              <div className="point-modal-actions">
                <button
                  type="button"
                  className="point-modal-btn point-modal-btn--cancel"
                  onClick={() => setSelectedItemForPurchase(null)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="point-modal-btn point-modal-btn--confirm"
                  onClick={handleConfirmPurchase}
                >
                  구매 확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 성공 안내 토스트 */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#e90052',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '999px',
              fontWeight: '800',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(233, 0, 82, 0.5)',
              zIndex: 10000,
              animation: 'modalPop 0.25s ease'
            }}
          >
            {toastMessage}
          </div>
        )}
      </div>
    </main>
  );
}
