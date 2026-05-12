import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import { colors, borderRadius, shadows, spacing } from './theme'

const globalStyle = document.createElement('style')
globalStyle.textContent = `
  :root {
    --font-display: 'Noto Serif SC', 'STSong', 'SimSun', 'PingFang SC', 'Microsoft YaHei', serif;
    --font-body: -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
    --bg-warm: ${colors.bg};
    --text-primary: ${colors.textPrimary};
    --text-secondary: ${colors.textSecondary};
    --primary: ${colors.primary};
    --primary-light: ${colors.primaryLight};
    --border-warm: ${colors.border};
  }

  * {
    outline: none !important;
    scrollbar-width: thin;
    scrollbar-color: ${colors.border} transparent;
  }
  *:focus { outline: none !important; }
  *:focus-visible { outline: none !important; }
  ::selection { background: transparent; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${colors.textMuted}; }

  body {
    user-select: none;
    -webkit-user-select: none;
    font-family: var(--font-body);
    font-weight: 400;
    background: ${colors.bg};
    background-image: radial-gradient(ellipse at 15% 40%, ${colors.primaryGlow} 0%, transparent 55%),
      radial-gradient(ellipse at 85% 60%, ${colors.primaryGlow} 0%, transparent 55%),
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,115,42,0.006) 2px, rgba(212,115,42,0.006) 4px);
    background-attachment: fixed;
    color: ${colors.textPrimary};
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-body);
    font-weight: 600;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 8px ${colors.primary}44; }
    50% { box-shadow: 0 0 16px ${colors.primary}66; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @keyframes badgePop {
    0% { transform: scale(0.8); opacity: 0; }
    60% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .page-enter {
    animation: fadeInUp 0.5s ease both;
  }

  .stagger-enter {
    animation: fadeInUp 0.4s ease both;
  }

  .skeleton-pulse {
    animation: pulseGlow 2s ease-in-out infinite;
  }

  input, textarea, [contenteditable] {
    user-select: text;
    -webkit-user-select: text;
  }

  .ant-btn {
    font-family: var(--font-body) !important;
    font-weight: 500 !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .ant-btn-primary:active {
    transform: scale(0.97) !important;
  }

  .ant-btn:not(.ant-btn-text):not(.ant-btn-link):hover {
    transform: translateY(-2px);
    box-shadow: ${shadows.warm};
  }

  .ant-btn-default:hover {
    border-color: ${colors.primary} !important;
    color: ${colors.primary} !important;
  }

  .ant-card {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border-radius: ${borderRadius.card}px !important;
    border: 1px solid ${colors.borderLight} !important;
    background: ${colors.white} !important;
  }

  .ant-card .ant-card-cover {
    border-radius: ${borderRadius.card}px ${borderRadius.card}px 0 0 !important;
    overflow: hidden !important;
  }

  .ant-input, .ant-input-affix-wrapper {
    font-family: var(--font-body) !important;
    font-weight: 500 !important;
    transition: all 0.25s ease !important;
  }

  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper-focused {
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 3px ${colors.primaryGlow} !important;
  }

  .ant-input:hover {
    border-color: ${colors.primary}88 !important;
  }

  .ant-tabs-tab {
    font-family: var(--font-body) !important;
    font-weight: 500 !important;
    transition: all 0.25s ease !important;
  }

  .ant-tabs-tab:hover {
    color: ${colors.primary} !important;
  }

  .ant-tabs-ink-bar {
    background: ${colors.primary} !important;
    height: 3px !important;
    border-radius: 2px !important;
  }

  .ant-tag {
    font-family: var(--font-body) !important;
    font-weight: 500 !important;
    border-radius: ${borderRadius.tag}px !important;
    padding: 2px 10px !important;
    border: none !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .ant-tag:hover {
    transform: scale(1.06);
  }

  .ant-pagination .ant-pagination-item {
    transition: all 0.2s ease !important;
    border-radius: ${borderRadius.button}px !important;
  }

  .ant-pagination .ant-pagination-item-active {
    border-color: ${colors.primary} !important;
    background: ${colors.primaryLight} !important;
    box-shadow: 0 0 0 2px ${colors.primaryGlow} !important;
  }

  .ant-pagination .ant-pagination-item-active a {
    color: ${colors.primary} !important;
  }

  .ant-pagination .ant-pagination-item:hover {
    border-color: ${colors.primary}88 !important;
  }

  .ant-pagination .ant-pagination-item:hover a {
    color: ${colors.primary} !important;
  }

  .ant-select-selector {
    font-family: var(--font-body) !important;
    font-weight: 500 !important;
    border-radius: ${borderRadius.input}px !important;
    transition: all 0.25s ease !important;
  }

  .ant-select-selector:hover {
    border-color: ${colors.primary}88 !important;
  }

  .ant-modal-content {
    border-radius: ${borderRadius.modal}px !important;
    background: ${colors.white} !important;
    box-shadow: ${shadows.lg} !important;
  }

  .ant-modal-header {
    background: transparent !important;
    border-radius: ${borderRadius.modal}px ${borderRadius.modal}px 0 0 !important;
  }

  .ant-empty-normal {
    margin-block: 40px !important;
  }

  .ant-segmented-item-selected {
    background: ${colors.primaryLight} !important;
    color: ${colors.primary} !important;
  }

  .ant-segmented-item:hover {
    color: ${colors.primary} !important;
  }

  .ant-steps-item-process .ant-steps-item-icon {
    background: ${colors.primary} !important;
    border-color: ${colors.primary} !important;
    transition: all 0.3s ease;
  }

  .ant-steps-item-finish .ant-steps-item-icon {
    border-color: ${colors.primary} !important;
  }

  .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon {
    color: ${colors.primary} !important;
  }

  .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-tail::after {
    background: ${colors.primary} !important;
  }

  .ant-progress-bg {
    background: linear-gradient(90deg, ${colors.primary}, ${colors.accent}) !important;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .ant-radio-button-wrapper-checked {
    background: ${colors.primaryLight} !important;
    border-color: ${colors.primary} !important;
    color: ${colors.primary} !important;
  }

  .ant-radio-button-wrapper-checked::before {
    background: ${colors.primary} !important;
  }

  .ant-alert-info {
    background: ${colors.primaryLight} !important;
    border: 1px solid ${colors.primary}22 !important;
  }

  .ant-popconfirm .ant-btn-primary {
    background: ${colors.danger} !important;
    border-color: ${colors.danger} !important;
  }

  .ant-popconfirm .ant-btn-primary:hover {
    background: ${colors.danger} !important;
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .ant-dropdown-menu-item:hover {
    background: ${colors.primaryLight} !important;
  }

  .ant-select-focused .ant-select-selector,
  .ant-select-selector:focus {
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 3px ${colors.primaryGlow} !important;
  }

  .ant-message-notice-content {
    border-radius: ${borderRadius.pill}px !important;
    box-shadow: ${shadows.md} !important;
  }

  .ant-skeleton .ant-skeleton-title {
    background: linear-gradient(90deg, ${colors.borderLight} 25%, ${colors.bg} 50%, ${colors.borderLight} 75%) !important;
    background-size: 200% 100% !important;
    animation: shimmer 1.5s infinite !important;
  }

  .ant-tabs-tabpane {
    animation: fadeInUp 0.3s ease both;
  }

  .ant-list-item {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .ant-result {
    animation: fadeInUp 0.4s ease both;
  }

  .ant-steps {
    animation: fadeIn 0.3s ease both;
  }

  .markdown-body {
    font-family: var(--font-body);
    line-height: 1.8;
    color: ${colors.textSecondary};
  }
  .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
    font-family: var(--font-body);
    color: ${colors.textPrimary};
    font-weight: 600;
    margin: 1.2em 0 0.6em;
  }
  .markdown-body h1 { font-size: 1.3em; }
  .markdown-body h2 { font-size: 1.15em; }
  .markdown-body h3 { font-size: 1.05em; }
  .markdown-body p { margin: 0 0 0.8em; }
  .markdown-body ul, .markdown-body ol { padding-left: 1.5em; margin: 0.4em 0; }
  .markdown-body li { margin: 0.3em 0; }
  .markdown-body strong { color: ${colors.textPrimary}; font-weight: 600; }
  .markdown-body code {
    background: ${colors.bg};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: ${colors.primary};
  }
  .markdown-body pre {
    background: ${colors.bg};
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid ${colors.borderLight};
    margin: 0.8em 0;
  }
  .markdown-body pre code {
    background: none;
    padding: 0;
    color: ${colors.textSecondary};
  }
  .markdown-body blockquote {
    border-left: 3px solid ${colors.primary};
    margin: 0.8em 0;
    padding: 6px 16px;
    background: ${colors.primaryLight};
    border-radius: 0 6px 6px 0;
    color: ${colors.textSecondary};
  }
  .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8em 0;
  }
  .markdown-body th, .markdown-body td {
    border: 1px solid ${colors.borderLight};
    padding: 8px 12px;
    text-align: left;
  }
  .markdown-body th {
    background: ${colors.bg};
    font-weight: 600;
    color: ${colors.textPrimary};
  }
  .markdown-body hr {
    border: none;
    border-top: 1px solid ${colors.borderLight};
    margin: 1.2em 0;
  }
  .markdown-body a {
    color: ${colors.primary};
    text-decoration: none;
  }
  .markdown-body a:hover {
    text-decoration: underline;
  }
`
document.head.appendChild(globalStyle)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: colors.primary,
          colorPrimaryHover: colors.primaryHover,
          colorSuccess: colors.success,
          colorWarning: colors.warning,
          colorError: colors.danger,
          colorTextBase: colors.textPrimary,
          colorTextSecondary: colors.textSecondary,
          colorBgBase: colors.bg,
          colorBgContainer: colors.white,
          colorBorder: colors.border,
          colorBorderSecondary: colors.borderLight,
          borderRadius: borderRadius.button,
          fontSize: 14,
          controlHeight: 40,
          fontFamily: "'Noto Serif SC', 'Songti SC', serif",
          boxShadow: shadows.card,
          boxShadowSecondary: shadows.md,
        },
        components: {
          Card: {
            borderRadiusLG: borderRadius.card,
            paddingLG: spacing.cardPadding,
          },
          Menu: {
            itemBorderRadius: borderRadius.button,
          },
          Button: {
            borderRadius: borderRadius.button,
            controlHeight: 40,
            primaryShadow: shadows.warm,
          },
          Input: {
            borderRadius: borderRadius.input,
            controlHeight: 40,
          },
          Select: {
            controlHeight: 40,
          },
          Modal: {
            borderRadiusLG: borderRadius.modal,
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
