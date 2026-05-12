import { useEffect, useState, useContext, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Row, Col, Card, Typography, Tag, Empty,
  Select, Input, Space, Dropdown, message, Pagination, Button, Segmented,
} from 'antd'
import {
  EllipsisOutlined, DeleteOutlined, EyeOutlined,
  UnorderedListOutlined, AppstoreOutlined,
  PlusOutlined, BookOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { listRecipes, searchRecipes, deleteRecipe, getRecipeCount, RecipeListItem } from '../api'
import { colors, shadows, borderRadius } from '../theme'
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
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [viewMode, setViewMode] = useState<string>('grid')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 24

  const [counts, setCounts] = useState({ total: 0, cooking: 0 })
  const [sticky, setSticky] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setSticky(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      if (searchQuery) {
        const res = await searchRecipes({ query: searchQuery, page, page_size: pageSize })
        setRecipes(res.data.results)
        setTotal(res.data.total)
      } else {
        const res = await listRecipes({ sort: sortBy, page, page_size: pageSize })
        setRecipes(res.data as any)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    getRecipeCount().then((res) => setCounts(res.data)).catch(() => {})
  }, [searchQuery, sortBy, page])

  const handleDelete = async (id: number) => {
    try {
      await deleteRecipe(id)
      message.success('已删除')
      loadData()
      getRecipeCount().then((res) => setCounts(res.data)).catch(() => {})
    } catch {
      message.error('删除失败')
    }
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
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  return (
    <div className="page-enter">
      <div
        ref={statsRef}
        style={{
          overflow: 'hidden',
          maxHeight: sticky ? 0 : 200,
          opacity: sticky ? 0 : 1,
          transition: 'all 0.35s ease',
          marginBottom: sticky ? 0 : 20,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <div
              onClick={() => navigate('/')}
              style={{
                ...statCardStyle,
                background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.white})`,
                animation: 'fadeInUp 0.4s ease both',
                animationDelay: '0s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = shadows.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.sm }}
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
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = shadows.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.sm }}
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
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = shadows.warm }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadows.sm }}
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
      </div>

      <div
        style={{
          display: sticky ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          marginBottom: 16,
          background: colors.white,
          borderRadius: borderRadius.card,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.sm,
          opacity: sticky ? 1 : 0,
          transform: sticky ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.3s ease',
        }}
      >
        <Space size={24}>
          <Space size={8}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOutlined style={{ color: colors.white, fontSize: 13 }} />
            </div>
            <Text strong style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: colors.textPrimary }}>{counts.total}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>全部菜谱</Text>
          </Space>
          <Space size={8}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `linear-gradient(135deg, ${colors.success}, #7ab893)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircleOutlined style={{ color: colors.white, fontSize: 13 }} />
            </div>
            <Text strong style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: colors.textPrimary }}>{counts.cooking}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>烹饪视频</Text>
          </Space>
        </Space>
        <Button
          type="primary"
          size="small"
          ghost
          icon={<PlusOutlined />}
          onClick={openImport}
          style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)' }}
        >
          导入
        </Button>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Title level={4} style={{ margin: 0, color: colors.textPrimary, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22 }}>
          {searchQuery ? `"${searchQuery}"` : '菜谱库'}
        </Title>
        <Space wrap>
          <Select
            value={sortBy}
            onChange={(v) => { setSortBy(v); setPage(1) }}
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
            <Button onClick={() => { navigate('/') }} style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)' }}>
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
                  hoverable
                  onClick={() => navigate(`/recipes/${r.id}`)}
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
                        fontSize: 52,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: getCoverGradient(idx),
                        opacity: 0.3,
                      }} />
                      <span style={{ position: 'relative', zIndex: 1, filter: 'grayscale(0.2) brightness(1.1)' }}>🍳</span>
                      {r.confidence != null && (
                        <Tag
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            fontSize: 10, lineHeight: '18px',
                            borderRadius: borderRadius.tag,
                            border: 'none',
                            padding: '0 8px',
                            background: r.confidence > 0.5 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)',
                            color: r.confidence > 0.5 ? colors.success : colors.warning,
                            fontWeight: 700,
                            zIndex: 2,
                            animation: 'badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                            animationDelay: `${(idx % 8) * 0.06 + 0.2}s`,
                          }}
                        >
                          {Math.round(r.confidence * 100)}%
                        </Tag>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 40,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.05))',
                      }} />
                    </div>
                  }
                  actions={[
                    <EyeOutlined
                      key="view"
                      style={{ color: colors.textMuted, fontSize: 14 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${r.id}`) }}
                    />,
                    <Dropdown
                      key="more"
                      menu={{
                        items: [
                          { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'delete') handleDelete(r.id)
                        },
                      }}
                      trigger={['click']}
                    >
                      <EllipsisOutlined style={{ color: colors.textMuted, fontSize: 14 }} onClick={(e) => e.stopPropagation()} />
                    </Dropdown>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Text ellipsis style={{ maxWidth: '100%', fontSize: 14, fontWeight: 600, color: colors.textPrimary, fontFamily: 'var(--font-body)' }}>
                        {r.title}
                      </Text>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {renderTags(r.tags)}
                        </div>
                        <Space size={4}>
                          {r.is_cooking ? (
                            <Tag color={colors.success} style={{ fontSize: 10, lineHeight: '18px', borderRadius: borderRadius.tag, padding: '0 8px', margin: 0 }}>
                              烹饪
                            </Tag>
                          ) : (
                            <Tag style={{ fontSize: 10, lineHeight: '18px', borderRadius: borderRadius.tag, padding: '0 8px', margin: 0, background: colors.bg, color: colors.textMuted, border: `1px solid ${colors.borderLight}` }}>
                              未分类
                            </Tag>
                          )}
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : ''}
                          </Text>
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              total={total || recipes.length}
              pageSize={pageSize}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => <span style={{ color: colors.textSecondary }}>共 {t} 个菜谱</span>}
            />
          </div>
        </>
      ) : (
        <>
          <div style={{
            background: colors.white,
            borderRadius: borderRadius.card,
            overflow: 'hidden',
            border: `1px solid ${colors.borderLight}`,
            boxShadow: shadows.card,
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
                  fontSize: 20, flexShrink: 0,
                }}>
                  🍳
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 14, color: colors.textPrimary, fontFamily: 'var(--font-body)' }} ellipsis>{r.title}</Text>
                  <div style={{ marginTop: 2 }}>
                    {renderTags(r.tags)}
                  </div>
                </div>
                <Text style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN') : ''}
                </Text>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'delete') handleDelete(r.id)
                    },
                  }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<EllipsisOutlined style={{ color: colors.textMuted }} />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderRadius: borderRadius.button }}
                  />
                </Dropdown>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              total={total || recipes.length}
              pageSize={pageSize}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => <span style={{ color: colors.textSecondary }}>共 {t} 个菜谱</span>}
            />
          </div>
        </>
      )}
    </div>
  )
}
