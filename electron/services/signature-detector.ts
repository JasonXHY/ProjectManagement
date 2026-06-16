import { nativeImage } from 'electron'
import { ZhipuProvider } from './ai-providers/zhipu'
import { MiMoProvider } from './ai-providers/mimo'
import { getSetting, getDecryptedApiKey } from '../database/settings'
import { FileExtractor } from './file-extractor'
import { promises as fsPromises } from 'fs'

/** 签字检测服务，通过AI视觉能力识别文件中的手写签字 */
export class SignatureDetector {
  private static zhipuProvider: ZhipuProvider | null = null
  private static mimoProvider: MiMoProvider | null = null

  /** 初始化签字检测服务（加载AI供应商配置） */
  static init() {
    const zhipuKey = getDecryptedApiKey('zhipu_api_key') || getDecryptedApiKey('ai_api_key') || ''
    const mimoKey = getDecryptedApiKey('mimo_api_key')
    
    if (zhipuKey) {
      const zhipuUrl = getSetting('zhipu_api_url') || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      this.zhipuProvider = new ZhipuProvider(zhipuKey, zhipuUrl)
    }
    if (mimoKey) {
      const mimoUrl = (getSetting('mimo_api_url') || 'https://api.xiaomimimo.com').replace(/\/v1\/?$/, '')
      this.mimoProvider = new MiMoProvider(mimoKey, mimoUrl, mimoUrl, 'api')
    }
  }

  /** 检测文件是否包含手写签字 */
  static async detectSignature(filePath: string): Promise<boolean> {
    const ext = filePath.split('.').pop()?.toLowerCase()
    
    let imageBase64: string | null = null
    
    if (ext === 'pdf') {
      imageBase64 = await FileExtractor.pdfToImage(filePath)
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) {
      const buffer = await fsPromises.readFile(filePath)
      const image = nativeImage.createFromBuffer(buffer)
      const resized = image.resize({ width: 800 })
      const base64 = resized.toJPEG(80).toString('base64')
      imageBase64 = `data:image/${ext};base64,${base64}`
    }
    
    if (!imageBase64) {
      return false
    }
    
    const prompt = '这张图片中是否有手写签字？只回答"有签字"或"无签字"'
    
    try {
      if (this.zhipuProvider) {
        const result = await this.zhipuProvider.vision(imageBase64, prompt)
        return result.content.includes('有签字')
      }
      
      if (this.mimoProvider) {
        const result = await this.mimoProvider.vision(imageBase64, prompt)
        return result.content.includes('有签字')
      }
    } catch (error) {
      console.error('签字检测失败:', error)
    }
    
    return false
  }

  /** 清理资源（无隐藏窗口，保留接口兼容） */
  static destroy() {
    // OffscreenCanvas 无需额外清理
  }
}
