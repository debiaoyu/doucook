import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Typography, Tag, Spin, Empty, Button, Space, Skeleton } from 'antd'
import {
  BookOutlined,
  CheckCircleOutlined,
  ImportOutlined,
  AppstoreOutlined,
  RightOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { getRecipeCount, listRecipes, listCategories, RecipeListItem, Category } from '../api'
import { colors } from '../theme'

const { Title, Text } = Typography

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ total: 0, cooking: 0 })
  const [recent, setRecent] = useState<RecipeListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    Promise.all([
      getRecipeCount(),
      listRecipes({ page: 1, page_size: 8 }),
      listCategories(),
    ]).then(([countRes, listRes, catRes]) => {
      setCounts(countRes.data)
      setRecent(listRes.data)
      setCategories(catRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <Title level={4} style={{ marginBottom: 24, color: colors.textPrimary }}>仪表盘</Title>
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={12} sm={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={16}><Card><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
          <Col xs={24} lg={8}><Card><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
        </Row>
      </div>
    )
  }

  if (counts.total === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Title level={4} style={{ color: colors.textSecondary }}>还没有菜谱</Title>
              <Text type="secondary">去导入第一个菜谱吧！</Text>
            </div>
          }
        >
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/import')}>
            导入菜谱
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: colors.textPrimary }}>仪表盘</Title>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/recipes')}
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: colors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOutlined style={{ fontSize: 24, color: colors.primary }} />
              </div>
              <div>
                <Text style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, display: 'block' }}>
                  {counts.total}
                </Text>
                <Text type="secondary">全部菜谱</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/recipes')}
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#e6f9f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: colors.success }} />
              </div>
              <div>
                <Text style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, display: 'block' }}>
                  {counts.cooking}
                </Text>
                <Text type="secondary">烹饪视频</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/import')}
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: colors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ImportOutlined style={{ fontSize: 24, color: colors.primary }} />
              </div>
              <div>
                <Button type="link" style={{ fontSize: 16, padding: 0, height: 'auto' }}>导入</Button>
                <Text type="secondary" style={{ display: 'block' }}>新菜谱</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/settings')}
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AppstoreOutlined style={{ fontSize: 24, color: colors.textSecondary }} />
              </div>
              <div>
                <Text style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, display: 'block' }}>
                  {categories.length}
                </Text>
                <Text type="secondary">分类</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <Text strong style={{ fontSize: 16 }}>最近添加</Text>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/recipes')} style={{ color: colors.primary }}>
                查看全部 <RightOutlined style={{ fontSize: 12 }} />
              </Button>
            }
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            {recent.length === 0 ? (
              <Text type="secondary">暂无菜谱</Text>
            ) : (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {recent.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    size="small"
                    style={{ minWidth: 180, maxWidth: 180, borderRadius: 10, flexShrink: 0 }}
                    onClick={() => navigate(`/recipes/${item.id}`)}
                    cover={
                      <div
                        style={{
                          height: 100,
                          background: `linear-gradient(135deg, ${item.categories?.[0]?.color || '#667eea'}88 0%, ${item.categories?.[0]?.color || '#764ba2'}44 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32,
                          borderTopLeftRadius: 10,
                          borderTopRightRadius: 10,
                        }}
                      >
                        🎬
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <Text ellipsis style={{ maxWidth: 150, fontSize: 13 }}>{item.title}</Text>
                      }
                      description={
                        <div>
                          {item.confidence != null && (
                            <Tag color={item.confidence > 0.5 ? 'green' : 'orange'} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                              {Math.round(item.confidence * 100)}%
                            </Tag>
                          )}
                          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : ''}
                          </Text>
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: 16 }}>快捷操作</Text>}
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/import')}
                style={{
                  height: 48, borderRadius: 10,
                  borderColor: colors.primary, color: colors.primary,
                }}
              >
                导入新视频
              </Button>
              <Button
                block
                size="large"
                icon={<SearchOutlined />}
                onClick={() => navigate('/recipes')}
                style={{ height: 48, borderRadius: 10 }}
              >
                浏览菜谱库
              </Button>
              <Button
                block
                size="large"
                icon={<ImportOutlined />}
                onClick={() => navigate('/import?tab=batch')}
                style={{ height: 48, borderRadius: 10 }}
              >
                批量导入
              </Button>
              <Button
                block
                size="large"
                icon={<SettingOutlined />}
                onClick={() => navigate('/settings')}
                style={{ height: 48, borderRadius: 10 }}
              >
                设置
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {categories.length > 0 && (
        <Card
          title={<Text strong style={{ fontSize: 16 }}>分类概览</Text>}
          style={{ borderRadius: 12, marginTop: 16 }}
          bodyStyle={{ padding: 16 }}
        >
          <Space wrap size={[8, 8]}>
            {categories.map((c) => (
              <Tag
                key={c.id}
                color={c.color || undefined}
                style={{ padding: '4px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                onClick={() => navigate(`/recipes?category=${encodeURIComponent(c.name)}`)}
              >
                {c.name}
              </Tag>
            ))}
          </Space>
        </Card>
      )}
    </div>
  )
}
