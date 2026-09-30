import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * [관리자 센터 전용 커스텀 드롭다운 - BuildUp_FE/src/components/admin/AdminSelect.jsx]
 *
 * 브라우저 기본 <select>/<option>의 투박한 OS 기본 팝업을 대체하며,
 * 기존 <select value={...} onChange={...}><option>...</option></select> 문법과 100% 호환됩니다.
 */
export default function AdminSelect({
  value,
  onChange,
  children,
  className = '',
  style = {},
  title = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // children(<option>) 파싱
  const options = useMemo(() => {
    const list = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        list.push({
          value: child.props.value !== undefined ? String(child.props.value) : '',
          label: child.props.children,
          disabled: Boolean(child.props.disabled),
        });
      }
    });
    return list;
  }, [children]);

  const currentStrValue = value !== undefined && value !== null ? String(value) : '';
  const selectedOption = options.find((opt) => opt.value === currentStrValue) || options[0] || { label: '선택', value: '' };

  // 외부 클릭 및 ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: opt.value } });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`admin-custom-select ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
      title={title}
    >
      <button
        type="button"
        className="admin-custom-select__trigger"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="admin-custom-select__label">{selectedOption.label}</span>
        <span className="admin-custom-select__arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul className="admin-custom-select__menu" role="listbox">
          {options.map((opt, idx) => {
            const isSelected = opt.value === currentStrValue;
            return (
              <li
                key={`${opt.value}-${idx}`}
                role="option"
                aria-selected={isSelected}
                className={`admin-custom-select__option ${isSelected ? 'is-selected' : ''} ${opt.disabled ? 'is-disabled' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <span className="admin-custom-select__option-text">{opt.label}</span>
                {isSelected && (
                  <span className="admin-custom-select__check" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
