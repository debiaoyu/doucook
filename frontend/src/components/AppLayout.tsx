import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Input, Button, Typography, theme, Space } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  ImportOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { colors } from '../theme'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/recipes', icon: <BookOutlined />, label: '菜谱库' },
  { key: '/import', icon: <ImportOutlined />, label: '导入' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('')

  return (
    <Layout style={{ minHeight: '100vh', background: colors.bg }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={220}
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: collapsed ? undefined : '2px 0 8px rgba(0,0,0,0.04)',
          background: colors.white,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.primary,
          }}
        >
          <Text strong style={{ fontSize: collapsed ? 18 : 20, color: '#fff', letterSpacing: 1 }}>
            {collapsed ? '🍳' : '🍳 doucook'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colors.white,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: 64,
          }}
        >
          {collapsed ? (
            <MenuUnfoldOutlined style={{ fontSize: 18, cursor: 'pointer', color: colors.textSecondary }} onClick={() => setCollapsed(false)} />
          ) : (
            <MenuFoldOutlined style={{ fontSize: 18, cursor: 'pointer', color: colors.textSecondary }} onClick={() => setCollapsed(true)} />
          )}
          <SearchInput />
          <div style={{ flex: 1 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/import')}
          >
            导入
          </Button>
        </Header>
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 64px - 48px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

function SearchInput() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  const handleSearch = (val: string) => {
    if (val.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(val.trim())}`)
      setValue('')
    }
  }

  return (
    <Input
      prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
      placeholder="搜索菜谱..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={() => handleSearch(value)}
      style={{ maxWidth: 400, borderRadius: 8 }}
      allowClear
    />
  )
}
