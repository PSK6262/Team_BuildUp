import { useEffect, useRef } from 'react'
import '../css/GlobalFooter.css'

export default function GlobalFooter() {
  const adRef = useRef(null)
  const isPushed = useRef(false)

  useEffect(() => {
    // AdSense adsbygoogle push 실행 (중복 호출 방지 및 예외 처리)
    if (isPushed.current) return

    try {
      if (typeof window !== 'undefined' && adRef.current) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        isPushed.current = true
      }
    } catch (e) {
      // 로컬 개발 환경 또는 광고 차단 시 예외 무시
      console.debug('AdSense script initialization:', e)
    }
  }, [])

  return (
    <footer className="global-footer">
      <div className="global-footer__inner">
        {/* 광고 영역 */}
        <section className="global-footer__ad-section" aria-label="광고 영역">
          <div className="global-footer__ad-badge">ADVERTISEMENT</div>
          <div className="global-footer__ad-box">
            {/* 실제 애드센스 단위 */}
            <ins
              ref={adRef}
              className="adsbygoogle global-footer__ins"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-6961977480009285"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />

            {/* 광고 로드 대기/로컬 테스트용 플레이스홀더 */}
            <div className="global-footer__ad-placeholder sample-sports-ad" aria-label="가상 스포츠 브랜드 터치라인 샘플 광고">
              <div className="sample-sports-ad__brand">TOUCHLINE<span>FOOTBALL ESSENTIALS</span></div>
              <div className="sample-sports-ad__copy"><span className="sample-sports-ad__eyebrow">FROM THE STANDS TO THE PITCH</span><strong>주말의 킥오프,<br />준비는 끝났다.</strong><p>풋볼 웨어 · 트레이닝 기어 · 매치데이 컬렉션</p></div>
              <div className="sample-sports-ad__art" aria-hidden="true"><span>90</span><small>MINUTES.<br />ALL IN.</small></div>
              <span className="sample-sports-ad__disclosure">가상 브랜드 · 샘플 광고</span>
            </div>
          </div>
        </section>

        {/* 푸터 정보 영역 */}
        <div className="global-footer__meta">
          <div className="global-footer__brand">
            <span className="global-footer__logo">PL:UG</span>
            <span className="global-footer__team">Team BUILDUP</span>
          </div>
          <p className="global-footer__desc">
            PLUGIN은 프리미어리그(EPL) 축구 팬들을 위한 경기 일정, 실시간 분석 및 커뮤니티 종합 플랫폼입니다.
          </p>
          <div className="global-footer__copyright">
            © 2026 PLUGIN (BUILDUP). All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
