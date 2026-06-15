import { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { configService } from '../../services/configService'

export default function BetaNoticeModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    checkFirstLaunch()
  }, [])

  const checkFirstLaunch = async () => {
    try {
      const result = await configService.get()
      if (result.success && result.data) {
        const firstLaunchDone = result.data.first_launch_done
        if (firstLaunchDone !== 'true') {
          setVisible(true)
        }
      }
    } catch (error) {
      console.error('检查首次启动状态失败:', error)
    }
  }

  const handleOk = async () => {
    try {
      await configService.update({ first_launch_done: 'true' })
      setVisible(false)
    } catch (error) {
      console.error('更新首次启动状态失败:', error)
      setVisible(false)
    }
  }

  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
          PMAer 内测版说明
        </span>
      }
      open={visible}
      onOk={handleOk}
      okText="我知道了"
      cancelText={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={[
        <button
          key="ok"
          type="button"
          onClick={handleOk}
          style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          我知道了
        </button>,
      ]}
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
        <p style={{ marginBottom: 12 }}>
          <strong>欢迎使用 PMAer 内测版！</strong>
        </p>
        <p style={{ marginBottom: 12 }}>
          本版本为内测版，已内置小米 MiMo V2.5 API，可直接体验 AI 智能分析功能。
        </p>
        <p style={{ marginBottom: 12, color: '#ff4d4f', fontWeight: 500 }}>
          AI 功能将于 2026年7月31日 关闭。
        </p>
        <p style={{ marginBottom: 12 }}>
          届时请在「设置 → AI模型」中配置您自己的 API Key 继续使用。
        </p>
        <p style={{ color: '#666', fontSize: '13px' }}>
          如有疑问请联系开发团队。
        </p>
      </div>
    </Modal>
  )
}
