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
              data-ad-test="on"
            />

            {/* 광고 로드 대기/로컬 테스트용 플레이스홀더 */}
            <div className="global-footer__ad-placeholder" aria-hidden="true">
              <span className="global-footer__ad-icon">📢</span>
              <div className="global-footer__ad-text">
                <strong>PLUGIN FOOTER AD BANNER</strong>
                <p>프리미어리그 모든 순간을 함께하는 스마트한 축구 플랫폼</p>
              </div>
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
