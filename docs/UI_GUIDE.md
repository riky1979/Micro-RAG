# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다 — 마케팅 페이지가 아니라 매일 쓰는 대시보드.
2. 따뜻한 라이트 톤 고정 — 오프화이트 배경 + 웜 오렌지 포인트 1가지.
3. 한국어 가독성 우선 — `break-keep`으로 단어 단위 줄바꿈, 넉넉한 행간.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상
색상은 `globals.css`의 시맨틱 토큰으로 관리하고, Tailwind 클래스명으로 참조한다.

### 배경
| 용도 | 토큰 / 클래스 | 값 |
|------|------|------|
| 페이지 | `bg-surface` | oklch(98.5% 0.008 85) — 오프화이트 |
| 카드 | `bg-surface-raised` | oklch(100% 0 0) — 화이트 |

### 텍스트
| 용도 | 클래스 | 값 |
|------|------|------|
| 주 텍스트 | `text-ink` | oklch(22% 0.02 60) |
| 보조 텍스트 | `text-ink-soft` | oklch(46% 0.02 60) |
| 포인트 텍스트 | `text-accent` | oklch(64% 0.16 48) |

### 데이터/시맨틱 색상
| 용도 | 클래스 |
|------|------|
| 포인트 (accent) | `bg-accent` / `text-accent` — 웜 오렌지 |
| 테두리 | `border-line` — oklch(90% 0.012 75) |
| 카테고리 배지 | schedule=blue · finance=emerald · member=violet · resource=cyan · general=stone (`lib/categories.ts`) |

## 컴포넌트
### 카드
```
rounded-2xl border border-line bg-surface-raised p-6
```

### 버튼
```
Primary: rounded-xl bg-accent text-white hover:opacity-90
Text:    text-ink-soft hover:text-ink
```

### 입력 필드
```
rounded-xl border border-line bg-surface-raised px-4 py-3
```

## 레이아웃
- 전체 너비: 페이지에 따라 `max-w-3xl`~`max-w-6xl`
- 정렬: 좌측 정렬 기본
- 간격: `gap-3~4`, 섹션 간 `space-y-8`~`mt-10`

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | `text-3xl~6xl font-extrabold tracking-tight text-ink` |
| 카드 제목 | `text-xl font-bold text-ink` |
| 본문 | `text-sm leading-relaxed text-ink-soft` |
| 라벨/eyebrow | `text-xs font-bold uppercase tracking-wide text-accent` |

## 애니메이션
- transition은 hover 상태 전환에만 (`transition`, `--ease-out-expo`).
- 그 외 자동 재생 애니메이션·글로우 효과 금지.

## 아이콘
- SVG 인라인, strokeWidth 1.5.
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다.
