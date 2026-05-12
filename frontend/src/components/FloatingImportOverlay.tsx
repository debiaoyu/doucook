import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, Progress, Tag, Space, List, Spin } from 'antd'
import {
  CloseOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ImportOutlined, MinusOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { colors, shadows, borderRadius } from '../theme'
import { ImportTask } from './AppLayout'

const { Text } = Typography

interface FloatingImportOverlayProps {
  visible: boolean
  tasks: ImportTask[]
  minimized: boolean
  onMinimize: () => void
  onDismiss: () => void
  onRemoveTask: (taskId: string) => void
  onViewRecipe: (id: number) => void
}

function stepIcon(step?: string) {
  if (!step) return null
  if (step.includes('检测')) return '🔍'
  if (step.includes('AI') || step.includes('分析')) return '🤖'
  if (step.includes('下载')) return '⬇️'
  if (step.includes('扫描')) return '📋'
  return '⏳'
}

export default function FloatingImportOverlay({
  visible, tasks, minimized,
  onMinimize, onDismiss, onRemoveTask, onViewRecipe,
}: FloatingImportOverlayProps) {
  const navigate = useNavigate()
  const prevTaskCountRef = useRef(tasks.length)
  const [justUpdated, setJustUpdated] = useState(false)
  const [autoCloseSec, setAutoCloseSec] = useState<number | null>(null)
  const autoCloseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, dragging: false })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos?.x ?? window.innerWidth - rect.width - 24,
      startPosY: pos?.y ?? window.innerHeight - rect.height - 24,
      dragging: true,
    }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      let newX = dragRef.current.startPosX + dx
      let newY = dragRef.current.startPosY + dy
      const w = overlayRef.current?.offsetWidth ?? 400
      const h = overlayRef.current?.offsetHeight ?? 200
      newX = Math.max(0, Math.min(newX, window.innerWidth - w))
      newY = Math.max(0, Math.min(newY, window.innerHeight - h))
      setPos({ x: newX, y: newY })
    }
    const onUp = () => {
      dragRef.current.dragging = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [pos])

  const startAutoClose = useCallback(() => {
    setAutoCloseSec(5)
    autoCloseTimerRef.current = setInterval(() => {
      setAutoCloseSec((prev) => {
        if (prev === null || prev <= 1) {
          if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current)
          autoCloseTimerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
    dismissTimerRef.current = setTimeout(() => {
      setAutoCloseSec(null)
      onDismiss()
    }, 5000)
  }, [onDismiss])

  const cancelAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current) { clearInterval(autoCloseTimerRef.current); autoCloseTimerRef.current = null }
    if (dismissTimerRef.current) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null }
    setAutoCloseSec(null)
  }, [])

  useEffect(() => {
    if (tasks.length > prevTaskCountRef.current) {
      setJustUpdated(true)
      const t = setTimeout(() => setJustUpdated(false), 1500)
      prevTaskCountRef.current = tasks.length
      return () => clearTimeout(t)
    }
  }, [tasks.length])

  const prevImportingRef = useRef(false)
  const currentlyImporting = tasks.some((t) => t.importing)

  useEffect(() => {
    if (prevImportingRef.current && !currentlyImporting && tasks.length > 0) {
      const hasSuccess = tasks.some((t) => t.results.some((r) => r.is_cooking && !r.duplicate))
      if (hasSuccess) startAutoClose()
    }
    prevImportingRef.current = currentlyImporting
  }, [currentlyImporting, tasks, startAutoClose])

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  if (!visible) return null

  const allResults = tasks.flatMap((t) => t.results)
  const successCount = allResults.filter((r) => r.is_cooking && !r.duplicate).length
  const duplicateCount = allResults.filter((r) => r.duplicate).length
  const errorCount = allResults.filter((r) => r.error).length
  const anyImporting = currentlyImporting

  const getX = () => pos?.x ?? undefined
  const getY = () => pos?.y ?? undefined

  if (minimized) {
    return (
      <div
        ref={overlayRef as any}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: getX(),
          right: getX() !== undefined ? undefined : 24,
          bottom: getY() !== undefined ? undefined : 24,
          top: getY() !== undefined ? getY() : undefined,
          zIndex: 1000,
          cursor: 'grab',
          userSelect: 'none',
          animation: pos ? undefined : 'fadeInUp 0.3s ease',
        }}
      >
        <div
          onClick={onMinimize}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = shadows.warm }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = shadows.lg }}
          style={{
            padding: '8px 16px 8px 12px',
            background: anyImporting
              ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
              : `linear-gradient(135deg, ${colors.success}, #7ab893)`,
            borderRadius: borderRadius.pill,
            boxShadow: shadows.lg,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            backdropFilter: 'blur(8px)',
            border: `1px solid rgba(255,255,255,0.15)`,
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ImportOutlined style={{ color: colors.white, fontSize: 12 }} />
          </div>
          <Text style={{ color: colors.white, fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {anyImporting ? `${tasks.length} 个任务导入中...` : `${successCount} 个导入完成`}
          </Text>
          {anyImporting && (
            <div style={{ display: 'flex', gap: 3, marginLeft: 2 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: colors.white,
                  opacity: 0.6,
                  animation: `pulseGlow 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          )}
          {justUpdated && (
            <Tag color={colors.success} style={{
              borderRadius: borderRadius.tag, border: 'none',
              fontSize: 10, lineHeight: '16px', padding: '0 5px', margin: 0,
              fontWeight: 700,
            }}>
              +{tasks.length}
            </Tag>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={overlayRef as any}
      style={{
        position: 'fixed',
        left: getX(),
        right: getX() !== undefined ? undefined : 24,
        bottom: getY() !== undefined ? undefined : 24,
        top: getY() !== undefined ? getY() : undefined,
        zIndex: 1000,
        width: 400,
        maxHeight: 520,
        background: `rgba(255,255,255,0.96)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: borderRadius.card,
        boxShadow: '0 8px 32px rgba(44,36,32,0.12), 0 2px 8px rgba(44,36,32,0.06)',
        border: `1px solid ${colors.borderLight}`,
        display: 'flex', flexDirection: 'column',
        animation: pos ? undefined : 'fadeInUp 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '12px 16px',
          background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.white})`,
          borderBottom: `1px solid ${colors.borderLight}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'grab',
        }}
      >
        <Space>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.white, fontSize: 14,
            boxShadow: shadows.warm,
          }}>
            <ImportOutlined />
          </div>
          <Text strong style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: colors.textPrimary }}>
            导入任务 {tasks.length > 0 && `(${tasks.length})`}
          </Text>
        </Space>
        <Space size={2}>
          <Button
            type="text" size="small"
            icon={<MinusOutlined />}
            onClick={onMinimize}
            style={{ color: colors.textMuted }}
            title="最小化"
          />
          <Button
            type="text" size="small"
            icon={<CloseOutlined />}
            onClick={onDismiss}
            style={{ color: colors.textMuted }}
            title="关闭全部"
          />
        </Space>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: colors.textMuted }}>
            <Text style={{ fontSize: 13, fontFamily: 'var(--font-body)' }}>暂无导入任务</Text>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} style={{
              marginBottom: 10,
              borderRadius: borderRadius.card,
              border: `1px solid ${colors.borderLight}`,
              overflow: 'hidden',
              background: colors.white,
              animation: 'fadeInUp 0.3s ease both',
            }}>
              <div style={{
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${colors.borderLight}`,
                background: colors.bg,
              }}>
                <Space size={6}>
                  <Tag style={{
                    margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 8px',
                    borderRadius: borderRadius.tag, border: 'none',
                    background: task.type === 'batch' ? colors.primaryLight : '#e8f4f8',
                    color: task.type === 'batch' ? colors.primary : '#2d7d9a',
                  }}>
                    {task.type === 'batch' ? '批量' : 'URL'}
                  </Tag>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'var(--font-body)' }} ellipsis={{ tooltip: task.url || task.source }}>
                    {task.url || (task.source === 'favorites' ? '我的收藏' : '我的喜欢')}
                  </Text>
                </Space>
                <Space size={4}>
                  {task.importing && (
                    <Spin size="small" style={{ color: colors.primary }} />
                  )}
                  <Button
                    type="text" size="small"
                    icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                    onClick={() => onRemoveTask(task.id)}
                    style={{ color: task.importing ? colors.danger : colors.textMuted, width: 20, height: 20, minWidth: 20, transition: 'all 0.2s' }}
                    title={task.importing ? '取消任务' : '移除任务'}
                  />
                </Space>
              </div>

              {task.importing && (
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.borderLight}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{stepIcon(task.progress.step)}</span>
                    <Progress
                      percent={task.progress.total > 0 ? Math.round((task.progress.current / task.progress.total) * 100) : 0}
                      status="active"
                      showInfo={false}
                      strokeLinecap="round"
                      style={{ flex: 1, margin: 0 }}
                      size="small"
                    />
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'var(--font-body)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {task.progress.total > 0
                        ? `${task.progress.current} / ${task.progress.total}`
                        : task.progress.step || ''}
                    </Text>
                  </div>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'var(--font-body)' }} ellipsis={{ tooltip: task.progress.currentTitle }}>
                    {task.progress.step ? `${task.progress.step}` : ''}
                    {task.progress.currentTitle ? `: ${task.progress.currentTitle}` : ''}
                  </Text>
                </div>
              )}

              {task.results.length > 0 && (
                <div style={{ padding: '2px 4px', maxHeight: 120, overflowY: 'auto' }}>
                  {task.results.slice().reverse().map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 8px', borderRadius: 6,
                        cursor: item.recipe_id ? 'pointer' : 'default',
                        fontSize: 12,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryLight }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      onClick={() => { if (item.recipe_id) { onViewRecipe(item.recipe_id); navigate(`/recipes/${item.recipe_id}`) }}}
                    >
                      {item.is_cooking ? (
                        <CheckCircleOutlined style={{ color: colors.success, fontSize: 13, flexShrink: 0 }} />
                      ) : item.error ? (
                        <CloseCircleOutlined style={{ color: colors.danger, fontSize: 13, flexShrink: 0 }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: colors.textMuted, fontSize: 13, flexShrink: 0 }} />
                      )}
                      <Text style={{ fontSize: 11, color: colors.textPrimary, fontFamily: 'var(--font-body)' }} ellipsis>
                        {item.title || '未知'}
                      </Text>
                      {item.duplicate && (
                        <Tag color={colors.warning} style={{ fontSize: 9, lineHeight: '14px', padding: '0 4px', margin: 0, borderRadius: 3, border: 'none', flexShrink: 0 }}>
                          重复
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!anyImporting && tasks.length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${colors.borderLight}`,
          display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center',
        }}
          onMouseEnter={cancelAutoClose}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Tag color={colors.success} style={{ borderRadius: borderRadius.tag, border: 'none', margin: 0, fontSize: 11 }}>
              成功 {successCount}
            </Tag>
            {duplicateCount > 0 && (
              <Tag color={colors.warning} style={{ borderRadius: borderRadius.tag, border: 'none', margin: 0, fontSize: 11 }}>
                重复 {duplicateCount}
              </Tag>
            )}
            {errorCount > 0 && (
              <Tag color={colors.danger} style={{ borderRadius: borderRadius.tag, border: 'none', margin: 0, fontSize: 11 }}>
                失败 {errorCount}
              </Tag>
            )}
          </div>
          {autoCloseSec !== null && autoCloseSec > 0 && (
            <Text style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              {autoCloseSec}s
            </Text>
          )}
          {autoCloseSec !== null && autoCloseSec > 0 && (
            <Button size="small" onClick={cancelAutoClose} style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', fontSize: 11, height: 24 }}>
              保持
            </Button>
          )}
          <Button size="small" type="primary" ghost onClick={onDismiss} style={{ borderRadius: borderRadius.pill, fontFamily: 'var(--font-body)', fontSize: 11, height: 24 }}>
            关闭
          </Button>
        </div>
      )}
    </div>
  )
}
