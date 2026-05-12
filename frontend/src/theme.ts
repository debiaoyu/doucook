export const colors = {
  // 主色系 - 温暖橙色
  primary: '#d4732a',
  primaryHover: '#e07e36',
  primaryLight: '#fef5ec',
  primaryGlow: '#d4732a12',
  primaryBright: '#e67e22',
  primaryDeep: '#c8641d',

  // 功能色
  success: '#5a9e6f',
  successLight: '#eef7f0',
  warning: '#d4a047',
  danger: '#c0543a',

  // 文字层次
  textPrimary: '#2c2420',
  textSecondary: '#7a6b5e',
  textMuted: '#b8aaa0',
  textInverse: '#ffffff',

  // 边框和背景
  border: '#e8ddd0',
  borderLight: '#f0e8de',
  borderMedium: '#e0d4c2',
  bg: '#faf5ee',
  surface: '#f7efe4',
  surfaceHover: '#f2e9d8',
  white: '#ffffff',

  // 装饰色
  wood: '#8d6e4e',
  woodLight: '#cbb5a0',
  accent: '#bf6f4a',
  cream: '#f5ede3',
  warmGray: '#d4c4b7',

  // 分类色彩系统
  category: {
    chinese: '#c0392b',    // 中餐 - 温暖红
    western: '#3498db',    // 西餐 - 优雅蓝
    japanese: '#27ae60',   // 日料 - 清新绿
    dessert: '#e91e63',    // 甜品 - 柔和粉
    korean: '#f39c12',     // 韩餐 - 活力橙
    italian: '#e74c3c',    // 意餐 - 热情红
    thai: '#9b59b6',       // 泰餐 - 神秘紫
    other: '#95a5a6',      // 其他 - 中性灰
  },

  // 渐变色
  gradients: {
    primary: ['#d4732a', '#bf6f4a'],
    success: ['#5a9e6f', '#7a9e6f'],
    warm: ['#faf5ee', '#f7efe4'],
    card: ['#ffffff', '#fefcfa'],
  }
}

export const shadows = {
  // 基础阴影
  none: 'none',
  xs: '0 1px 2px rgba(44,36,32,0.04)',
  sm: '0 1px 3px rgba(44,36,32,0.06), 0 1px 2px rgba(44,36,32,0.04)',
  md: '0 4px 14px rgba(44,36,32,0.07), 0 2px 4px rgba(44,36,32,0.04)',
  lg: '0 8px 28px rgba(44,36,32,0.09), 0 4px 8px rgba(44,36,32,0.04)',
  xl: '0 16px 40px rgba(44,36,32,0.12), 0 8px 16px rgba(44,36,32,0.06)',

  // 主题阴影
  warm: '0 4px 20px rgba(212,115,42,0.18)',
  warmInset: 'inset 0 1px 2px rgba(212,115,42,0.1)',

  // 组件专用阴影
  card: '0 2px 8px rgba(44,36,32,0.05), 0 1px 2px rgba(44,36,32,0.03)',
  cardHover: '0 10px 28px rgba(44,36,32,0.10), 0 4px 10px rgba(44,36,32,0.06)',
  button: '0 2px 4px rgba(212,115,42,0.2)',
  buttonHover: '0 4px 12px rgba(212,115,42,0.25)',
  modal: '0 20px 60px rgba(44,36,32,0.15), 0 8px 20px rgba(44,36,32,0.08)',
  dropdown: '0 8px 24px rgba(44,36,32,0.12), 0 4px 8px rgba(44,36,32,0.06)',

  // 特殊效果阴影
  glow: '0 0 20px rgba(212,115,42,0.3)',
  inner: 'inset 0 2px 4px rgba(44,36,32,0.06)',
  text: '0 1px 2px rgba(44,36,32,0.1)',
}

export const spacing = {
  // 基础间距 (8px 网格系统)
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  xxl: 48,  // 48px
  xxxl: 64, // 64px

  // 页面布局
  pagePadding: 32,      // 页面左右边距
  pagePaddingMobile: 16, // 移动端页面边距
  headerHeight: 64,     // 头部高度
  footerHeight: 60,     // 底部高度 (如果需要)

  // 组件间距
  cardGap: 20,          // 卡片间距
  cardPadding: 24,      // 卡片内边距
  sectionGap: 32,       // 区块间距
  contentGap: 16,       // 内容元素间距

  // 表单和输入
  inputHeight: 40,      // 输入框高度
  buttonHeight: 40,     // 按钮高度
  formItemGap: 16,      // 表单项间距

  // 导航和菜单
  navItemGap: 12,       // 导航项间距
  menuItemPadding: 12,  // 菜单项内边距

  // 图标和头像
  iconSize: 20,         // 标准图标大小
  avatarSize: 32,       // 头像大小
  avatarSizeLarge: 40,  // 大头像
}

export const borderRadius = {
  card: 12,
  button: 8,
  input: 8,
  modal: 12,
  tag: 6,
  pill: 20,
}
