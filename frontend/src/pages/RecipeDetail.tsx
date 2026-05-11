import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Typography, Tag, Spin, Button, Input, Space,
  message, Divider, Popconfirm, Tabs, Empty, Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  QuestionCircleOutlined, SendOutlined, LinkOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined, MobileOutlined,
} from '@ant-design/icons'
import { getRecipe, updateRecipe, deleteRecipe as apiDeleteRecipe, askQuestion, RecipeDetail as RecipeDetailType } from '../api'
import { colors } from '../theme'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function formatRecipeText(text: string) {
  const lines = text.split('\n').filter(Boolean)
  const sections: { type: 'ingredients' | 'steps' | 'other'; content: string[] }[] = []
  let currentSection: { type: 'ingredients' | 'steps' | 'other'; content: string[] } | null = null

  const ingredientHeaders = ['食材', '材料', '原料', '配料', '用料', '准备材料']
  const stepHeaders = ['步骤', '做法', '制作', '烹饪步骤', '操作', '制作方法']

  for (const line of lines) {
    const trimmed = line.trim()
    const headerMatch = trimmed.replace(/[【［\[\(（].*?[】］\]\)）]/, '').trim()
    const isIngredient = ingredientHeaders.some((h) => headerMatch.startsWith(h) || headerMatch === h)
    const isStep = stepHeaders.some((h) => headerMatch.startsWith(h) || headerMatch === h)

    if (isIngredient || isStep) {
      if (currentSection) sections.push(currentSection)
      currentSection = {
        type: isIngredient ? 'ingredients' : 'steps',
        content: [],
      }
    } else if (/^\d+[\.\、\s]/.test(trimmed) && !currentSection) {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'steps', content: [trimmed] }
    } else if (/^[-•·*]\s/.test(trimmed) && !currentSection) {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'ingredients', content: [trimmed] }
    } else if (currentSection) {
      currentSection.content.push(trimmed)
    } else {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'other', content: [trimmed] }
    }
  }
  if (currentSection) sections.push(currentSection)

  if (sections.length === 0) {
    return <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.8 }}>{text}</Paragraph>
  }

  return (
    <div>
      {sections.map((section, idx) => {
        if (section.type === 'ingredients') {
          return (
            <div key={idx} style={{ marginBottom: 20 }}>
              {idx === 0 && (
                <div style={{
                  fontSize: 15, fontWeight: 600, color: colors.textPrimary,
                  marginBottom: 10, paddingLeft: 12,
                  borderLeft: `3px solid ${colors.primary}`,
                }}>
                  食材
                </div>
              )}
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2.2 }}>
                {section.content.map((item, i) => (
                  <li key={i} style={{ color: colors.textSecondary }}>{item}</li>
                ))}
              </ul>
            </div>
          )
        }
        if (section.type === 'steps') {
          return (
            <div key={idx} style={{ marginBottom: 20 }}>
              {idx === (sections.findIndex(s => s.type === 'steps')) && (
                <div style={{
                  fontSize: 15, fontWeight: 600, color: colors.textPrimary,
                  marginBottom: 10, paddingLeft: 12,
                  borderLeft: `3px solid ${colors.primary}`,
                }}>
                  步骤
                </div>
              )}
              <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2.2 }}>
                {section.content.map((item, i) => (
                  <li key={i} style={{ color: colors.textSecondary }}>{item}</li>
                ))}
              </ol>
            </div>
          )
        }
        return (
          <Paragraph key={idx} style={{ whiteSpace: 'pre-wrap', marginBottom: 12, lineHeight: 1.8, color: colors.textSecondary }}>
            {section.content.join('\n')}
          </Paragraph>
        )
      })}
    </div>
  )
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [qaList, setQaList] = useState<{ question: string; answer: string | null }[]>([])

  const [editingRecipeText, setEditingRecipeText] = useState(false)
  const [recipeTextDraft, setRecipeTextDraft] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getRecipe(Number(id)).then((res) => {
      setRecipe(res.data)
      setNotes(res.data.notes || '')
      setQaList(res.data.qa_pairs || [])
      setRecipeTextDraft(res.data.recipe_text || '')
    }).finally(() => setLoading(false))
  }, [id])

  const handleSaveNotes = async () => {
    if (!id) return
    setSavingNotes(true)
    try {
      await updateRecipe(Number(id), { notes })
      message.success('笔记已保存')
      setEditingNotes(false)
    } catch {
      message.error('保存失败')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleSaveRecipeText = async () => {
    if (!id) return
    try {
      await updateRecipe(Number(id), { recipe_text: recipeTextDraft })
      message.success('菜谱已更新')
      setEditingRecipeText(false)
      setRecipe((prev) => prev ? { ...prev, recipe_text: recipeTextDraft } : prev)
    } catch {
      message.error('保存失败')
    }
  }

  const handleAsk = async () => {
    if (!id || !question.trim()) return
    setAsking(true)
    try {
      const res = await askQuestion(Number(id), { question: question.trim() })
      if (res.data.error) {
        message.warning(res.data.error)
      }
      setQaList((prev) => [{ question: question.trim(), answer: res.data.answer || null }, ...prev])
      setQuestion('')
    } catch {
      message.error('提问失败')
    } finally {
      setAsking(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await apiDeleteRecipe(Number(id))
      message.success('已删除')
      navigate('/recipes')
    } catch {
      message.error('删除失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (!recipe) return <Empty description="菜谱不存在" />

  const videoUrl = recipe.video_path
    ? `http://localhost:8000/api/video/${encodeURIComponent(recipe.video_path)}`
    : null

  const confidencePercent = recipe.confidence != null ? Math.round(recipe.confidence * 100) : null

  const tabItems = [
    {
      key: 'recipe',
      label: '📝 菜谱',
      children: (
        <div>
          {editingRecipeText ? (
            <div>
              <TextArea
                rows={12}
                value={recipeTextDraft}
                onChange={(e) => setRecipeTextDraft(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRecipeText}>
                  保存
                </Button>
                <Button icon={<CloseOutlined />} onClick={() => {
                  setEditingRecipeText(false)
                  setRecipeTextDraft(recipe.recipe_text || '')
                }}>
                  取消
                </Button>
              </Space>
            </div>
          ) : recipe.recipe_text ? (
            <div>
              {formatRecipeText(recipe.recipe_text)}
              <Divider />
              <Button type="text" icon={<EditOutlined />} onClick={() => setEditingRecipeText(true)}>
                编辑菜谱
              </Button>
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂未生成菜谱文字"
            >
              <Button icon={<EditOutlined />} onClick={() => setEditingRecipeText(true)}>
                添加菜谱文字
              </Button>
            </Empty>
          )}
        </div>
      ),
    },
    {
      key: 'ai',
      label: '🤖 AI 总结',
      children: recipe.ai_summary ? (
        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.8, color: colors.textSecondary }}>
          {recipe.ai_summary}
        </Paragraph>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 AI 总结" />
      ),
    },
    {
      key: 'qa',
      label: '💬 问答',
      children: recipe.douyin_url ? (
        <div>
          <div style={{
            maxHeight: 400, overflowY: 'auto', marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {qaList.length === 0 ? (
              <Text type="secondary" style={{ textAlign: 'center', padding: 20 }}>
                暂无提问记录
              </Text>
            ) : (
              qaList.map((item, idx) => (
                <div key={idx}>
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', marginBottom: 8,
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      background: colors.primaryLight,
                      border: `1px solid ${colors.primary}22`,
                      borderRadius: '12px 12px 4px 12px',
                      padding: '10px 14px',
                    }}>
                      <Text style={{ color: colors.textPrimary }}>
                        <QuestionCircleOutlined style={{ marginRight: 6, color: colors.primary }} />
                        {item.question}
                      </Text>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      background: '#f5f5f5',
                      borderRadius: '12px 12px 12px 4px',
                      padding: '10px 14px',
                    }}>
                      <Text style={{ color: colors.textSecondary }}>
                        {item.answer || '暂无回答'}
                      </Text>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入关于视频的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onPressEnter={handleAsk}
              disabled={asking}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAsk}
              loading={asking}
            >
              发送
            </Button>
          </Space.Compact>
        </div>
      ) : (
        <Text type="secondary">非抖音导入的菜谱不支持视频提问</Text>
      ),
    },
    {
      key: 'notes',
      label: '📒 笔记',
      children: editingNotes ? (
        <div>
          <TextArea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="写下你的笔记..."
            style={{ marginBottom: 12 }}
          />
          <Space>
            <Button type="primary" icon={<SaveOutlined />} loading={savingNotes} onClick={handleSaveNotes}>
              保存
            </Button>
            <Button icon={<CloseOutlined />} onClick={() => { setEditingNotes(false); setNotes(recipe.notes || '') }}>
              取消
            </Button>
          </Space>
        </div>
      ) : (
        <div>
          {notes ? (
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.8, color: colors.textSecondary }}>
              {notes}
            </Paragraph>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无笔记" />
          )}
          <div style={{ marginTop: 12 }}>
            <Button type="text" icon={<EditOutlined />} onClick={() => setEditingNotes(true)}>
              {notes ? '编辑笔记' : '添加笔记'}
            </Button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/recipes')}
            style={{ borderRadius: 8 }}
          >
            返回
          </Button>
          <Title level={4} style={{ margin: 0, color: colors.textPrimary }}>
            {recipe.title}
          </Title>
        </Space>
        <Space>
          {recipe.categories?.map((c) => (
            <Tag key={c.id} color={c.color || undefined} style={{ borderRadius: 4, padding: '2px 8px' }}>
              {c.name}
            </Tag>
          ))}
          <Popconfirm
            title="确定删除此菜谱？"
            description="删除后无法恢复"
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15}>
          <Card
            styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: 12 } }}
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            {videoUrl ? (
              <video
                controls
                style={{ width: '100%', display: 'block', background: '#000' }}
                src={videoUrl}
                poster={recipe.thumbnail ? undefined : undefined}
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div style={{
                textAlign: 'center', padding: '60px 20px', color: '#999',
                background: colors.bg,
              }}>
                <VideoCameraOutlinedFallback />
                <br />
                <Text type="secondary">无视频文件</Text>
              </div>
            )}
          </Card>

          <Card style={{ borderRadius: 12 }}>
            <Tabs items={tabItems} />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>菜谱信息</Text>}
            style={{ borderRadius: 12, marginBottom: 16 }}
            styles={{ body: { padding: 16 } }}
          >
            <InfoRow icon={<CalendarOutlined />} label="创建日期" value={
              recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('zh-CN') : '-'
            } />
            <InfoRow icon={<MobileOutlined />} label="来源" value={
              recipe.source === 'douyin' ? '抖音导入' :
              recipe.source === 'manual' ? '手动创建' : recipe.source
            } />
            {confidencePercent != null && (
              <InfoRow icon={<CheckCircleOutlined />} label="烹饪置信度">
                <Tag color={confidencePercent > 50 ? 'green' : 'orange'} style={{ borderRadius: 4 }}>
                  {confidencePercent}%
                </Tag>
              </InfoRow>
            )}
            {recipe.video_duration != null && (
              <InfoRow icon={<ClockCircleOutlined />} label="视频时长">
                {formatDuration(recipe.video_duration)}
              </InfoRow>
            )}
            {recipe.douyin_url && (
              <InfoRow icon={<LinkOutlined />} label="抖音链接">
                <a href={recipe.douyin_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: colors.primary, wordBreak: 'break-all' }}>
                  查看原视频
                </a>
              </InfoRow>
            )}
          </Card>

          {recipe.categories && recipe.categories.length > 0 && (
            <Card
              title={<Text strong style={{ fontSize: 15 }}>分类</Text>}
              style={{ borderRadius: 12, marginBottom: 16 }}
              styles={{ body: { padding: 16 } }}
            >
              <Space wrap>
                {recipe.categories.map((c) => (
                  <Tag key={c.id} color={c.color || undefined} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 13 }}>
                    {c.name}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

function InfoRow({ icon, label, children, value }: {
  icon: React.ReactNode
  label: string
  children?: React.ReactNode
  value?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 0',
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <span style={{ color: colors.textSecondary, fontSize: 14, width: 20 }}>{icon}</span>
      <Text type="secondary" style={{ fontSize: 13, minWidth: 70 }}>{label}</Text>
      {children || <Text style={{ fontSize: 13 }}>{value}</Text>}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function VideoCameraOutlinedFallback() {
  return (
    <svg viewBox="64 64 896 896" width="48" height="48" fill="#999">
      <path d="M912 302.3L784 376V224c0-35.3-28.7-64-64-64H128c-35.3 0-64 28.7-64 64v576c0 35.3 28.7 64 64 64h592c35.3 0 64-28.7 64-64V648l128 73.7c21.3 12.3 48-3.1 48-27.6V330c0-24.6-26.7-40-48-27.7zM712 800H136V224h576v576zm176-64l-144-84v-72l144-84v240z" />
    </svg>
  )
}
