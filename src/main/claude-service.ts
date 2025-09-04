import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ClaudeTranslationResponse } from '@/shared/types';
import { logger } from './logger';

export class ClaudeService {
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    logger.info('claude-api', 'API key configured', { hasKey: !!apiKey });
    console.log('Claude API已配置');
  }

  async translateWord(
    word: string,
    sourceLanguage: string = 'en',
    targetLanguage: string = 'zh'
  ): Promise<ClaudeTranslationResponse | null> {
    if (!this.apiKey) {
      logger.error('claude-api', 'API key not configured');
      console.error('Claude API密钥未配置');
      return null;
    }

    try {
      logger.info('claude-api', 'Translation request started', { word, sourceLanguage, targetLanguage });
      const result = await this.makeDirectRequest(word, sourceLanguage, targetLanguage);
      logger.info('claude-api', 'Translation request completed', { word, success: !!result });
      return result;
    } catch (error: any) {
      logger.error('claude-api', 'Translation request failed', { word, error: error.message });
      console.error('Claude API调用失败:', error);
      return null;
    }
  }

  private async makeDirectRequest(
    word: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<ClaudeTranslationResponse | null> {
    return new Promise((resolve, reject) => {
      const prompt = `请翻译以下${this.getLanguageName(sourceLanguage)}单词到${this.getLanguageName(targetLanguage)}，并提供详细信息：

单词: "${word}"

请以JSON格式返回，包含以下字段：
{
  "translation": "翻译结果",
  "definition": "详细定义",
  "pronunciation": "发音标注",
  "partOfSpeech": "词性(noun/verb/adjective等)",
  "examples": ["例句1", "例句2"],
  "usageNotes": "使用说明或语境提示"
}`;

      const postData = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // 检查并使用代理
      const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
      console.log('检测到代理:', proxyUrl || '无');
      
      const options: any = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      // 如果有代理，添加代理Agent
      if (proxyUrl) {
        options.agent = new HttpsProxyAgent(proxyUrl);
        console.log('使用代理Agent:', proxyUrl);
      }

      console.log('发起Claude API请求...');

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Claude API响应状态:', res.statusCode);
          
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              const content = response.content?.[0]?.text;
              
              if (content) {
                // 解析JSON响应
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const result = JSON.parse(jsonMatch[0]);
                  console.log('Claude API翻译成功');
                  resolve(result as ClaudeTranslationResponse);
                  return;
                }
              }
              
              console.error('Claude API响应格式异常:', content);
              resolve(null);
            } catch (error) {
              console.error('解析Claude API响应失败:', error);
              resolve(null);
            }
          } else {
            console.error('Claude API错误响应:', data);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Claude API网络错误:', error);
        reject(error);
      });

      req.setTimeout(30000, () => {
        console.error('Claude API请求超时');
        req.destroy();
        resolve(null);
      });

      req.write(postData);
      req.end();
    });
  }


  private getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      'en': '英语',
      'ja': '日语',
      'it': '意大利语',
      'zh': '中文',
    };
    return languageNames[code] || code;
  }
}