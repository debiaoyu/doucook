import { useState, useEffect, useContext } from 'react'
import {
  Card, Typography, Input, Button, Form, message,
  Space, Result, Tag, Alert, Radio,
} from 'antd'
import {
  LinkOutlined, UploadOutlined, FileTextOutlined,
  SendOutlined, QrcodeOutlined, KeyOutlined,
} from '@ant-design/icons'
import { importManual } from '../api'
import { ImportContext } from '../components/AppLayout'
import { colors, shadows, borderRadius } from '../theme'

const { Text } = Typography
const { TextArea } = Input

const tabMeta = [
  { key: 'url', icon: <LinkOutlined />, title: 'URL 导入', desc: '粘贴抖音链接，自动检测并导入' },
  { key: 'batch', icon: <UploadOutlined />, title: '批量导入', desc: '从收藏/喜欢中批量扫描做饭视频' },
  { key: 'manual', icon: <FileTextOutlined />, title: '文字菜谱', desc: '手动输入菜谱，支持任意来源' },
]

export default function ImportPage({
  onClose, onStartLogin, cookiesFile, cookiesValid, loggedIn,
}: {
  onClose?: () => void
  onStartLogin?: () => void
  cookiesFile?: string | null
  cookiesValid?: boolean | null
  loggedIn?: boolean
}) {
  const [activeTab, setActiveTab] = useState('url')
  const { startBatchImport, startUrlImport } = useContext(ImportContext)

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {tabMeta.map((tab, idx) => (
          <Card
            key={tab.key}
            hoverable
            size="small"
            onClick={() => handleTabChange(tab.key)}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: borderRadius.card, minWidth: 0, overflow: 'hidden',
              border: activeTab === tab.key ? `1.5px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
              background: activeTab === tab.key ? colors.primaryLight : colors.white,
              transition: 'all 0.25s ease',
              boxShadow: activeTab === tab.key ? shadows.warm : 'none',
              animation: 'fadeInUp 0.4s ease both',
              animationDelay: `${idx * 0.06}s`,
            }}
            styles={{ body: { padding: '16px 18px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: activeTab === tab.key
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                  : colors.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                color: activeTab === tab.key ? colors.white : colors.textMuted,
                transition: 'all 0.25s ease',
                flexShrink: 0,
              }}>
                {tab.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <Text strong style={{
                  fontSize: 14, display: 'block',
                  color: activeTab === tab.key ? colors.primary : colors.textPrimary,
                  fontFamily: 'var(--font-body)',
                }}>
                  {tab.title}
                </Text>
                <Text style={{ fontSize: 11, display: 'block', marginTop: 2, color: colors.textMuted }}>
                  {tab.desc}
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {activeTab === 'url' && <UrlImportTab onStartUrlImport={startUrlImport} />}
      {activeTab === 'batch' && <BatchImportTab onStartBatchImport={startBatchImport} />}
      {activeTab === 'manual' && <ManualImportTab />}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', marginTop: 20,
        background: `linear-gradient(135deg, ${colors.bg}, ${colors.white})`,
        borderRadius: borderRadius.button,
        border: `1px solid ${colors.borderLight}`,
        flexWrap: 'wrap', gap: 8,
      }}>
        <Space>
          <KeyOutlined style={{ color: colors.textMuted }} />
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>抖音登录状态：</Text>
          <Tag
            color={cookiesFile ? (cookiesValid ? colors.success : colors.warning) : colors.danger}
            style={{ borderRadius: borderRadius.tag, margin: 0, padding: '0 10px', lineHeight: '22px' }}
          >
            {cookiesFile
              ? (cookiesValid ? '已登录' : '已过期')
              : '未登录'}
          </Tag>
          {cookiesFile && (
            <Text style={{ fontSize: 11, color: colors.textMuted, maxWidth: 300, fontFamily: 'var(--font-body)' }} ellipsis>
              {cookiesFile}
            </Text>
          )}
        </Space>
        <Button
          size="small"
          icon={<QrcodeOutlined />}
          onClick={onStartLogin}
          style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', border: `1px solid ${colors.borderLight}` }}
        >
          扫码登录
        </Button>
      </div>
    </div>
  )
}

function UrlImportTab({ onStartUrlImport }: { onStartUrlImport: (url: string) => void }) {
  const [url, setUrl] = useState('')

  const handleUrlImport = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    try {
      new URL(trimmed)
    } catch {
      message.error('请输入有效的 URL 链接')
      return
    }
    onStartUrlImport(trimmed)
    setUrl('')
  }

  return (
    <Card style={{ borderRadius: borderRadius.card, border: `1px solid ${colors.borderLight}`, boxShadow: shadows.card }}>
      <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
        <Input
          size="large"
          placeholder="粘贴抖音视频链接..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleUrlImport}
          style={{ borderRadius: `${borderRadius.pill}px 0 0 ${borderRadius.pill}px`, fontFamily: 'var(--font-body)' }}
        />
        <Button
          type="primary"
          size="large"
          onClick={handleUrlImport}
          icon={<SendOutlined />}
          style={{ borderRadius: `0 ${borderRadius.pill}px ${borderRadius.pill}px 0`, fontFamily: 'var(--font-body)', paddingLeft: 24, paddingRight: 24 }}
        >
          导入
        </Button>
      </Space.Compact>

      <Alert
        message={<span style={{ fontFamily: 'var(--font-body)' }}>支持抖音视频链接，系统会自动检测是否为做饭视频并生成标签</span>}
        type="info"
        showIcon
        style={{ borderRadius: borderRadius.button, border: `1px solid ${colors.primary}22` }}
      />
    </Card>
  )
}

function BatchImportTab({ onStartBatchImport }: { onStartBatchImport: (source: string) => void }) {
  const [batchSource, setBatchSource] = useState<string>('favorites')

  return (
    <Card style={{ borderRadius: borderRadius.card, border: `1px solid ${colors.borderLight}`, boxShadow: shadows.card }}>
      <Alert
        message={<span style={{ fontFamily: 'var(--font-body)' }}>批量导入需要先通过扫码登录或 dousub login 命令登录抖音账号</span>}
        type="info"
        showIcon
        style={{ borderRadius: borderRadius.button, marginBottom: 16, border: `1px solid ${colors.primary}22` }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Radio.Group
          value={batchSource}
          onChange={(e) => setBatchSource(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio value="favorites">我的收藏</Radio>
          <Radio value="likes">我的喜欢</Radio>
        </Radio.Group>

        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => onStartBatchImport(batchSource)}
          size="large"
          style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', boxShadow: shadows.warm }}
        >
          开始扫描并导入
        </Button>
      </div>
    </Card>
  )
}

function ManualImportTab() {
  const [form] = Form.useForm()
  const [importing, setImporting] = useState(false)

  const handleSubmit = async (values: any) => {
    setImporting(true)
    try {
      await importManual({
        title: values.title,
        url: values.url || undefined,
        recipe_text: values.recipe_text || undefined,
      })
      message.success('菜谱导入成功！系统已自动生成标签')
      form.resetFields()
    } catch (e: any) {
      message.error(e.response?.data?.detail || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card style={{ borderRadius: borderRadius.card, border: `1px solid ${colors.borderLight}`, boxShadow: shadows.card }}>
      <Alert
        message={<span style={{ fontFamily: 'var(--font-body)' }}>输入标题和完整菜谱内容，系统会自动生成标签</span>}
        type="info"
        showIcon
        style={{ borderRadius: borderRadius.button, marginBottom: 16, border: `1px solid ${colors.primary}22` }}
      />
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 640 }}>
        <Form.Item name="title" label={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>菜谱名称</span>}
          rules={[{ required: true, message: '请输入菜谱名称' }]}
        >
          <Input placeholder="如：宫保鸡丁" size="large" style={{ fontFamily: 'var(--font-body)', borderRadius: borderRadius.input }} />
        </Form.Item>
        <Form.Item name="url" label={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>来源链接（可选）</span>}>
          <Input placeholder="原始文章或视频链接" size="large" style={{ fontFamily: 'var(--font-body)', borderRadius: borderRadius.input }} />
        </Form.Item>
        <Form.Item name="recipe_text" label={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>完整菜谱</span>}
          rules={[{ required: true, message: '请输入完整菜谱内容' }]}
        >
          <TextArea rows={12} placeholder="输入完整的菜谱内容，包括食材、步骤等。例如：&#10;&#10;【食材】&#10;鸡胸肉 300g&#10;花生米 50g&#10;干辣椒 10个&#10;&#10;【步骤】&#10;1. 鸡胸肉切丁，加料酒、盐、淀粉腌制15分钟&#10;2. 调酱汁：生抽、醋、糖、淀粉水混合&#10;3. 热锅凉油，炒熟花生米捞出备用"
            style={{ fontFamily: 'var(--font-body)', borderRadius: borderRadius.input }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={importing} size="large" icon={<FileTextOutlined />}
            style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', boxShadow: shadows.warm }}
          >
            创建菜谱
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
