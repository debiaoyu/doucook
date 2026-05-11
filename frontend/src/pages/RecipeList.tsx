import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Row, Col, Card, Typography, Tag, Spin, Empty,
  Select, Input, Space, Dropdown, message, Pagination, Button, Segmented,
} from 'antd'
import {
  EllipsisOutlined, DeleteOutlined, EyeOutlined,
  UnorderedListOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import { listRecipes, deleteRecipe, listCategories, searchRecipes, RecipeListItem } from '../api'
import { colors } from '../theme'

const { Text, Title } = Typography

const categoryGradients: Record<string, string> = {
  '川菜': '#e74c3c',
  '湘菜': '#c0392b',
  '粤菜': '#27ae60',
  '鲁菜': '#8e44ad',
  '江浙菜': '#2980b9',
  '素菜': '#00b894',
  '荤菜': '#e17055',
  '甜品': '#fd79a8',
  '面点': '#fdcb6e',
  '汤羹': '#74b9ff',
  '凉菜': '#00cec9',
  '小吃': '#e67e22',
}

function getCardGradient(categories?: { id: number; name: string; color: string | null }[]): string {
  if (categories && categories.length > 0) {
    const catName = categories[0].name
    const color = categoryGradients[catName] || categories[0].color || '#667eea'
    return `linear-gradient(135deg, ${color}88, ${color}44)`
  }
  return 'linear-gradient(135deg, #667eea88, #764ba244)'
}

function getCategoryEmoji(categories?: { id: number; name: string; color: string | null }[]): string {
  if (!categories || categories.length === 0) return '🍳'
  const emojiMap: Record<string, string> = {
    '川菜': '🌶️', '湘菜': '🌶️', '粤菜': '🥟', '鲁菜': '🥘',
    '江浙菜': '🦐', '素菜': '🥬', '荤菜': '🥩', '甜品': '🍰',
    '面点': '🍜', '汤羹': '🍲', '凉菜': '🥗', '小吃': '🍢',
  }
  return emojiMap[categories[0].name] || '🍳'
}

export default function RecipeList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const categoryFilter = searchParams.get('category') || ''

  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [filterCat, setFilterCat] = useState<string[]>(categoryFilter ? [categoryFilter] : [])
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [viewMode, setViewMode] = useState<string>('grid')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 24

  const loadData = async () => {
    setLoading(true)
    try {
      if (searchQuery) {
        const res = await searchRecipes({
          query: searchQuery,
          category: filterCat.length > 0 ? filterCat.join(',') : undefined,
          page,
          page_size: pageSize,
        })
        setRecipes(res.data.results)
        setTotal(res.data.total)
      } else {
        const res = await listRecipes({
          category: filterCat.length > 0 ? filterCat.join(',') : undefined,
          sort: sortBy,
          page,
          page_size: pageSize,
        })
        setRecipes(res.data as any)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    listCategories().then((res) => setCategories(res.data))
  }, [searchQuery, filterCat, sortBy, page])

  const handleDelete = async (id: number) => {
    try {
      await deleteRecipe(id)
      message.success('已删除')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleCategoryChange = (val: string[]) => {
    setFilterCat(val)
    setPage(1)
  }

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Title level={4} style={{ margin: 0, color: colors.textPrimary }}>
          {searchQuery ? `搜索: ${searchQuery}` : '菜谱库'}
        </Title>
        <Space wrap>
          <Select
            mode="multiple"
            allowClear
            placeholder="按分类筛选"
            style={{ minWidth: 160 }}
            value={filterCat}
            onChange={handleCategoryChange}
            options={categories.map((c) => ({ label: c.name, value: c.name }))}
            maxTagCount={2}
          />
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
          />
        </Space>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card loading style={{ borderRadius: 12 }} />
            </Col>
          ))}
        </Row>
      ) : recipes.length === 0 ? (
        <Empty
          description={
            <span style={{ color: colors.textSecondary }}>
              {searchQuery ? '未找到匹配的菜谱' : '暂无菜谱'}
            </span>
          }
          style={{ marginTop: 60 }}
        >
          {(searchQuery || filterCat.length > 0) ? (
            <Button onClick={() => {
              setFilterCat([])
              navigate('/recipes')
            }}>清除筛选</Button>
          ) : (
            <Button type="primary" onClick={() => navigate('/import')}>导入菜谱</Button>
          )}
        </Empty>
      ) : viewMode === 'grid' ? (
        <>
          <Row gutter={[16, 16]}>
            {recipes.map((r) => (
              <Col xs={24} sm={12} md={8} lg={6} key={r.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/recipes/${r.id}`)}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  cover={
                    <div
                      style={{
                        height: 160,
                        background: getCardGradient(r.categories),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        position: 'relative',
                      }}
                    >
                      {getCategoryEmoji(r.categories)}
                      {r.confidence != null && (
                        <Tag
                          color={r.confidence > 0.5 ? colors.success : colors.warning}
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            fontSize: 11, lineHeight: '18px', borderRadius: 4,
                            border: 'none',
                          }}
                        >
                          {Math.round(r.confidence * 100)}%
                        </Tag>
                      )}
                    </div>
                  }
                  actions={[
                    <EyeOutlined key="view" onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${r.id}`) }} />,
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
                      <EllipsisOutlined onClick={(e) => e.stopPropagation()} />
                    </Dropdown>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Text ellipsis style={{ maxWidth: '100%', fontSize: 14, fontWeight: 600 }}>
                        {r.title}
                      </Text>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {r.categories?.slice(0, 3).map((c) => (
                            <Tag key={c.id} color={c.color || undefined} style={{ fontSize: 11, lineHeight: '18px', marginBottom: 2 }}>
                              {c.name}
                            </Tag>
                          ))}
                          {(r.categories?.length || 0) > 3 && (
                            <Tag style={{ fontSize: 11, lineHeight: '18px' }}>+{r.categories!.length - 3}</Tag>
                          )}
                        </div>
                        <Space size={4}>
                          {r.is_cooking ? (
                            <Tag color="green" style={{ fontSize: 10, lineHeight: '16px', borderRadius: 4 }}>烹饪</Tag>
                          ) : (
                            <Tag style={{ fontSize: 10, lineHeight: '16px', borderRadius: 4 }}>未分类</Tag>
                          )}
                          <Text type="secondary" style={{ fontSize: 11 }}>
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
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total || recipes.length}
              pageSize={pageSize}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => `共 ${t} 个菜谱`}
            />
          </div>
        </>
      ) : (
        <>
          <div style={{ background: colors.white, borderRadius: 12, overflow: 'hidden' }}>
            {recipes.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.2s',
                }}
                onClick={() => navigate(`/recipes/${r.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 60, height: 45, borderRadius: 6,
                  background: getCardGradient(r.categories),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {getCategoryEmoji(r.categories)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 14 }} ellipsis>{r.title}</Text>
                  <Space size={6} style={{ marginTop: 2, display: 'flex' }}>
                    {r.categories?.slice(0, 2).map((c) => (
                      <Tag key={c.id} color={c.color || undefined} style={{ fontSize: 10, lineHeight: '16px' }}>{c.name}</Tag>
                    ))}
                    {r.confidence != null && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        匹配 {Math.round(r.confidence * 100)}%
                      </Text>
                    )}
                  </Space>
                </div>
                <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
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
                  <Button type="text" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
                </Dropdown>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total || recipes.length}
              pageSize={pageSize}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => `共 ${t} 个菜谱`}
            />
          </div>
        </>
      )}
    </div>
  )
}
