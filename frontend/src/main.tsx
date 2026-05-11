import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import { colors, borderRadius, spacing } from './theme'

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
          colorBgBase: colors.bg,
          borderRadius: borderRadius.button,
          colorBorder: colors.border,
          fontSize: 14,
          controlHeight: 40,
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
