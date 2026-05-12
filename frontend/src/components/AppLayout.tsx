import { useState, createContext, useEffect, useRef, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Input, Button, Typography, Modal, Dropdown, message, Spin, Upload, Space } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  CheckCircleFilled,
  QrcodeOutlined,
  UploadOutlined,
  KeyOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { colors, shadows, borderRadius } from '../theme'
import ImportPage from '../pages/ImportPage'
import { startLogin, getLoginStatus, cancelLogin, getSettings, updateSettings, uploadCookiesFile } from '../api'

const { Dragger } = Upload

const { Header, Content } = Layout
const { Text } = Typography

export interface ImportContextType {
  openImport: () => void
}

export const ImportContext = createContext<ImportContextType>({ openImport: () => {} })

export default function AppLayout() {
  const navigate = useNavigate()
  const [importModalOpen, setImportModalOpen] = useState(false)

  const [loggedIn, setLoggedIn] = useState(false)
  const [cookiesFile, setCookiesFile] = useState<string | null>(null)
  const [cookiesValid, setCookiesValid] = useState<boolean | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrStatus, setQrStatus] = useState('')
  const [qrMessage, setQrMessage] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const loginIdRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [cookiesModalOpen, setCookiesModalOpen] = useState(false)
  const [cookiesPathInput, setCookiesPathInput] = useState('')
  const [cookiesUploading, setCookiesUploading] = useState(false)
  const [cookiesDragging, setCookiesDragging] = useState(false)

  const [searchValue, setSearchValue] = useState('')

  const loadStatus = useCallback(async () => {
    try {
      const res = await getSettings()
      if (res.data.cookies_file) {
        setCookiesFile(res.data.cookies_file)
        setCookiesValid(res.data.cookies_valid)
        setLoggedIn(res.data.cookies_valid === true)
        setAvatarUrl(res.data.avatar_url || null)
        setNickname(res.data.nickname || null)
      } else {
        setCookiesFile(null)
        setCookiesValid(null)
        setLoggedIn(false)
        setAvatarUrl(null)
        setNickname(null)
      }
    } catch {}
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleSearch = (val: string) => {
    if (val.trim()) {
      const params = new URLSearchParams(window.location.search)
      params.set('search', val.trim())
      navigate(`/?${params.toString()}`)
      setSearchValue('')
    }
  }

  const openImport = useCallback(() => setImportModalOpen(true), [])

  const handleStartLogin = async () => {
    setQrModalOpen(true)
    setQrCode(null)
    setQrStatus('starting')
    setQrMessage('正在启动...')
    setQrLoading(true)
    try {
      const res = await startLogin()
      const loginId = res.data.login_id
      loginIdRef.current = loginId
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await getLoginStatus(loginId)
          const data = statusRes.data
          setQrStatus(data.status)
          setQrMessage(data.message)
          if (data.qr_code) {
            setQrCode(`data:image/png;base64,${data.qr_code}`)
            setQrLoading(false)
          }
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url)
          }
          if (data.nickname) {
            setNickname(data.nickname)
          }
          if (data.status === 'success') {
            if (pollRef.current) clearInterval(pollRef.current)
            message.success('抖音登录成功！')
            loadStatus()
            setTimeout(() => setQrModalOpen(false), 1500)
          } else if (['timeout', 'error', 'cancelled'].includes(data.status)) {
            if (pollRef.current) clearInterval(pollRef.current)
            setQrLoading(false)
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current)
          setQrLoading(false)
          setQrStatus('error')
          setQrMessage('查询登录状态失败')
        }
      }, 2000)
    } catch {
      setQrLoading(false)
      setQrStatus('error')
      setQrMessage('启动登录失败')
      message.error('启动登录失败')
    }
  }

  const handleImportCookiesPath = async () => {
    if (!cookiesPathInput.trim()) return
    try {
      await updateSettings({ cookies_file: cookiesPathInput.trim() })
      message.success('Cookies 路径已设置')
      setCookiesModalOpen(false)
      setCookiesPathInput('')
      loadStatus()
    } catch {
      message.error('设置失败，请检查路径是否正确')
    }
  }

  const handleUploadCookiesFile = async (file: File) => {
    setCookiesUploading(true)
    try {
      await uploadCookiesFile(file)
      message.success('Cookies 文件已上传并生效')
      setCookiesModalOpen(false)
      loadStatus()
    } catch {
      message.error('上传失败')
    } finally {
      setCookiesUploading(false)
    }
  }

  const handleCancelLogin = () => {
    if (loginIdRef.current) {
      cancelLogin(loginIdRef.current).catch(() => {})
    }
    if (pollRef.current) clearInterval(pollRef.current)
    setQrModalOpen(false)
    setQrCode(null)
  }

  const userMenuItems = [
    ...(nickname
      ? [{
          key: 'nickname',
          label: (
            <div style={{ padding: '2px 0' }}>
              <Text strong style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>{nickname}</Text>
            </div>
          ),
          disabled: true,
        }]
      : []),
    ...(cookiesFile
      ? [{
          key: 'status',
          label: (
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                {cookiesValid ? (
                  <span style={{ color: colors.success }}>● 已登录</span>
                ) : (
                  <span style={{ color: colors.warning }}>● 已过期</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, wordBreak: 'break-all', marginTop: 2 }}>
                {cookiesFile}
              </div>
            </div>
          ),
          disabled: true,
        }]
      : [{ key: 'nologin', label: <span style={{ color: colors.danger }}>● 未登录</span>, disabled: true }]),
    { type: 'divider' as const },
    {
      key: 'login',
      icon: <QrcodeOutlined style={{ color: colors.primary }} />,
      label: <span style={{ color: colors.primary }}>扫码登录抖音</span>,
      onClick: handleStartLogin,
    },
    {
      key: 'cookies',
      icon: <KeyOutlined style={{ color: colors.accent }} />,
      label: <span style={{ color: colors.accent }}>导入 Cookies 文件</span>,
      onClick: () => {
        setCookiesPathInput(cookiesFile || '')
        setCookiesModalOpen(true)
      },
    },
  ]

  return (
    <ImportContext.Provider value={{ openImport }}>
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colors.white,
            boxShadow: shadows.sm,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: 60,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: 'none',
          }}
        >
          <div
            onClick={() => navigate('/')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              userSelect: 'none',
              transition: 'opacity 0.25s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: colors.white,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: shadows.warm,
              animation: 'pulseGlow 3s ease-in-out infinite',
            }}>
              豆
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 400,
              fontFamily: 'var(--font-display)',
              color: colors.textPrimary,
              letterSpacing: 2,
              transition: 'color 0.3s ease',
            }}>
              doucook
            </span>
          </div>

          <Input
            prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
            placeholder="搜菜谱、食材、标签..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={() => handleSearch(searchValue)}
            style={{
              maxWidth: 360,
              borderRadius: borderRadius.pill,
              background: colors.bg,
              border: `1px solid ${colors.borderLight}`,
              fontFamily: 'var(--font-body)',
            }}
            allowClear
          />
          <div style={{ flex: 1 }} />
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: 4 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    objectFit: 'cover', border: `2px solid ${loggedIn ? colors.primary : 'transparent'}`,
                    boxShadow: loggedIn ? shadows.warm : 'none',
                    transition: 'all 0.25s ease',
                  }}
                />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: loggedIn ? colors.primaryLight : colors.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: loggedIn ? colors.primary : colors.textMuted,
                  transition: 'all 0.25s ease',
                  border: `1px solid ${colors.borderLight}`,
                }}>
                  <UserOutlined />
                </div>
              )}
              {loggedIn && (
                <CheckCircleFilled style={{
                  position: 'absolute', bottom: 0, right: 0,
                  fontSize: 12, color: colors.success,
                  filter: 'drop-shadow(0 0 2px rgba(90,158,111,0.4))',
                }} />
              )}
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: '28px auto', maxWidth: 1200, width: '100%', padding: '0 24px', animation: 'fadeIn 0.5s ease' }}>
          <Outlet />
        </Content>

        <Modal
          title={
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
              导入菜谱
            </span>
          }
          open={importModalOpen}
          onCancel={() => setImportModalOpen(false)}
          footer={null}
          width={720}
          destroyOnClose
          styles={{ body: { padding: 20 } }}
        >
          <ImportPage onClose={() => setImportModalOpen(false)} onStartLogin={handleStartLogin} />
        </Modal>

        <Modal
          title={
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
              扫码登录抖音
            </span>
          }
          open={qrModalOpen}
          onCancel={handleCancelLogin}
          footer={[
            <Button
              key="cancel"
              onClick={handleCancelLogin}
              style={{
                borderRadius: borderRadius.button,
                fontFamily: 'var(--font-body)',
                border: `1px solid ${colors.border}`,
              }}
            >
              {qrStatus === 'success' ? '关闭' : '取消'}
            </Button>,
          ]}
          width={420}
          styles={{ body: { padding: 24 } }}
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {qrLoading && (
              <div style={{ padding: '60px 0' }}>
                <Spin size="large" style={{ color: colors.primary }} />
                <div style={{ marginTop: 16, color: colors.textSecondary, fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  正在获取二维码...
                </div>
              </div>
            )}
            {qrCode && (
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: 12,
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: shadows.md,
                }}>
                  <img
                    src={qrCode}
                    alt="抖音登录二维码"
                    style={{ width: 220, height: 220, display: 'block', borderRadius: 4 }}
                  />
                </div>
                {qrStatus === 'waiting_scan' && (
                  <div>
                    <div style={{
                      marginTop: 16, padding: '10px 20px',
                      background: colors.primaryLight,
                      borderRadius: borderRadius.button,
                      fontSize: 13,
                      color: colors.textPrimary,
                      fontFamily: 'var(--font-body)',
                      border: `1px solid ${colors.primary}22`,
                    }}>
                      请使用抖音 App 扫描二维码登录
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8, color: colors.textMuted }}>
                      二维码有效期 2 分钟，过期请重新生成
                    </Text>
                  </div>
                )}
              </div>
            )}
            {!qrLoading && !qrCode && ['error', 'timeout', 'cancelled'].includes(qrStatus) && (
              <div style={{ padding: '40px 0' }}>
                <div style={{
                  padding: '10px 20px',
                  background: qrStatus === 'error' ? '#fef2f0' : colors.primaryLight,
                  borderRadius: borderRadius.button,
                  fontSize: 13,
                  color: colors.textPrimary,
                  fontFamily: 'var(--font-body)',
                  border: qrStatus === 'error' ? '1px solid #f5c6bb' : `1px solid ${colors.primary}22`,
                }}>
                  {qrStatus === 'error' && `登录失败：${qrMessage}`}
                  {qrStatus === 'timeout' && '扫码超时，请重试'}
                  {qrStatus === 'cancelled' && '已取消'}
                </div>
              </div>
            )}
          </div>
        </Modal>

        <Modal
          title={
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
              导入 Cookies 文件
            </span>
          }
          open={cookiesModalOpen}
          onCancel={() => { setCookiesModalOpen(false); setCookiesPathInput('') }}
          footer={null}
          width={520}
          destroyOnClose
          styles={{ body: { padding: 24 } }}
        >
          <div style={{ fontFamily: 'var(--font-body)' }}>
            <Text style={{ display: 'block', marginBottom: 16, color: colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
              上传从浏览器或 dousub 导出的 Cookies 文件（.txt 格式），
              或直接输入已存在服务器上的文件路径。
            </Text>

            <div style={{
              border: `2px dashed ${cookiesDragging ? colors.primary : colors.borderLight}`,
              borderRadius: borderRadius.card,
              padding: 32,
              textAlign: 'center',
              background: cookiesDragging ? colors.primaryLight : colors.bg,
              transition: 'all 0.25s ease',
              cursor: 'pointer',
              marginBottom: 20,
            }}
              onDragEnter={() => setCookiesDragging(true)}
              onDragLeave={() => setCookiesDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setCookiesDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleUploadCookiesFile(file)
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.txt'
                input.onchange = (e: any) => {
                  const file = e.target?.files?.[0]
                  if (file) handleUploadCookiesFile(file)
                }
                input.click()
              }}
            >
              <InboxOutlined style={{ fontSize: 40, color: cookiesDragging ? colors.primary : colors.textMuted, marginBottom: 12, display: 'block' }} />
              <Text style={{ display: 'block', color: cookiesDragging ? colors.primary : colors.textSecondary, fontSize: 14, fontWeight: 500 }}>
                {cookiesUploading ? '上传中...' : cookiesDragging ? '松开以上传文件' : '点击或拖拽 Cookies 文件到此处'}
              </Text>
              <Text style={{ display: 'block', color: colors.textMuted, fontSize: 12, marginTop: 6 }}>支持 .txt 格式的 Cookies 文件</Text>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: colors.borderLight }} />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>或者直接输入路径</Text>
              <div style={{ flex: 1, height: 1, background: colors.borderLight }} />
            </div>

            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入 Cookies 文件路径..."
                value={cookiesPathInput}
                onChange={(e) => setCookiesPathInput(e.target.value)}
                onPressEnter={handleImportCookiesPath}
                style={{ fontFamily: 'var(--font-body)', borderRadius: `${borderRadius.button}px 0 0 ${borderRadius.button}px` }}
              />
              <Button
                type="primary"
                onClick={handleImportCookiesPath}
                disabled={!cookiesPathInput.trim()}
                style={{ borderRadius: `0 ${borderRadius.button}px ${borderRadius.button}px 0`, fontFamily: 'var(--font-body)' }}
              >
                设置
              </Button>
            </Space.Compact>

            {cookiesFile && (
              <div style={{
                padding: '10px 14px',
                background: colors.primaryLight,
                borderRadius: borderRadius.button,
                fontSize: 12,
                color: colors.textSecondary,
                border: `1px solid ${colors.primary}22`,
                wordBreak: 'break-all',
              }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-body)' }}>当前路径：</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>{cookiesFile}</Text>
                <Button
                  type="link"
                  danger
                  size="small"
                  style={{ float: 'right', fontSize: 12, padding: 0, marginTop: -2 }}
                  onClick={async () => {
                    try {
                      await updateSettings({ cookies_file: null })
                      message.success('已清除 Cookies')
                      setCookiesModalOpen(false)
                      loadStatus()
                    } catch {
                      message.error('清除失败')
                    }
                  }}
                >
                  清除
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </Layout>
    </ImportContext.Provider>
  )
}
