import { useEffect, useState } from 'react'
import {
  Card, Typography, Form, Input, Button, message, Tag,
  List, Modal, Space, Popconfirm, Row, Col, Statistic,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, SettingOutlined,
  FolderOutlined, KeyOutlined, TagOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { getSettings, listCategories, getRecipeCount } from '../api'
import api from '../api'
import { colors } from '../theme'

const { Title, Text, Paragraph } = Typography

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [counts, setCounts] = useState({ total: 0, cooking: 0 })
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [cookiesInput, setCookiesInput] = useState('')
  const [cookiesModalOpen, setCookiesModalOpen] = useState(false)

  const loadData = () => {
    getSettings().then((res) => {
      setSettings(res.data)
      setCookiesInput(res.data.cookies_file || '')
    })
    listCategories().then((res) => setCategories(res.data))
    getRecipeCount().then((res) => setCounts(res.data))
  }

  useEffect(() => { loadData() }, [])

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setAddingCat(true)
    try {
      await api.post('/recipes/categories', { name: newCatName.trim() })
      message.success('分类已添加')
      setNewCatName('')
      loadData()
    } catch {
      message.error('添加失败')
    } finally {
      setAddingCat(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await api.delete(`/recipes/categories/${id}`)
      message.success('已删除')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSaveCookies = async () => {
    try {
      await api.put('/settings', { cookies_file: cookiesInput || null })
      message.success('Cookies 路径已更新')
      setCookiesModalOpen(false)
      loadData()
    } catch {
      message.error('保存失败')
    }
  }

  const handleClearCookies = async () => {
    try {
      await api.put('/settings', { cookies_file: null })
      message.success('Cookies 已清除')
      loadData()
    } catch {
      message.error('清除失败')
    }
  }

  const cookiesConfigured = settings?.cookies_file

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: colors.textPrimary }}>设置</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SettingOutlined style={{ color: colors.primary }} />
                <Text strong style={{ fontSize: 15 }}>数据统计</Text>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Statistic
                  title="菜谱总数"
                  value={counts.total}
                  valueStyle={{ color: colors.primary, fontSize: 32, fontWeight: 700 }}
                  prefix={<TagOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="做饭视频"
                  value={counts.cooking}
                  valueStyle={{ color: colors.success, fontSize: 32, fontWeight: 700 }}
                  prefix={<TagOutlined />}
                />
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <FolderOutlined style={{ color: colors.primary }} />
                <Text strong style={{ fontSize: 15 }}>存储</Text>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            {settings && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>数据目录</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>
                      {settings.data_dir}
                    </Text>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  视频文件和数据库均存储在上述目录中
                </Text>
              </div>
            )}
          </Card>

          <Card
            title={
              <Space>
                <KeyOutlined style={{ color: colors.primary }} />
                <Text strong style={{ fontSize: 15 }}>Cookies 文件</Text>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag
                color={cookiesConfigured ? 'green' : 'red'}
                style={{ borderRadius: 4, padding: '2px 8px' }}
              >
                {cookiesConfigured ? '🟢 已配置' : '🔴 未配置'}
              </Tag>
            </div>

            {settings?.cookies_file && (
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>当前路径</Text>
                <div style={{ marginTop: 4 }}>
                  <Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>
                    {settings.cookies_file}
                  </Text>
                </div>
              </div>
            )}

            <Space>
              <Button onClick={() => setCookiesModalOpen(true)}>
                {cookiesConfigured ? '更新' : '配置'}
              </Button>
              {cookiesConfigured && (
                <Popconfirm title="确定清除 Cookies 配置？" onConfirm={handleClearCookies}>
                  <Button danger>清除</Button>
                </Popconfirm>
              )}
            </Space>

            <AlertBox />

            <Modal
              title="配置 Cookies 文件路径"
              open={cookiesModalOpen}
              onCancel={() => setCookiesModalOpen(false)}
              onOk={handleSaveCookies}
            >
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">
                  请输入使用 <Text code>dousub login</Text> 命令生成的 cookies.txt 文件路径
                </Text>
              </div>
              <Input
                placeholder="如：/path/to/cookies.txt"
                value={cookiesInput}
                onChange={(e) => setCookiesInput(e.target.value)}
                onPressEnter={handleSaveCookies}
              />
            </Modal>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TagOutlined style={{ color: colors.primary }} />
                <Text strong style={{ fontSize: 15 }}>分类管理</Text>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {categories.length} 个分类
              </Text>
            }
            style={{ borderRadius: 12 }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input
                placeholder="输入新分类名称"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onPressEnter={handleAddCategory}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddCategory}
                loading={addingCat}
              >
                添加
              </Button>
            </div>

            <List
              dataSource={categories}
              style={{ background: colors.bg, borderRadius: 8, padding: 4 }}
              locale={{ emptyText: '暂无分类，在上方添加' }}
              renderItem={(cat) => (
                <List.Item
                  style={{
                    borderRadius: 6, marginBottom: 2, padding: '8px 12px',
                    background: colors.white,
                  }}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定删除此分类？"
                      description="删除后关联的菜谱将不再有此分类"
                      onConfirm={() => handleDeleteCategory(cat.id)}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <Space>
                    <Tag color={cat.color || undefined} style={{ borderRadius: 4, padding: '2px 8px' }}>
                      {cat.name}
                    </Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

function AlertBox() {
  return (
    <div style={{
      marginTop: 16, padding: '10px 14px',
      background: '#fff7e6', borderRadius: 8,
      border: '1px solid #ffd591', fontSize: 12,
      color: colors.textSecondary, lineHeight: 1.6,
    }}>
      💡 使用 <Text code style={{ fontSize: 11 }}>dousub login</Text> 命令登录抖音后，
      将生成的 cookies.txt 文件路径配置在上方
    </div>
  )
}
