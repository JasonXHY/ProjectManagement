import { useState, useEffect } from 'react'
import { Modal, Button, Input, Space } from 'antd'
import {
  FolderOutlined,
  SettingOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { configService } from '../../services/configService'

interface BetaNoticeModalProps {
  onNavigate?: (page: string) => void
}

export default function BetaNoticeModal({ onNavigate }: BetaNoticeModalProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [storagePath, setStoragePath] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkFirstLaunch()
  }, [])

  const checkFirstLaunch = async () => {
    try {
      const result = await configService.get()
      if (result.success && result.data) {
        if (result.data.first_launch_done !== 'true') {
          setVisible(true)
        }
      }
    } catch (error) {
      console.error('检查首次启动状态失败:', error)
    }
  }

  const handleBrowseFolder = async () => {
    try {
      const result = await window.api.settings.browseFolder()
      if (result.success && result.data) {
        setStoragePath(result.data)
      }
    } catch (error) {
      console.error('浏览文件夹失败:', error)
    }
  }

  const handleStep1Confirm = async () => {
    setLoading(true)
    try {
      if (storagePath) {
        await configService.update({ project_storage_path: storagePath })
      }
      setStep(2)
    } catch (error) {
      console.error('保存存储路径失败:', error)
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleStep1Close = () => {
    setStep(2)
  }

  const handleUseBuiltin = async () => {
    setLoading(true)
    try {
      await configService.update({
        first_launch_done: 'true',
        ai_key_source: 'builtin',
        ai_provider: 'xiaomi',
        ai_model: 'mimo-v2.5',
        ai_api_key: 'sk-c3vuo9gj5zpepvrcc7u509lpv0iazs9ze76bfstbl528eonf',
        ai_base_url: '',
      })
      setVisible(false)
    } catch (error) {
      console.error('更新设置失败:', error)
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupOwnKey = async () => {
    setLoading(true)
    try {
      await configService.update({
        first_launch_done: 'true',
        ai_key_source: 'custom',
      })
      setVisible(false)
      onNavigate?.('settings')
    } catch (error) {
      console.error('更新设置失败:', error)
      setVisible(false)
      onNavigate?.('settings')
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <Modal
      open={visible}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      styles={{ body: { padding: '32px' } }}
      width={480}
    >
      {step === 1 ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#EEF2FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <FolderOutlined style={{ fontSize: 24, color: '#4F46E5' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>设置项目文件存储位置</h2>
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8, marginBottom: 20 }}>
            PMAer 会为每个项目创建独立文件夹，用于存放项目文件和AI分析结果。请选择您希望的存储位置。
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: '#374151', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              存储路径
            </label>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={storagePath}
                placeholder="留空使用默认位置（用户数据目录下的projects文件夹）"
                readOnly
                style={{ flex: 1 }}
              />
              <Button icon={<FolderOutlined />} onClick={handleBrowseFolder}>
                浏览
              </Button>
            </Space.Compact>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              style={{ flex: 1, height: 40 }}
              onClick={handleStep1Close}
            >
              跳过，使用默认位置
            </Button>
            <Button
              type="primary"
              style={{ flex: 1, height: 40 }}
              loading={loading}
              onClick={handleStep1Confirm}
            >
              确认
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#EEF2FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <SettingOutlined style={{ fontSize: 24, color: '#4F46E5' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>配置 AI 助手</h2>
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8, marginBottom: 8 }}>
            PMAer 支持多家国内主流AI厂商，包括小米MiMo、智谱、阿里千问、百度文心、DeepSeek、腾讯混元、月之暗面Kimi、讯飞星火、百川、MiniMax等。
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8, marginBottom: 20 }}>
            您可以选择使用开发者的内置API快速体验，或配置自己的API Key获得更稳定的使用体验。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <Button
              block
              size="large"
              style={{ height: 48, textAlign: 'left', padding: '0 16px' }}
              onClick={handleSetupOwnKey}
              loading={loading}
            >
              <Space>
                <SettingOutlined />
                <span>我有 API Key，自己设置</span>
              </Space>
            </Button>
            <Button
              block
              size="large"
              type="primary"
              style={{ height: 48, textAlign: 'left', padding: '0 16px' }}
              onClick={handleUseBuiltin}
              loading={loading}
            >
              <Space>
                <RocketOutlined />
                <span>用开发者的，先试试看</span>
              </Space>
            </Button>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
            内置API Key将在 2026年7月31日 关闭，届时需配置自己的Key。
          </p>
        </div>
      )}
    </Modal>
  )
}
