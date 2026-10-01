import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice.js';
import {
  DEFAULT_SHOP_ITEMS,
  getShopItems,
  getUserInventory,
  purchaseShopItem,
  getUserPoint,
} from '../api/shopApi.js';
import { getMyProfile } from '../api/userApi.js';
import '../css/PointShop.css';

export default function PointShop() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const user = useSelector((state) => state.auth.user);
  const userId = user?.userId ?? user?.user_id ?? user?.id;

  // USERS 테이블의 로그인된 user_id가 보유한 POINT 기반:
  // - 로그인이 안 되어 있거나 point가 0인 경우: 0 출력
  // - 포인트를 가지고 있는 경우: 현재 가지고 있는 포인트 출력
  const getDisplayPoint = (u, loggedIn) => {
    if (!loggedIn || !u) return 0;
    const uid = u.userId ?? u.user_id ?? u.id;
    if (!uid) return 0;
    const pt = Number(u.point ?? u.userPoint ?? u.POINT);
    return !isNaN(pt) && pt > 0 ? pt : 0;
  };

  const [currentPoint, setCurrentPoint] = useState(() => getDisplayPoint(user, isLoggedIn));
  const [shopItems, setShopItems] = useState(DEFAULT_SHOP_ITEMS);

  // 구매 완료한 아이템 ID 목록 (USER_INVENTORY 테이블 + localStorage 캐시 동기화)
  const [purchasedItemIds, setPurchasedItemIds] = useState(() => {
    try {
      const currentUid = user?.userId ?? user?.user_id ?? user?.id;
      if (!isLoggedIn || !currentUid) return [];
      const saved = localStorage.getItem(`buildup_purchased_items_${currentUid}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, icon, emoticon, my
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [insufficientModalData, setInsufficientModalData] = useState(null);

  // 1. SHOP_ITEMS 테이블에서 실시간 상품 목록 로드
  // 마운트 시 USERS 테이블의 최신 POINT 및 DB 인벤토리 데이터 동기화
  useEffect(() => {
    let isMounted = true;
    getShopItems()
      .then((items) => {
        if (isMounted && Array.isArray(items) && items.length > 0) {
          const mapped = items.map((it) => ({
            itemId: it.itemId,
            id: it.itemId,
            type: (it.itemType || 'icon').toLowerCase(),
            categoryName: (it.itemType || '').toUpperCase() === 'ICON' ? '아이콘' : '이모티콘',
            name: it.itemName,
            visual: it.imageUrl || '⚽',
            price: Number(it.point) || 0,
            desc: it.description || '',
            isActive: it.isActive,
          }));
          setShopItems(mapped);
        }
      })
      .catch((err) => {
        console.warn('DB 상품 목록 조회 실패 (기본 목록 유지):', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. 로그인 회원의 USER_INVENTORY 및 USERS.POINT 최신 데이터 동기화
  useEffect(() => {
    const token = localStorage.getItem('buildup_token');
    if (!isLoggedIn && !token) {
      setCurrentPoint(0);
      setPurchasedItemIds([]);
      return;
    }

    // 최신 프로필 정보 동기화 (Redux user 갱신)
    getMyProfile()
      .then((profile) => {
        if (profile) {
          dispatch(updateUser(profile));
          if (profile.point !== undefined) {
            const p = Number(profile.point);
            setCurrentPoint(!isNaN(p) && p > 0 ? p : 0);
          }
        }
      })
      .catch(() => {});

    // USERS.POINT 최신 잔액 조회 (/api/shop/point)
    getUserPoint()
      .then((pt) => {
        if (typeof pt === 'number') {
          const validPoint = pt > 0 ? pt : 0;
          setCurrentPoint(validPoint);
          dispatch(updateUser({ point: validPoint }));
        }
      })
      .catch(() => {
        setCurrentPoint(getDisplayPoint(user, isLoggedIn));
      });

    // USER_INVENTORY 회원의 보관함 조회 (/api/shop/inventory)
    getUserInventory()
      .then((inventory) => {
        if (Array.isArray(inventory)) {
          const owned = inventory.map((inv) => inv.itemId);
          setPurchasedItemIds(owned);
          const currentUid = userId || user?.userId;
          if (currentUid) {
            try {
              localStorage.setItem(`buildup_purchased_items_${currentUid}`, JSON.stringify(owned));
            } catch {}
          }
        }
      })
      .catch((err) => {
        console.warn('인벤토리 조회 실패 (로컬 스토리지 사용):', err);
      });
  }, [dispatch, isLoggedIn, userId]);

  // Redux user 객체 변경 시 실시간 동기화
  useEffect(() => {
    setCurrentPoint(getDisplayPoint(user, isLoggedIn));
    const currentUid = user?.userId ?? user?.user_id ?? user?.id;
    if (isLoggedIn && currentUid) {
      try {
        const saved = localStorage.getItem(`buildup_purchased_items_${currentUid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setPurchasedItemIds((prev) => (prev.length > 0 ? prev : parsed));
        }
      } catch {}
    } else if (!isLoggedIn) {
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
    const targetId = item.itemId || item.id;
    const isOwned = purchasedItemIds.some((id) => Number(id) === Number(targetId));
    if (isOwned) return;

    const token = localStorage.getItem('buildup_token');
    const currentUid = user?.userId ?? user?.user_id ?? user?.id;
    if ((!isLoggedIn && !token) || (!currentUid && !token)) {
      if (window.confirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?')) {
        window.location.assign('/plug/login');
      }
      return;
    }

    if (currentPoint < item.price) {
      setInsufficientModalData({
        item,
        shortage: item.price - currentPoint,
      });
      return;
    }

    setSelectedItemForPurchase(item);
  };

  // 5개 테이블 상호작용 구매 처리 (USERS, SHOP_ITEMS, ITEM_ORDERS, POINT_TRANSACTIONS, USER_INVENTORY)
  const handleConfirmPurchase = async () => {
    if (!selectedItemForPurchase) return;
    const token = localStorage.getItem('buildup_token');
    if (!isLoggedIn && !token) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    const item = selectedItemForPurchase;
    const targetItemId = item.itemId || item.id;
    setIsPurchasing(true);

    try {
      // 백엔드 트랜잭션 호출:
      // 1. SHOP_ITEMS 아이템 검증
      // 2. USERS.POINT 비관적 락 및 차감
      // 3. ITEM_ORDERS 주문 내역 등록
      // 4. POINT_TRANSACTIONS 포인트 변동 트랜잭션 기록
      // 5. USER_INVENTORY 보관함 등록
      const res = await purchaseShopItem(targetItemId);

      if (res) {
        const nextPoint = res.remainingPoint !== undefined
          ? Math.max(0, Number(res.remainingPoint))
          : Math.max(0, currentPoint - item.price);
        const nextPurchased = Array.from(new Set([...purchasedItemIds, targetItemId]));

        setCurrentPoint(nextPoint);
        setPurchasedItemIds(nextPurchased);

        // USERS 상태(Redux 및 localStorage) 최신 포인트 반영
        dispatch(updateUser({ ...user, point: nextPoint }));
        const currentUid = userId || user?.userId;
        if (currentUid) {
          try {
            localStorage.setItem(`buildup_purchased_items_${currentUid}`, JSON.stringify(nextPurchased));

            const historyKey = `buildup_purchase_history_${currentUid}`;
            const prevHistoryRaw = localStorage.getItem(historyKey);
            const prevHistory = prevHistoryRaw ? JSON.parse(prevHistoryRaw) : [];
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const orderedAtStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            const newOrderEntry = {
              orderId: res.orderId || `LOCAL_${Date.now()}`,
              itemId: targetItemId,
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
        }

        setSelectedItemForPurchase(null);
        setToastMessage(`🎉 [${item.name}] 구매가 완료되었습니다!`);

        // 백엔드 최신 상태 재검증 및 완전 동기화
        getUserPoint().then((pt) => {
          if (typeof pt === 'number') {
            const p = pt > 0 ? pt : 0;
            setCurrentPoint(p);
            dispatch(updateUser({ point: p }));
          }
        }).catch(() => {});
        getUserInventory().then((inv) => {
          if (Array.isArray(inv)) {
            setPurchasedItemIds(inv.map((i) => i.itemId));
          }
        }).catch(() => {});
      }
    } catch (err) {
      alert(err.message || '아이템 구매에 실패했습니다.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // 탭 필터링
  const filteredItems = shopItems.filter((item) => {
    const targetId = item.itemId || item.id;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'my') return purchasedItemIds.some((id) => Number(id) === Number(targetId));
    return item.type === activeTab;
  });

  const iconCount = shopItems.filter((i) => i.type === 'icon').length;
  const emoticonCount = shopItems.filter((i) => i.type === 'emoticon').length;
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
                <span className="point-login-prompt-text">로그인하고 포인트 적립</span>
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
            <span className="point-tab-count">{shopItems.length}</span>
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
                    const isOwned = purchasedItemIds.some((id) => Number(id) === Number(item.itemId || item.id));

                    return (
                      <article key={item.itemId || item.id} className="point-item-card">
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

            {/* 모바일 반응형 하단 인디케이터 점 & 네비게이션 컨트롤 (‹ 1 / 4 ›) */}
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
              </div>
            )}
          </div>
        )}

        {/* 구매 확인 모달창 */}
        {selectedItemForPurchase && (
          <div className="point-modal-backdrop" onClick={() => !isPurchasing && setSelectedItemForPurchase(null)}>
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
                  disabled={isPurchasing}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="point-modal-btn point-modal-btn--confirm"
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? '구매 처리중...' : '구매 확인'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 포인트 부족 커스텀 모달 */}
        {insufficientModalData && (
          <div
            className="point-modal-backdrop"
            onClick={() => setInsufficientModalData(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="insufficient-modal-title"
          >
            <div
              className="point-modal-card point-insufficient-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="point-modal-close-btn"
                onClick={() => setInsufficientModalData(null)}
                aria-label="모달 닫기"
              >
                ✕
              </button>

              <h3 id="insufficient-modal-title" className="point-modal-title point-insufficient-title">
                포인트가 부족합니다
              </h3>

              <p className="point-insufficient-subtext">
                승부예측을 통해 포인트를 모아보세요!
              </p>

              <div className="point-insufficient-detail-box">
                <div className="point-insufficient-row">
                  <span className="point-insufficient-row-label">구매 상품</span>
                  <span className="point-insufficient-row-value point-insufficient-row-item">
                    {insufficientModalData.item.visual} {insufficientModalData.item.name}
                  </span>
                </div>
                <div className="point-insufficient-row">
                  <span className="point-insufficient-row-label">상품 가격</span>
                  <span className="point-insufficient-row-value">
                    {insufficientModalData.item.price.toLocaleString()} P
                  </span>
                </div>
                <div className="point-insufficient-row">
                  <span className="point-insufficient-row-label">현재 보유</span>
                  <span className="point-insufficient-row-value">
                    {currentPoint.toLocaleString()} P
                  </span>
                </div>
                <div className="point-insufficient-divider" />
                <div className="point-insufficient-row point-insufficient-row--shortage">
                  <span className="point-insufficient-row-label">부족한 포인트</span>
                  <span className="point-insufficient-row-value point-insufficient-shortage-val">
                    {insufficientModalData.shortage.toLocaleString()} P
                  </span>
                </div>
              </div>

              <div className="point-insufficient-actions">
                <button
                  type="button"
                  className="point-insufficient-btn point-insufficient-btn--cancel"
                  onClick={() => setInsufficientModalData(null)}
                >
                  닫기
                </button>
                <a
                  href="/plug/prediction"
                  className="point-insufficient-btn point-insufficient-btn--predict"
                >
                  <span>승부예측 하러가기</span>
                  <span aria-hidden="true">⚽</span>
                </a>
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

