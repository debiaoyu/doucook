import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Typography, Tag, Spin, Button, Input, Space,
  message, Divider, Popconfirm, Tabs, Empty,
} from 'antd'
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  QuestionCircleOutlined, SendOutlined, LinkOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined, MobileOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { getRecipe, updateRecipe, deleteRecipe as apiDeleteRecipe, askQuestion, RecipeDetail as RecipeDetailType } from '../api'
import { colors, shadows, borderRadius } from '../theme'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const TAG_COLORS = ['#d4732a', '#bf6f4a', '#5a9e6f', '#6b8fbf', '#8d6e4e', '#d4a047', '#7a9e6f', '#c0543a']

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
    return <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.8, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>{text}</Paragraph>
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
                  marginBottom: 12, paddingLeft: 14,
                  borderLeft: `3px solid ${colors.primary}`,
                  fontFamily: 'var(--font-body)',
                }}>
                  🥘 食材
                </div>
              )}
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2.4 }}>
                {section.content.map((item, i) => (
                  <li key={i} style={{ color: colors.textSecondary }}>
                    <span style={{ color: colors.wood, marginRight: 8, fontSize: 11 }}>●</span>
                    {item}
                  </li>
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
                  marginBottom: 12, paddingLeft: 14,
                  borderLeft: `3px solid ${colors.primary}`,
                  fontFamily: 'var(--font-body)',
                }}>
                  👩‍🍳 步骤
                </div>
              )}
              <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2.4 }}>
                {section.content.map((item, i) => (
                  <li key={i} style={{ color: colors.textSecondary, paddingLeft: 4 }}>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )
        }
        return (
          <Paragraph key={idx} style={{ whiteSpace: 'pre-wrap', marginBottom: 12, lineHeight: 1.8, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
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

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getRecipe(Number(id)).then((res) => {
      setRecipe(res.data)
      setNotes(res.data.notes || '')
      setQaList(res.data.qa_pairs || [])
      setRecipeTextDraft(res.data.recipe_text || '')
      setTags(parseTags(res.data.tags))
    }).finally(() => setLoading(false))
  }, [id])

  function parseTags(tagsStr: string | null): string[] {
    if (!tagsStr) return []
    return tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
  }

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
      navigate('/')
    } catch {
      message.error('删除失败')
    }
  }

  const handleAddTag = async () => {
    const t = tagInput.trim()
    if (!t || !id) return
    if (tags.includes(t)) {
      setTagInput('')
      return
    }
    const newTags = [...tags, t]
    setTags(newTags)
    setTagInput('')
    try {
      await updateRecipe(Number(id), { tags: newTags.join(',') })
    } catch {
      setTags(tags)
      message.error('保存标签失败')
    }
  }

  const handleRemoveTag = async (tag: string) => {
    if (!id) return
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    try {
      await updateRecipe(Number(id), { tags: newTags.join(',') })
    } catch {
      setTags(tags)
      message.error('保存标签失败')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <Spin size="large" style={{ color: colors.primary }} />
    </div>
  )
  if (!recipe) return <Empty description={<span style={{ color: colors.textSecondary }}>菜谱不存在</span>} style={{ marginTop: 80 }} />

  const videoUrl = recipe.video_path
    ? `/api/video/${encodeURIComponent(recipe.video_path)}`
    : null

  const confidencePercent = recipe.confidence != null ? Math.round(recipe.confidence * 100) : null

  const tabItems = [
    {
      key: 'recipe',
      label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>📝 菜谱</span>,
      children: (
        <div>
          {editingRecipeText ? (
            <div>
              <TextArea
                rows={12}
                value={recipeTextDraft}
                onChange={(e) => setRecipeTextDraft(e.target.value)}
                style={{ marginBottom: 12, fontFamily: 'var(--font-body)', border: `1px solid ${colors.border}`, borderRadius: borderRadius.input }}
              />
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRecipeText} style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                  保存
                </Button>
                <Button icon={<CloseOutlined />} onClick={() => {
                  setEditingRecipeText(false)
                  setRecipeTextDraft(recipe.recipe_text || '')
                }} style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                  取消
                </Button>
              </Space>
            </div>
          ) : recipe.recipe_text ? (
            <div>
              {formatRecipeText(recipe.recipe_text)}
              <Divider style={{ borderColor: colors.borderLight }} />
              <Button type="text" icon={<EditOutlined style={{ color: colors.primary }} />} onClick={() => setEditingRecipeText(true)} style={{ fontFamily: 'var(--font-body)', color: colors.primary }}>
                编辑菜谱
              </Button>
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: colors.textSecondary }}>暂未生成菜谱文字</span>}
            >
              <Button icon={<EditOutlined />} onClick={() => setEditingRecipeText(true)} style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                添加菜谱文字
              </Button>
            </Empty>
          )}
        </div>
      ),
    },
    {
      key: 'ai',
      label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>🤖 AI 总结</span>,
      children: recipe.ai_summary ? (
        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.8, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
          {recipe.ai_summary}
        </Paragraph>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: colors.textSecondary }}>暂无 AI 总结</span>} />
      ),
    },
    {
      key: 'qa',
      label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>💬 问答</span>,
      children: recipe.douyin_url ? (
        <div>
          <div style={{
            maxHeight: 400, overflowY: 'auto', marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {qaList.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 20, color: colors.textMuted }}>
                暂无提问记录
              </Text>
            ) : (
              qaList.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <div style={{
                      maxWidth: '80%',
                      background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.white})`,
                      border: `1px solid ${colors.primary}22`,
                      borderRadius: '14px 14px 4px 14px',
                      padding: '10px 16px',
                      boxShadow: shadows.sm,
                    }}>
                      <Text style={{ color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>
                        <QuestionCircleOutlined style={{ marginRight: 6, color: colors.primary }} />
                        {item.question}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%',
                      background: colors.cream,
                      borderRadius: '14px 14px 14px 4px',
                      padding: '10px 16px',
                    }}>
                      <Text style={{ color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
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
              style={{ fontFamily: 'var(--font-body)', borderRadius: `${borderRadius.button}px 0 0 ${borderRadius.button}px` }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAsk}
              loading={asking}
              style={{ borderRadius: `0 ${borderRadius.button}px ${borderRadius.button}px 0`, fontFamily: 'var(--font-body)' }}
            >
              发送
            </Button>
          </Space.Compact>
        </div>
      ) : (
        <Text style={{ color: colors.textMuted }}>非抖音导入的菜谱不支持视频提问</Text>
      ),
    },
    {
      key: 'notes',
      label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>📒 笔记</span>,
      children: editingNotes ? (
        <div>
          <TextArea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="写下你的笔记..."
            style={{ marginBottom: 12, fontFamily: 'var(--font-body)', border: `1px solid ${colors.border}`, borderRadius: borderRadius.input }}
          />
          <Space>
            <Button type="primary" icon={<SaveOutlined />} loading={savingNotes} onClick={handleSaveNotes} style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
              保存
            </Button>
            <Button icon={<CloseOutlined />} onClick={() => { setEditingNotes(false); setNotes(recipe.notes || '') }} style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
              取消
            </Button>
          </Space>
        </div>
      ) : (
        <div>
          {notes ? (
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.8, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
              {notes}
            </Paragraph>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: colors.textSecondary }}>暂无笔记</span>} />
          )}
          <div style={{ marginTop: 12 }}>
            <Button type="text" icon={<EditOutlined style={{ color: colors.primary }} />} onClick={() => setEditingNotes(true)} style={{ fontFamily: 'var(--font-body)', color: colors.primary }}>
              {notes ? '编辑笔记' : '添加笔记'}
            </Button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="page-enter">
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)', border: `1px solid ${colors.borderLight}`, color: colors.textSecondary }}
          >
            返回
          </Button>
          <Title level={4} style={{ margin: 0, color: colors.textPrimary, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22 }}>
            {recipe.title}
          </Title>
        </Space>
        <Space>
          <Popconfirm
            title={<span style={{ fontFamily: 'var(--font-body)' }}>确定删除此菜谱？</span>}
            description={<span style={{ fontFamily: 'var(--font-body)', color: colors.textSecondary }}>删除后无法恢复</span>}
            onConfirm={handleDelete}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15}>
          <div style={{
            borderRadius: borderRadius.card,
            overflow: 'hidden',
            marginBottom: 20,
            border: `1px solid ${colors.borderLight}`,
            boxShadow: shadows.md,
            background: '#000',
          }}>
            {videoUrl ? (
              <video
                controls
                style={{ width: '100%', display: 'block', background: '#000' }}
                src={videoUrl}
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div style={{
                textAlign: 'center', padding: '80px 20px',
                background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.bg})`,
                color: colors.textMuted,
              }}>
                <svg viewBox="64 64 896 896" width="48" height="48" fill={colors.textMuted}>
                  <path d="M912 302.3L784 376V224c0-35.3-28.7-64-64-64H128c-35.3 0-64 28.7-64 64v576c0 35.3 28.7 64 64 64h592c35.3 0 64-28.7 64-64V648l128 73.7c21.3 12.3 48-3.1 48-27.6V330c0-24.6-26.7-40-48-27.7zM712 800H136V224h576v576zm176-64l-144-84v-72l144-84v240z" />
                </svg>
                <br />
                <Text style={{ color: colors.textMuted, fontFamily: 'var(--font-body)' }}>无视频文件</Text>
              </div>
            )}
          </div>

          <Card
            style={{
              borderRadius: borderRadius.card,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: shadows.card,
            }}
            styles={{ body: { padding: 24 } }}
          >
            <Tabs items={tabItems} animated={{ inkBar: true, tabPane: true }} style={{ fontFamily: 'var(--font-body)' }} />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={<Text strong style={{ fontSize: 15, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>菜谱信息</Text>}
            style={{
              borderRadius: borderRadius.card,
              marginBottom: 16,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: shadows.card,
            }}
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
                <Tag
                  color={confidencePercent > 50 ? colors.success : colors.warning}
                  style={{ borderRadius: borderRadius.tag, padding: '0 10px', lineHeight: '22px', margin: 0 }}
                >
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
                  style={{ fontSize: 12, color: colors.primary, wordBreak: 'break-all', fontFamily: 'var(--font-body)' }}>
                  查看原视频
                </a>
              </InfoRow>
            )}
          </Card>

          <Card
            title={<Text strong style={{ fontSize: 15, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>标签</Text>}
            style={{
              borderRadius: borderRadius.card,
              marginBottom: 16,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: shadows.card,
            }}
            styles={{ body: { padding: 16 } }}
          >
            <Space wrap style={{ marginBottom: 12 }}>
              {tags.length > 0 ? tags.map((t, i) => (
                <Tag
                  key={t}
                  closable
                  onClose={() => handleRemoveTag(t)}
                  color={TAG_COLORS[i % TAG_COLORS.length]}
                  style={{ padding: '2px 12px', borderRadius: borderRadius.tag, fontSize: 13, margin: 0, lineHeight: '24px' }}
                >
                  {t}
                </Tag>
              )) : (
                <Text style={{ fontSize: 13, color: colors.textMuted }}>暂无标签</Text>
              )}
            </Space>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size="small"
                placeholder="输入标签后回车"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onPressEnter={handleAddTag}
                style={{ fontFamily: 'var(--font-body)' }}
              />
              <Button
                size="small"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTag}
                style={{ borderRadius: `0 ${borderRadius.button}px ${borderRadius.button}px 0` }}
              />
            </Space.Compact>
          </Card>
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
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      margin: '0 -12px',
      borderRadius: 6,
      borderBottom: `1px solid ${colors.borderLight}`,
      transition: 'background 0.2s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryLight }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ color: colors.primary, fontSize: 14, width: 20 }}>{icon}</span>
      <Text style={{ fontSize: 13, color: colors.textSecondary, minWidth: 70, fontFamily: 'var(--font-body)' }}>{label}</Text>
      {children || <Text style={{ fontSize: 13, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>{value}</Text>}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
