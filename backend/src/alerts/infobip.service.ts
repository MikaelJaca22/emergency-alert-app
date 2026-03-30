import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class InfobipService {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private sender: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('INFOBIP_BASE_URL') || 'https://api.infobip.com';
    this.apiKey = this.configService.get<string>('INFOBIP_API_KEY') || '';
    this.sender = this.configService.get<string>('INFOBIP_SENDER') || 'EmergencyAlert';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `App ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async sendSMS(to: string, message: string): Promise<any> {
    // If no API key configured, log the message instead of sending
    if (!this.apiKey) {
      console.log('[INFOBIP SIMULATION] Would send SMS to:', to);
      console.log('[INFOBIP SIMULATION] Message:', message);
      return { simulated: true, to, message };
    }

    try {
      const payload = {
        messages: [
          {
            from: this.sender,
            to: to,
            text: message,
          },
        ],
      };

      const response = await this.apiClient.post('/sms/2/text/advanced', payload);
      return response.data;
    } catch (error) {
      console.error('Infobip SMS Error:', error.response?.data || error.message);
      throw new Error('Failed to send SMS');
    }
  }

  async sendBulkSMS(phoneNumbers: string[], message: string): Promise<any> {
    // If no API key configured, log the messages instead of sending
    if (!this.apiKey) {
      console.log('[INFOBIP SIMULATION] Would send bulk SMS to:', phoneNumbers.length, 'recipients');
      console.log('[INFOBIP SIMULATION] Message:', message);
      return { simulated: true, recipientCount: phoneNumbers.length, message };
    }

    try {
      const messages = phoneNumbers.map(phone => ({
        from: this.sender,
        to: phone,
        text: message,
      }));

      const payload = { messages };
      const response = await this.apiClient.post('/sms/2/text/advanced', payload);
      return response.data;
    } catch (error) {
      console.error('Infobip Bulk SMS Error:', error.response?.data || error.message);
      throw new Error('Failed to send bulk SMS');
    }
  }

  async simulateIncomingSMS(from: string, keyword: string): Promise<{ status: string; response: string }> {
    // Simulate processing incoming SMS response
    const normalizedKeyword = keyword.toUpperCase().trim();
    
    if (normalizedKeyword.includes('SAFE')) {
      return {
        status: 'safe',
        response: 'Thank you for confirming you are safe. Stay alert for further updates.',
      };
    } else if (normalizedKeyword.includes('HELP')) {
      return {
        status: 'needs_help',
        response: 'Help request received. Emergency services have been notified and will respond shortly.',
      };
    } else {
      return {
        status: 'unknown',
        response: 'Unrecognized response. Please reply with SAFE or HELP.',
      };
    }
  }
}
