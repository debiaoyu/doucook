import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Typography, Tag, Spin, Button, Input, Space,
  message, Popconfirm, Tabs, Empty,
} from 'antd'
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined,
  SendOutlined, LinkOutlined, QuestionCircleOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined, MobileOutlined,
  PlusOutlined, LoadingOutlined,
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getRecipe, updateRecipe, deleteRecipe as apiDeleteRecipe, askQuestion, RecipeDetail as RecipeDetailType } from '../api'
import { colors, shadows, borderRadius } from '../theme'

const { Title, Text } = Typography
const { TextArea } = Input

const TAG_COLORS = ['#d4732a', '#bf6f4a', '#5a9e6f', '#6b8fbf', '#8d6e4e', '#d4a047', '#7a9e6f', '#c0543a']

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  const [notes, setNotes] = useState('')
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setQaList((res.data.qa_pairs || []).map((q) => ({ question: q.question, answer: q.answer })))
      setRecipeTextDraft(res.data.recipe_text || '')
      setTags(parseTags(res.data.tags))
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    }
  }, [])

  function parseTags(tagsStr: string | null): string[] {
    if (!tagsStr) return []
    return tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
  }

  const saveNotes = async (text: string) => {
    if (!id) return
    setNotesStatus('saving')
    try {
      await updateRecipe(Number(id), { notes: text })
      setNotesStatus('saved')
      setTimeout(() => setNotesStatus('idle'), 2000)
    } catch {
      setNotesStatus('idle')
      message.error('笔记保存失败')
    }
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => saveNotes(value), 2000)
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
    const q = question.trim()
    setQuestion('')
    setQaList((prev) => [{ question: q, answer: null }, ...prev])
    setAsking(true)
    try {
      const res = await askQuestion(Number(id), { question: q })
      const answer = res.data.answer
      if (res.data.error) message.warning(res.data.error)
      setQaList((prev) => prev.map((item) =>
        item.question === q && item.answer === null
          ? { ...item, answer: answer || '暂无回答' }
          : item
      ))
    } catch {
      setQaList((prev) => prev.map((item) =>
        item.question === q && item.answer === null
          ? { ...item, answer: '提问失败' }
          : item
      ))
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
    if (tags.includes(t)) { setTagInput(''); return }
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


  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="page-enter">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 20,
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: 16 }} />}
          onClick={() => navigate('/')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            color: colors.textSecondary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${colors.borderLight}`,
            flexShrink: 0,
          }}
        />
        <Title level={4} style={{
          margin: 0, color: colors.textPrimary,
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 20,
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {recipe.title}
        </Title>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <div style={{
            borderRadius: borderRadius.card,
            overflow: 'hidden',
            marginBottom: 20,
            border: `1px solid ${colors.borderLight}`,
            boxShadow: shadows.md,
            background: '#000',
            maxHeight: '55vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {videoUrl ? (
              <video
                controls
                style={{ width: '100%', maxHeight: '55vh', display: 'block', background: '#000', objectFit: 'contain' }}
                src={videoUrl}
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div style={{
                textAlign: 'center', padding: '80px 20px',
                background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.bg})`,
                color: colors.textMuted, width: '100%',
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
            styles={{ body: { padding: 20 } }}
          >
            <Tabs
              items={[
                {
                  key: 'recipe',
                  label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>📝 菜谱</span>,
                  children: editingRecipeText ? (
                    <div>
                      <TextArea rows={12} value={recipeTextDraft}
                        onChange={(e) => setRecipeTextDraft(e.target.value)}
                        style={{ marginBottom: 12, fontFamily: 'var(--font-body)', border: `1px solid ${colors.border}`, borderRadius: borderRadius.input }}
                      />
                      <Space>
                        <Button type="primary" icon={<EditOutlined />} onClick={handleSaveRecipeText}
                          style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                          保存
                        </Button>
                        <Button onClick={() => { setEditingRecipeText(false); setRecipeTextDraft(recipe.recipe_text || '') }}
                          style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                          取消
                        </Button>
                      </Space>
                    </div>
                  ) : recipe.recipe_text ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.recipe_text}</ReactMarkdown>
                      <div style={{ marginTop: 16 }}>
                        <Button type="text" icon={<EditOutlined style={{ color: colors.primary }} />}
                          onClick={() => setEditingRecipeText(true)}
                          style={{ fontFamily: 'var(--font-body)', color: colors.primary }}>
                          编辑菜谱
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: colors.textSecondary }}>暂未生成菜谱文字</span>}>
                      <Button icon={<EditOutlined />} onClick={() => setEditingRecipeText(true)}
                        style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                        添加菜谱文字
                      </Button>
                    </Empty>
                  ),
                },
                {
                  key: 'ai',
                  label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>🤖 AI 总结</span>,
                  children: recipe.ai_summary ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipe.ai_summary}</ReactMarkdown>
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: colors.textSecondary }}>暂无 AI 总结</span>} />
                  ),
                },
                {
                  key: 'qa',
                  label: <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>💬 问答</span>,
                  children: recipe.douyin_url ? (
                    <div>
                      <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {qaList.length === 0 ? (
                          <Text style={{ textAlign: 'center', padding: 20, color: colors.textMuted }}>暂无提问记录</Text>
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
                                  background: item.answer ? colors.cream : colors.bg,
                                  borderRadius: '14px 14px 14px 4px',
                                  padding: '10px 16px',
                                }}>
                                  {item.answer !== null ? (
                                    <Text style={{ color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
                                      {item.answer}
                                    </Text>
                                  ) : (
                                    <Space size={6}>
                                      <Spin size="small" style={{ color: colors.primary }} />
                                      <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'var(--font-body)' }}>
                                        思考中...
                                      </Text>
                                    </Space>
                                  )}
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
                          style={{ borderRadius: `0 ${borderRadius.button}px ${borderRadius.button}px 0`, fontFamily: 'var(--font-body)' }}>
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
                  children: (
                    <div>
                      <div style={{ position: 'relative' }}>
                        <TextArea
                          rows={6}
                          value={notes}
                          onChange={(e) => handleNotesChange(e.target.value)}
                          placeholder="写下你的笔记...（自动保存）"
                          style={{ fontFamily: 'var(--font-body)', border: `1px solid ${colors.border}`, borderRadius: borderRadius.input }}
                        />
                        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {notesStatus === 'saving' && (
                            <>
                              <LoadingOutlined style={{ color: colors.textMuted, fontSize: 11 }} />
                              <Text style={{ fontSize: 10, color: colors.textMuted }}>保存中...</Text>
                            </>
                          )}
                          {notesStatus === 'saved' && (
                            <Text style={{ fontSize: 10, color: colors.success }}>已自动保存</Text>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
              animated={{ inkBar: true, tabPane: false }}
              style={{ fontFamily: 'var(--font-body)', overflow: 'visible' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: borderRadius.card,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: shadows.card,
              marginBottom: 16,
            }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: '4px 0' }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${colors.borderLight}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                }} />
                <Text strong style={{ fontSize: 14, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>
                  菜谱信息
                </Text>
              </div>
              <InfoRow icon={<CalendarOutlined />} label="创建日期" value={
                recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('zh-CN') : '-'
              } />
              <InfoRow icon={<MobileOutlined />} label="来源" value={
                recipe.source === 'douyin' ? '抖音导入' :
                recipe.source === 'manual' ? '手动创建' : recipe.source
              } />

              {recipe.video_duration != null && (
                <InfoRow icon={<ClockCircleOutlined />} label="视频时长"
                  value={formatDuration(recipe.video_duration)} />
              )}
              {recipe.douyin_url && (
                <InfoRow icon={<LinkOutlined />} label="抖音链接">
                  <a href={recipe.douyin_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: colors.primary, wordBreak: 'break-all', fontFamily: 'var(--font-body)' }}>
                    查看原视频
                  </a>
                </InfoRow>
              )}
            </div>

            <div style={{ padding: '14px 18px', borderTop: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.success}, #7ab893)`,
                }} />
                <Text strong style={{ fontSize: 14, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>
                  标签
                </Text>
              </div>
              <Space wrap style={{ marginBottom: 10 }}>
                {tags.length > 0 ? tags.map((t, i) => (
                  <Tag key={t} closable onClose={() => handleRemoveTag(t)}
                    color={TAG_COLORS[i % TAG_COLORS.length]}
                    style={{ padding: '2px 12px', borderRadius: borderRadius.tag, fontSize: 13, margin: 0, lineHeight: '24px' }}>
                    {t}
                  </Tag>
                )) : (
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>暂无标签</Text>
                )}
              </Space>
              <Space.Compact style={{ width: '100%' }}>
                <Input size="small" placeholder="输入标签后回车" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)} onPressEnter={handleAddTag}
                  style={{ fontFamily: 'var(--font-body)' }} />
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddTag}
                  style={{ borderRadius: `0 ${borderRadius.button}px ${borderRadius.button}px 0` }} />
              </Space.Compact>
            </div>

            <div style={{ padding: '12px 18px 16px', borderTop: `1px solid ${colors.borderLight}` }}>
              <Popconfirm
                title={<span style={{ fontFamily: 'var(--font-body)' }}>确定删除此菜谱？</span>}
                description={<span style={{ fontFamily: 'var(--font-body)', color: colors.textSecondary }}>删除后无法恢复</span>}
                onConfirm={handleDelete}
              >
                <Button danger block icon={<DeleteOutlined />}
                  style={{ borderRadius: borderRadius.button, fontFamily: 'var(--font-body)' }}>
                  删除菜谱
                </Button>
              </Popconfirm>
            </div>
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
      padding: '11px 18px',
      borderBottom: `1px solid ${colors.borderLight}`,
      transition: 'background 0.2s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryLight }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ color: colors.primary, fontSize: 14, width: 20, flexShrink: 0 }}>{icon}</span>
      <Text style={{ fontSize: 13, color: colors.textSecondary, minWidth: 56, fontFamily: 'var(--font-body)' }}>{label}</Text>
      {children || <Text style={{ fontSize: 13, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>{value}</Text>}
    </div>
  )
}
