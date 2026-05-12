import { useEffect, useState, useContext, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Row, Col, Card, Typography, Tag, Empty,
  Select, Space, message, Button, Segmented, Spin,
} from 'antd'
import {
  UnorderedListOutlined, AppstoreOutlined,
  PlusOutlined, BookOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { listRecipes, searchRecipes, deleteRecipe, getRecipeCount, RecipeListItem } from '../api'
import { colors, shadows, borderRadius, spacing } from '../theme'
import { ImportContext } from '../components/AppLayout'

const { Text, Title } = Typography

const tagColors = ['#d4732a', '#bf6f4a', '#5a9e6f', '#6b8fbf', '#8d6e4e', '#d4a047', '#7a9e6f', '#c0543a']

const coverGradients = [
  ['#d4732a', '#bf6f4a'],
  ['#bf6f4a', '#8d6e4e'],
  ['#5a9e6f', '#7a9e6f'],
  ['#d4a047', '#bf6f4a'],
  ['#c0543a', '#d4732a'],
  ['#8d6e4e', '#6b8fbf'],
]

export default function RecipeList() {
  const navigate = useNavigate()
  const { openImport } = useContext(ImportContext)
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [viewMode, setViewMode] = useState<string>('grid')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 24

  const [counts, setCounts] = useState({ total: 0, cooking: 0 })
  const sentinelRef = useRef<HTMLDivElement>(null)

  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())

  const loadFresh = useCallback(async () => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    try {
      if (searchQuery) {
        const res = await searchRecipes({ query: searchQuery, page: 1, page_size: pageSize })
        setRecipes(res.data.results)
        setTotal(res.data.total)
        setHasMore(res.data.results.length < res.data.total)
      } else {
        const res = await listRecipes({ sort: sortBy, page: 1, page_size: pageSize })
        const data = res.data as any
        setRecipes(data)
        setHasMore(Array.isArray(data) && data.length >= pageSize)
      }
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sortBy])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      if (searchQuery) {
        const res = await searchRecipes({ query: searchQuery, page: nextPage, page_size: pageSize })
        setRecipes((prev) => {
          const merged = [...prev, ...res.data.results]
          setTotal(res.data.total)
          setHasMore(merged.length < res.data.total)
          return merged
        })
      } else {
        const res = await listRecipes({ sort: sortBy, page: nextPage, page_size: pageSize })
        const data = res.data as any
        setRecipes((prev) => {
          const merged = [...prev, ...data]
          setHasMore(Array.isArray(data) && data.length >= pageSize)
          return merged
        })
      }
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, searchQuery, sortBy])

  const { refreshKey } = useContext(ImportContext)

  useEffect(() => {
    loadFresh()
    getRecipeCount().then((res) => setCounts(res.data)).catch(() => {})
  }, [loadFresh, refreshKey])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) loadMore()
      },
      { threshold: 0, rootMargin: '300px 0px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadMore])

  const handleDelete = async (id: number) => {
    try {
      await deleteRecipe(id)
      message.success('已删除')
      setRecipes((prev) => prev.filter((r) => r.id !== id))
      getRecipeCount().then((res) => setCounts(res.data)).catch(() => {})
    } catch {
      message.error('删除失败')
    }
  }

  const handleMouseEnter = (id: number) => {
    setHoveredId(id)
    const vid = videoRefs.current.get(id)
    if (vid) {
      vid.currentTime = 0
      vid.play().catch(() => {})
    }
  }

  const handleMouseLeave = (id: number) => {
    setHoveredId((prev) => prev === id ? null : prev)
    const vid = videoRefs.current.get(id)
    if (vid) {
      vid.pause()
      vid.currentTime = 0
    }
  }

  function setVideoRef(id: number, el: HTMLVideoElement | null) {
    if (el) videoRefs.current.set(id, el)
    else videoRefs.current.delete(id)
  }

  function renderTags(tags: string | null) {
    if (!tags) return null
    const list = tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (list.length === 0) return null
    return (
      <Space size={4} wrap>
        {list.slice(0, 3).map((t, i) => (
          <Tag key={i} color={tagColors[i % tagColors.length]} style={{ fontSize: 10, lineHeight: '18px', borderRadius: borderRadius.tag, margin: 0, padding: '0 8px' }}>
            {t}
          </Tag>
        ))}
        {list.length > 3 && (
          <Tag style={{ fontSize: 10, lineHeight: '18px', borderRadius: borderRadius.tag, margin: 0, padding: '0 8px', background: colors.bg, color: colors.textMuted, border: `1px solid ${colors.borderLight}` }}>
            +{list.length - 3}
          </Tag>
        )}
      </Space>
    )
  }

  function getCoverGradient(index: number) {
    const g = coverGradients[index % coverGradients.length]
    return `linear-gradient(135deg, ${g[0]}22, ${g[1]}44)`
  }

  function getCoverGradientSolid(index: number) {
    const g = coverGradients[index % coverGradients.length]
    return `linear-gradient(135deg, ${g[0]}, ${g[1]})`
  }

  const statCardStyle = {
    borderRadius: borderRadius.card,
    border: `1px solid ${colors.borderLight}`,
    height: '100%',
    cursor: 'pointer',
    boxShadow: shadows.sm,
  }

  return (
    <div className="page-enter" key={searchQuery || 'all'}>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <div
            onClick={() => navigate('/')}
            style={{
              ...statCardStyle,
              background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.white})`,
              animation: 'fadeInUp 0.4s ease both',
              animationDelay: '0s',
            }}
          >
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: shadows.warm,
                  flexShrink: 0,
                }}>
                  <BookOutlined style={{ fontSize: 20, color: colors.white }} />
                </div>
                <div>
                  <Text style={{ fontSize: 26, fontWeight: 700, color: colors.textPrimary, display: 'block', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
                    {counts.total}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>全部菜谱</Text>
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div
            style={{
              ...statCardStyle,
              background: `linear-gradient(135deg, ${colors.successLight}, ${colors.white})`,
              animation: 'fadeInUp 0.4s ease both',
              animationDelay: '0.08s',
            }}
          >
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${colors.success}, #7ab893)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px rgba(90,158,111,0.3)`,
                  flexShrink: 0,
                }}>
                  <CheckCircleOutlined style={{ fontSize: 20, color: colors.white }} />
                </div>
                <div>
                  <Text style={{ fontSize: 26, fontWeight: 700, color: colors.textPrimary, display: 'block', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
                    {counts.cooking}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>烹饪视频</Text>
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div
            onClick={openImport}
            style={{
              ...statCardStyle,
              background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.white})`,
              borderColor: colors.primary,
              borderWidth: 1.5,
              animation: 'fadeInUp 0.4s ease both',
              animationDelay: '0.16s',
            }}
          >
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: shadows.warm,
                  flexShrink: 0,
                }}>
                  <PlusOutlined style={{ fontSize: 20, color: colors.white }} />
                </div>
                <div>
                  <Text style={{ fontSize: 15, fontWeight: 600, color: colors.primary, display: 'block', lineHeight: 1.2, fontFamily: 'var(--font-body)' }}>
                    导入新菜谱
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>从抖音或手动添加</Text>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Title level={4} style={{ margin: 0, color: colors.textPrimary, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
          {searchQuery ? `"${searchQuery}"` : '菜谱库'}
        </Title>
        <Space wrap>
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            style={{ width: 130 }}
            options={[
              { value: 'created_at', label: '最新添加' },
              { value: '-created_at', label: '最早添加' },
              { value: 'title', label: '名称 A-Z' },
            ]}
          />
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as string)}
            options={[
              { value: 'grid', icon: <AppstoreOutlined /> },
              { value: 'list', icon: <UnorderedListOutlined /> },
            ]}
            style={{ background: colors.bg }}
          />
        </Space>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                loading
                style={{ borderRadius: borderRadius.card, border: `1px solid ${colors.borderLight}` }}
                styles={{ body: { padding: 20 } }}
              />
            </Col>
          ))}
        </Row>
      ) : recipes.length === 0 ? (
        <Empty
          image={<div style={{ fontSize: 64, marginBottom: 8 }}>🍜</div>}
          description={
            <span style={{ color: colors.textSecondary, fontFamily: 'var(--font-body)' }}>
              {searchQuery ? `未找到与"${searchQuery}"匹配的菜谱` : '暂无菜谱'}
            </span>
          }
          style={{ marginTop: 60 }}
        >
          {searchQuery ? (
            <Button onClick={() => navigate('/')} style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)' }}>
              清除筛选
            </Button>
          ) : (
            <Button type="primary" onClick={openImport} style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', boxShadow: shadows.warm }}>
              导入菜谱
            </Button>
          )}
        </Empty>
      ) : viewMode === 'grid' ? (
        <>
          <Row gutter={[16, 16]}>
            {recipes.map((r, idx) => (
              <Col xs={24} sm={12} md={8} lg={6} key={r.id}>
                <Card
                  onClick={() => navigate(`/recipes/${r.id}`)}
                  onMouseEnter={() => handleMouseEnter(r.id)}
                  onMouseLeave={() => handleMouseLeave(r.id)}
                  style={{
                    borderRadius: borderRadius.card,
                    overflow: 'hidden',
                    border: `1px solid ${colors.borderLight}`,
                    animation: 'fadeInUp 0.4s ease both',
                    animationDelay: `${(idx % 8) * 0.06}s`,
                  }}
                  cover={
                    <div
                      style={{
                        height: 160,
                        background: getCoverGradientSolid(idx),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {r.video_path ? (
                        <video
                          ref={(el) => setVideoRef(r.id, el)}
                          muted
                          playsInline
                          preload="metadata"
                          src={`/api/video/${encodeURIComponent(r.video_path)}`}
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                          }}
                        />
                      ) : (
                        <span style={{ position: 'relative', zIndex: 1, fontSize: 52, filter: 'grayscale(0.2) brightness(1.1)' }}>🍳</span>
                      )}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: r.video_path ? undefined : getCoverGradient(idx),
                        opacity: r.video_path ? 0 : 0.3,
                      }} />

                      {hoveredId === r.id && r.video_path && (
                        <div style={{
                          position: 'absolute', bottom: 8, left: 8, zIndex: 3,
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%', width: 28, height: 28,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backdropFilter: 'blur(4px)',
                        }}>
                          <div style={{
                            width: 0, height: 0,
                            borderLeft: '8px solid white',
                            borderTop: '5px solid transparent',
                            borderBottom: '5px solid transparent',
                            marginLeft: 2,
                          }} />
                        </div>
                      )}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 40,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.05))',
                      }} />
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <Text ellipsis style={{ maxWidth: '100%', fontSize: 14, fontWeight: 600, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>
                        {r.title}
                      </Text>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>{renderTags(r.tags)}</div>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : ''}
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '24px 0' }}>
            {loadingMore ? (
              <Spin size="small" style={{ color: colors.primary }} />
            ) : hasMore ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>向下滚动加载更多</Text>
            ) : recipes.length > 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>已加载全部 {total || recipes.length} 个菜谱</Text>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div style={{
            background: colors.white, borderRadius: borderRadius.card, overflow: 'hidden',
            border: `1px solid ${colors.borderLight}`, boxShadow: shadows.card,
          }}>
            {recipes.map((r, idx) => (
              <div
                key={r.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', cursor: 'pointer',
                  borderBottom: idx < recipes.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'fadeInUp 0.35s ease both',
                  animationDelay: `${idx * 0.04}s`,
                }}
                onClick={() => navigate(`/recipes/${r.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primaryLight
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <div style={{
                  width: 56, height: 42, borderRadius: 8,
                  background: getCoverGradientSolid(idx),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0, overflow: 'hidden',
                  position: 'relative',
                }}>
                  {r.video_path ? (
                    <video
                      muted playsInline preload="metadata"
                      src={`/api/video/${encodeURIComponent(r.video_path)}`}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onMouseEnter={(e) => { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}) }}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
                    />
                  ) : (
                    <span style={{ position: 'relative', zIndex: 1 }}>🍳</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 14, color: colors.textPrimary, fontFamily: 'var(--font-body)' }} ellipsis>{r.title}</Text>
                  <div style={{ marginTop: 2 }}>{renderTags(r.tags)}</div>
                </div>
                <Text style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : ''}
                </Text>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '24px 0' }}>
            {loadingMore ? (
              <Spin size="small" style={{ color: colors.primary }} />
            ) : hasMore ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>向下滚动加载更多</Text>
            ) : recipes.length > 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>已加载全部 {total || recipes.length} 个菜谱</Text>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
