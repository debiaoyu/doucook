import { useState, useEffect } from 'react'
import {
  Card, Typography, Input, Button, Form, message,
  Space, Steps, Result, Tag, List, Alert, Radio, Progress, Divider,
  Select,
} from 'antd'
import {
  LinkOutlined, UploadOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, RightOutlined,
  SendOutlined, QrcodeOutlined, KeyOutlined,
} from '@ant-design/icons'
import { importFromUrl, importManual, batchImportStream, getSettings } from '../api'
import { colors, shadows, borderRadius } from '../theme'

const { Title, Text } = Typography
const { TextArea } = Input

type ImportResult = {
  is_cooking?: boolean
  confidence?: number
  title?: string
  message?: string
  recipe_id?: number
  duplicate?: boolean
  error?: string
}

const tabMeta = [
  { key: 'url', icon: <LinkOutlined />, title: 'URL 导入', desc: '粘贴抖音链接，自动检测并导入' },
  { key: 'batch', icon: <UploadOutlined />, title: '批量导入', desc: '从收藏/喜欢中批量扫描做饭视频' },
  { key: 'manual', icon: <FileTextOutlined />, title: '文字菜谱', desc: '手动输入菜谱，支持任意来源' },
]

export default function ImportPage({ onClose, onStartLogin }: { onClose?: () => void; onStartLogin?: () => void }) {
  const [activeTab, setActiveTab] = useState('url')
  const [cookiesFile, setCookiesFile] = useState<string | null>(null)
  const [cookiesValid, setCookiesValid] = useState<boolean | null>(null)

  useEffect(() => {
    getSettings().then((res) => {
      setCookiesFile(res.data.cookies_file)
      setCookiesValid(res.data.cookies_valid)
    }).catch(() => {})
  }, [])

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
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
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

      {activeTab === 'url' && <UrlImportTab onClose={onClose} />}
      {activeTab === 'batch' && <BatchImportTab />}
      {activeTab === 'manual' && <ManualImportTab />}

      <Divider style={{ margin: '20px 0 16px', borderColor: colors.borderLight }} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
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
          style={{
            borderRadius: borderRadius.pill,
            fontFamily: 'var(--font-body)',
            border: `1px solid ${colors.borderLight}`,
          }}
        >
          扫码登录
        </Button>
      </div>
    </div>
  )
}

function UrlImportTab({ onClose }: { onClose?: () => void }) {
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState(0)

  const steps = [
    { title: '检测视频' },
    { title: '下载视频' },
    { title: 'AI 分析' },
    { title: '生成菜谱' },
  ]

  const handleUrlImport = async () => {
    if (!url.trim()) return
    setImporting(true)
    setResult(null)
    setStep(1)
    try {
      const res = await importFromUrl({ url: url.trim() })
      setStep(4)
      setResult(res.data)
      if (res.data.duplicate) {
        message.info('检测到重复视频')
      } else if (res.data.is_cooking) {
        message.success('导入成功！')
      } else {
        message.info(res.data.message || '非做饭视频，已跳过')
      }
    } catch (e: any) {
      setStep(0)
      const detail = e.response?.data?.detail || '导入失败'
      setResult({ message: detail, error: detail })
      message.error(detail)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card style={{
      borderRadius: borderRadius.card,
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.card,
    }}>
      <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
        <Input
          size="large"
          placeholder="粘贴抖音视频链接..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleUrlImport}
          disabled={importing}
          style={{
            borderRadius: `${borderRadius.pill}px 0 0 ${borderRadius.pill}px`,
            fontFamily: 'var(--font-body)',
          }}
        />
        <Button
          type="primary"
          size="large"
          loading={importing}
          onClick={handleUrlImport}
          icon={<SendOutlined />}
          style={{
            borderRadius: `0 ${borderRadius.pill}px ${borderRadius.pill}px 0`,
            fontFamily: 'var(--font-body)',
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          导入
        </Button>
      </Space.Compact>

      {importing && (
        <div style={{ marginBottom: 20 }}>
          <Steps
            current={step}
            items={steps}
            size="small"
            style={{ maxWidth: 500 }}
          />
        </div>
      )}

      {result && (
        <Result
          status={result.is_cooking ? 'success' : result.duplicate ? 'warning' : 'error'}
          title={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>{
            result.is_cooking ? '检测为做饭视频' :
            result.duplicate ? '重复视频' :
            result.error ? '导入失败' : '非做饭视频'
          }</span>}
          subTitle={
            <div>
              {result.title && <Text strong style={{ fontFamily: 'var(--font-body)' }}>{result.title}</Text>}
              {result.confidence != null && (
                <div style={{ marginTop: 4 }}>
                  <Tag color={result.confidence > 0.5 ? colors.success : colors.warning} style={{ borderRadius: borderRadius.tag }}>
                    匹配度 {Math.round(result.confidence * 100)}%
                  </Tag>
                </div>
              )}
              {result.message && (
                <div style={{ marginTop: 4, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>{result.message}</div>
              )}
            </div>
          }
          extra={
            result.recipe_id ? (
              <Button
                type="primary"
                onClick={() => { window.location.href = `/recipes/${result.recipe_id}` }}
                style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', boxShadow: shadows.warm }}
              >
                查看菜谱 <RightOutlined />
              </Button>
            ) : null
          }
        />
      )}

      {!importing && !result && (
        <Alert
          message={<span style={{ fontFamily: 'var(--font-body)' }}>支持抖音视频链接，系统会自动检测是否为做饭视频并生成标签</span>}
          type="info"
          showIcon
          style={{ borderRadius: borderRadius.button, border: `1px solid ${colors.primary}22` }}
        />
      )}
    </Card>
  )
}

function BatchImportTab() {
  const [batchSource, setBatchSource] = useState<string>('favorites')
  const [batchImporting, setBatchImporting] = useState(false)
  const [batchResults, setBatchResults] = useState<ImportResult[]>([])
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentTitle: '' })
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [cookiesStatus, setCookiesStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown')

  useEffect(() => {
    getSettings().then((res) => {
      setCookiesStatus(res.data.cookies_file ? 'configured' : 'missing')
    }).catch(() => {})
  }, [])

  const handleBatchImport = async () => {
    setBatchImporting(true)
    setBatchResults([])
    setBatchProgress({ current: 0, total: 0, currentTitle: '' })
    try {
      await batchImportStream(
        { source: batchSource },
        (event) => {
          switch (event.type) {
            case 'scanning':
              setBatchProgress({ current: 0, total: 0, currentTitle: '正在扫描收藏列表...' })
              break
            case 'init':
              setBatchProgress({ current: 0, total: event.total, currentTitle: '准备导入...' })
              break
            case 'progress':
              setBatchProgress({ current: event.current, total: event.total, currentTitle: event.title || '' })
              break
            case 'result':
              setBatchResults((prev) => [...prev, event.result])
              break
            case 'complete': {
              const success = event.results?.filter((r: any) => r.is_cooking).length || 0
              message.success(`批量导入完成，发现 ${success} 个做饭视频`)
              break
            }
            case 'error':
              message.error(event.message || '导入出错')
              break
          }
        },
      )
    } catch (e: any) {
      message.error(e.message || '批量导入失败')
    } finally {
      setBatchImporting(false)
    }
  }

  const filtered = batchResults.filter((r) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'cooking') return r.is_cooking
    if (filterStatus === 'skipped') return !r.is_cooking && !r.error
    if (filterStatus === 'error') return r.error
    return true
  })

  const cookingCount = batchResults.filter((r) => r.is_cooking).length
  const errorCount = batchResults.filter((r) => r.error).length
  const progressPercent = batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0

  return (
    <Card style={{
      borderRadius: borderRadius.card,
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.card,
    }}>
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

        <Tag
          color={cookiesStatus === 'configured' ? colors.success : cookiesStatus === 'missing' ? colors.danger : 'default'}
          style={{ borderRadius: borderRadius.tag, padding: '0 10px', lineHeight: '22px' }}
        >
          {cookiesStatus === 'configured' ? 'Cookies 已配置' :
           cookiesStatus === 'missing' ? 'Cookies 未配置' : '状态未知'}
        </Tag>

        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={batchImporting}
          onClick={handleBatchImport}
          size="large"
          style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', boxShadow: shadows.warm }}
        >
          开始扫描并导入
        </Button>
      </div>

      {batchImporting && (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={progressPercent}
            status="active"
            format={() => batchProgress.total > 0
              ? `${batchProgress.current} / ${batchProgress.total}`
              : '扫描中...'
            }
          />
          {batchProgress.currentTitle && (
            <div style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                正在处理: {batchProgress.currentTitle}
              </Text>
            </div>
          )}
        </div>
      )}

      {batchResults.length > 0 && !batchImporting && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, flexWrap: 'wrap', gap: 8,
          }}>
            <Space>
              <Text strong style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>扫描结果</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
                共 {batchResults.length} 个，烹饪 {cookingCount} 个
                {errorCount > 0 ? `，失败 ${errorCount} 个` : ''}
              </Text>
            </Space>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              size="small"
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'cooking', label: '做饭视频' },
                { value: 'skipped', label: '已跳过' },
                { value: 'error', label: '失败' },
              ]}
            />
          </div>

          <List
            dataSource={filtered}
            style={{ background: colors.bg, borderRadius: borderRadius.card, padding: 4 }}
            renderItem={(item) => (
              <List.Item
                style={{
                  borderRadius: 8, marginBottom: 2, padding: '10px 14px',
                  background: colors.white,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.primaryLight)}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.white)}
                actions={
                  item.recipe_id
                    ? [<a key="view" href={`/recipes/${item.recipe_id}`} style={{ color: colors.primary, fontFamily: 'var(--font-body)' }}>查看</a>]
                    : undefined
                }
              >
                <List.Item.Meta
                  avatar={
                    item.is_cooking ? (
                      <CheckCircleOutlined style={{ color: colors.success, fontSize: 18, marginTop: 4 }} />
                    ) : item.error ? (
                      <CloseCircleOutlined style={{ color: colors.danger, fontSize: 18, marginTop: 4 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: colors.textMuted, fontSize: 18, marginTop: 4 }} />
                    )
                  }
                  title={
                    <Space>
                      <Text style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: colors.textPrimary }}>{item.title || '未知'}</Text>
                      {item.confidence != null && (
                        <Tag color={item.confidence > 0.5 ? colors.success : colors.warning} style={{ fontSize: 10, lineHeight: '18px', borderRadius: borderRadius.tag }}>
                          {Math.round(item.confidence * 100)}%
                        </Tag>
                      )}
                      {item.duplicate && (
                        <Tag color={colors.warning} style={{ fontSize: 10, lineHeight: '18px', borderRadius: borderRadius.tag }}>重复</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-body)' }}>
                      {item.message || item.error || ''}
                    </Text>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: <span style={{ color: colors.textMuted }}>无匹配结果</span> }}
          />
        </div>
      )}
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
    <Card style={{
      borderRadius: borderRadius.card,
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.card,
    }}>
      <Alert
        message={<span style={{ fontFamily: 'var(--font-body)' }}>输入标题和完整菜谱内容，系统会自动生成标签</span>}
        type="info"
        showIcon
        style={{ borderRadius: borderRadius.button, marginBottom: 16, border: `1px solid ${colors.primary}22` }}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 640 }}
      >
        <Form.Item
          name="title"
          label={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>菜谱名称</span>}
          rules={[{ required: true, message: '请输入菜谱名称' }]}
        >
          <Input
            placeholder="如：宫保鸡丁"
            size="large"
            style={{ fontFamily: 'var(--font-body)', borderRadius: borderRadius.input }}
          />
        </Form.Item>

        <Form.Item
          name="url"
          label={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>来源链接（可选）</span>}
        >
          <Input
            placeholder="原始文章或视频链接"
            size="large"
            style={{ fontFamily: 'var(--font-body)', borderRadius: borderRadius.input }}
          />
        </Form.Item>

        <Form.Item
          name="recipe_text"
          label={<span style={{ fontFamily: 'var(--font-body)', color: colors.textPrimary }}>完整菜谱</span>}
          rules={[{ required: true, message: '请输入完整菜谱内容' }]}
        >
          <TextArea
            rows={12}
            placeholder={"输入完整的菜谱内容，包括食材、步骤等。例如：\n\n【食材】\n鸡胸肉 300g\n花生米 50g\n干辣椒 10个\n\n【步骤】\n1. 鸡胸肉切丁，加料酒、盐、淀粉腌制15分钟\n2. 调酱汁：生抽、醋、糖、淀粉水混合\n3. 热锅凉油，炒熟花生米捞出备用"}
            style={{ fontFamily: 'var(--font-body)', borderRadius: borderRadius.input }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={importing}
            size="large"
            icon={<FileTextOutlined />}
            style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', boxShadow: shadows.warm }}
          >
            创建菜谱
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
