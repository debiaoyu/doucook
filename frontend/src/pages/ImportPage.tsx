import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Card, Typography, Input, Button, Tabs, Form, message,
  Space, Steps, Result, Tag, List, Select, Alert, Radio, Progress,
} from 'antd'
import {
  LinkOutlined, UploadOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, RightOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { importFromUrl, importManual, batchImport, getSettings } from '../api'
import { colors } from '../theme'

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

export default function ImportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') || 'url'
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams(key === 'url' ? {} : { tab: key })
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: colors.textPrimary }}>导入菜谱</Title>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {tabMeta.map((tab) => (
          <Card
            key={tab.key}
            hoverable
            size="small"
            onClick={() => handleTabChange(tab.key)}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: 12, minWidth: 0,
              border: activeTab === tab.key ? `2px solid ${colors.primary}` : '2px solid transparent',
              background: activeTab === tab.key ? colors.primaryLight : colors.white,
              transition: 'all 0.2s',
            }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 18,
                color: activeTab === tab.key ? colors.primary : colors.textSecondary,
              }}>
                {tab.icon}
              </span>
              <div style={{ textAlign: 'left' }}>
                <Text strong style={{
                  fontSize: 14, display: 'block',
                  color: activeTab === tab.key ? colors.primary : colors.textPrimary,
                }}>
                  {tab.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                  {tab.desc}
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {activeTab === 'url' && <UrlImportTab />}
      {activeTab === 'batch' && <BatchImportTab />}
      {activeTab === 'manual' && <ManualImportTab />}
    </div>
  )
}

function UrlImportTab() {
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
        message.info('非做饭视频，已跳过')
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
    <Card style={{ borderRadius: 12 }}>
      <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
        <Input
          size="large"
          placeholder="粘贴抖音视频链接..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleUrlImport}
          disabled={importing}
          style={{ borderRadius: '8px 0 0 8px' }}
        />
        <Button
          type="primary"
          size="large"
          loading={importing}
          onClick={handleUrlImport}
          icon={<SendOutlined />}
          style={{ borderRadius: '0 8px 8px 0' }}
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
          title={
            result.is_cooking ? '✅ 检测为做饭视频' :
            result.duplicate ? '⚠️ 重复视频' :
            result.error ? '❌ 导入失败' : 'ℹ️ 非做饭视频'
          }
          subTitle={
            <div>
              {result.title && <Text strong>{result.title}</Text>}
              {result.confidence != null && (
                <div style={{ marginTop: 4 }}>
                  <Tag color={result.confidence > 0.5 ? 'green' : 'orange'} style={{ borderRadius: 4 }}>
                    匹配度 {Math.round(result.confidence * 100)}%
                  </Tag>
                </div>
              )}
              {result.message && (
                <div style={{ marginTop: 4, color: colors.textSecondary }}>{result.message}</div>
              )}
            </div>
          }
          extra={
            result.recipe_id ? (
              <Button type="primary" onClick={() => window.location.href = `/recipes/${result.recipe_id}`}>
                查看菜谱 <RightOutlined />
              </Button>
            ) : null
          }
        />
      )}

      {!importing && !result && (
        <Alert
          message="支持抖音视频链接，系统会自动检测是否为做饭视频"
          type="info"
          showIcon
          style={{ borderRadius: 8 }}
        />
      )}
    </Card>
  )
}

function BatchImportTab() {
  const [batchSource, setBatchSource] = useState<string>('favorites')
  const [batchImporting, setBatchImporting] = useState(false)
  const [batchResults, setBatchResults] = useState<ImportResult[]>([])
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
    try {
      const res = await batchImport({ source: batchSource })
      setBatchResults(res.data.results || [])
      const success = res.data.results?.filter((r: any) => r.is_cooking).length || 0
      message.success(`批量导入完成，发现 ${success} 个做饭视频`)
    } catch (e: any) {
      message.error(e.response?.data?.detail || '批量导入失败')
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

  return (
    <Card style={{ borderRadius: 12 }}>
      <Alert
        message="批量导入需要先通过 dousub login 命令登录抖音账号"
        type="info"
        showIcon
        style={{ borderRadius: 8, marginBottom: 16 }}
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
          color={cookiesStatus === 'configured' ? 'green' : cookiesStatus === 'missing' ? 'red' : 'default'}
          style={{ borderRadius: 4 }}
        >
          {cookiesStatus === 'configured' ? '🟢 Cookies 已配置' :
           cookiesStatus === 'missing' ? '🔴 Cookies 未配置' : '⚪ 状态未知'}
        </Tag>

        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={batchImporting}
          onClick={handleBatchImport}
          size="large"
        >
          开始扫描并导入
        </Button>
      </div>

      {batchImporting && (
        <Progress
          percent={50}
          status="active"
          style={{ marginBottom: 16 }}
          format={() => '扫描中...'}
        />
      )}

      {batchResults.length > 0 && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, flexWrap: 'wrap', gap: 8,
          }}>
            <Space>
              <Text strong>扫描结果</Text>
              <Text type="secondary">
                共 {batchResults.length} 个，烹饪 {cookingCount} 个{cookingCount > 0 ? ` ✅` : ''}
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
            style={{ background: colors.bg, borderRadius: 8, padding: 4 }}
            renderItem={(item) => (
              <List.Item
                style={{
                  borderRadius: 6, marginBottom: 2, padding: '8px 12px',
                  background: colors.white,
                }}
                actions={
                  item.recipe_id
                    ? [<a key="view" href={`/recipes/${item.recipe_id}`}>查看</a>]
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
                      <CloseCircleOutlined style={{ color: '#ccc', fontSize: 18, marginTop: 4 }} />
                    )
                  }
                  title={
                    <Space>
                      <Text style={{ fontSize: 13 }}>{item.title || '未知'}</Text>
                      {item.confidence != null && (
                        <Tag color={item.confidence > 0.5 ? 'green' : 'orange'} style={{ fontSize: 10, lineHeight: '16px', borderRadius: 4 }}>
                          {Math.round(item.confidence * 100)}%
                        </Tag>
                      )}
                      {item.duplicate && (
                        <Tag color="warning" style={{ fontSize: 10, lineHeight: '16px', borderRadius: 4 }}>重复</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.message || item.error || ''}
                    </Text>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '无匹配结果' }}
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
      const ingredients = (values.ingredients || '').trim()
      const steps = (values.steps || '').trim()
      const extraText = (values.recipe_text || '').trim()

      let combined = ''
      if (ingredients) combined += `【食材】\n${ingredients}\n\n`
      if (steps) combined += `【步骤】\n${steps}`
      if (extraText && combined) combined += `\n\n${extraText}`
      else if (extraText) combined = extraText

      await importManual({
        title: values.title,
        url: values.url || undefined,
        recipe_text: combined || undefined,
        notes: values.notes || undefined,
        categories: values.categories || undefined,
      })
      message.success('菜谱导入成功！')
      form.resetFields()
    } catch (e: any) {
      message.error(e.response?.data?.detail || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card style={{ borderRadius: 12 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 640 }}
      >
        <Form.Item
          name="title"
          label="菜谱名称"
          rules={[{ required: true, message: '请输入菜谱名称' }]}
        >
          <Input placeholder="如：宫保鸡丁" size="large" />
        </Form.Item>

        <Form.Item name="url" label="来源链接（可选）">
          <Input placeholder="原始文章或视频链接，支持任意网站" size="large" />
        </Form.Item>

        <Form.Item name="categories" label="分类">
          <Select
            mode="tags"
            placeholder="输入分类标签后回车（如：川菜、家常菜）"
            style={{ width: '100%' }}
            size="large"
          />
        </Form.Item>

        <Form.Item name="ingredients" label="食材清单">
          <TextArea
            rows={4}
            placeholder={"每行一个食材，如：\n鸡胸肉 300g\n花生米 50g\n干辣椒 10个"}
          />
        </Form.Item>

        <Form.Item name="steps" label="烹饪步骤">
          <TextArea
            rows={5}
            placeholder={"每行一个步骤，如：\n1. 鸡胸肉切丁，加料酒、盐、淀粉腌制15分钟\n2. 调酱汁：生抽、醋、糖、淀粉水混合\n3. 热锅凉油，炒熟花生米捞出备用"}
          />
        </Form.Item>

        <Form.Item name="recipe_text" label="完整菜谱（补充说明）">
          <TextArea rows={3} placeholder="食材和步骤之外的其他说明，如技巧、注意事项等（可选）" />
        </Form.Item>

        <Form.Item name="notes" label="个人笔记">
          <TextArea rows={2} placeholder="个人笔记（可选）" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={importing}
            size="large"
            icon={<FileTextOutlined />}
          >
            创建菜谱
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
