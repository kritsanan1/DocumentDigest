import { z } from 'zod';

// Thai ID Verification Schema and Types
export const ThaiIdVerificationSchema = z.object({
  citizenId: z.string().length(13, 'Thai ID must be exactly 13 digits'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subDistrict: z.string().optional(),
  address: z.string().optional(),
});

export const BiometricVerificationSchema = z.object({
  faceImage: z.string(), // Base64 encoded image
  livenessCheck: z.boolean().default(true),
  antiSpoofing: z.boolean().default(true),
});

export const VerificationRequestSchema = z.object({
  method: z.enum(['ndid', 'dopa', 'ekyc', 'thaid_app']),
  citizenData: ThaiIdVerificationSchema,
  biometricData: BiometricVerificationSchema.optional(),
  requestId: z.string().uuid(),
  callbackUrl: z.string().url().optional(),
});

export type ThaiIdVerification = z.infer<typeof ThaiIdVerificationSchema>;
export type BiometricVerification = z.infer<typeof BiometricVerificationSchema>;
export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;

// Verification Result Types
export interface VerificationResult {
  success: boolean;
  requestId: string;
  method: string;
  identityAssuranceLevel: 'IAL1' | 'IAL2' | 'IAL3';
  verifiedData?: {
    citizenId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    address?: string;
    province?: string;
    district?: string;
    subDistrict?: string;
    isVerified: boolean;
    verificationTimestamp: string;
  };
  biometricScore?: number;
  errors?: string[];
  metadata?: {
    provider: string;
    transactionId: string;
    blockchainHash?: string; // For NDID
    dopaReferenceId?: string; // For DOPA
  };
}

// NDID Platform Integration
export class NDIDVerificationService {
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NDID_API_KEY || '';
    this.clientId = process.env.NDID_CLIENT_ID || '';
    this.clientSecret = process.env.NDID_CLIENT_SECRET || '';
    this.baseUrl = process.env.NDID_BASE_URL || 'https://api.ndid.co.th/v1';
  }

  async initiateVerification(request: VerificationRequest): Promise<VerificationResult> {
    try {
      if (!this.apiKey) {
        throw new Error('NDID API credentials not configured');
      }

      // NDID API call structure based on official documentation
      const ndidRequest = {
        namespace: 'citizen_id',
        identifier: request.citizenData.citizenId,
        reference_id: request.requestId,
        callback_url: request.callbackUrl || `${process.env.BASE_URL}/api/auth/ndid/callback`,
        data_request_list: [
          {
            service_id: 'identity_verification',
            as_id_list: ['dopa.go.th'],
            min_ial: 2.3,
            min_aal: 2,
            request_params: JSON.stringify({
              firstName: request.citizenData.firstName,
              lastName: request.citizenData.lastName,
            }),
          },
        ],
        request_message: 'กรุณายืนยันตัวตนเพื่อเข้าใช้บริการ อบต.วังสามหมอ',
        min_idp: 1,
        request_timeout: 300,
      };

      const response = await fetch(`${this.baseUrl}/rp/requests/citizen_id/${request.citizenData.citizenId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
        },
        body: JSON.stringify(ndidRequest),
      });

      if (!response.ok) {
        throw new Error(`NDID API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        requestId: request.requestId,
        method: 'ndid',
        identityAssuranceLevel: 'IAL3',
        metadata: {
          provider: 'NDID',
          transactionId: result.request_id,
          blockchainHash: result.initial_salt,
        },
      };
    } catch (error) {
      return {
        success: false,
        requestId: request.requestId,
        method: 'ndid',
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'NDID verification failed'],
      };
    }
  }

  async checkVerificationStatus(requestId: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/rp/request_data/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
        },
      });

      const result = await response.json();

      if (result.status === 'completed' && result.response_valid) {
        return {
          success: true,
          requestId,
          method: 'ndid',
          identityAssuranceLevel: 'IAL3',
          verifiedData: {
            citizenId: result.data?.citizen_id,
            firstName: result.data?.first_name,
            lastName: result.data?.last_name,
            dateOfBirth: result.data?.date_of_birth,
            address: result.data?.address,
            isVerified: true,
            verificationTimestamp: new Date().toISOString(),
          },
          metadata: {
            provider: 'NDID',
            transactionId: result.request_id,
            blockchainHash: result.blockchain_hash,
          },
        };
      }

      return {
        success: false,
        requestId,
        method: 'ndid',
        identityAssuranceLevel: 'IAL1',
        errors: [result.error || 'Verification pending or failed'],
      };
    } catch (error) {
      return {
        success: false,
        requestId,
        method: 'ndid',
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'NDID status check failed'],
      };
    }
  }
}

// DOPA Digital ID Integration
export class DOPAVerificationService {
  private apiKey: string;
  private clientId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DOPA_API_KEY || '';
    this.clientId = process.env.DOPA_CLIENT_ID || '';
    this.baseUrl = process.env.USE_SANDBOX === 'true' 
      ? process.env.DOPA_SANDBOX_URL || 'https://sandbox-api.dopa.go.th/v1'
      : process.env.DOPA_BASE_URL || 'https://api.dopa.go.th/v1';
  }

  async verifyIdentity(request: VerificationRequest): Promise<VerificationResult> {
    try {
      if (!this.apiKey) {
        throw new Error('DOPA API credentials not configured');
      }

      // DOPA API verification request
      const dopaRequest = {
        citizen_id: request.citizenData.citizenId,
        first_name_th: request.citizenData.firstName,
        last_name_th: request.citizenData.lastName,
        date_of_birth: request.citizenData.dateOfBirth,
        request_id: request.requestId,
        verification_type: 'full_verification',
      };

      const response = await fetch(`${this.baseUrl}/citizen/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
        },
        body: JSON.stringify(dopaRequest),
      });

      if (!response.ok) {
        throw new Error(`DOPA API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: result.verified === true,
        requestId: request.requestId,
        method: 'dopa',
        identityAssuranceLevel: result.verification_level || 'IAL2',
        verifiedData: result.verified ? {
          citizenId: result.citizen_id,
          firstName: result.first_name_th,
          lastName: result.last_name_th,
          dateOfBirth: result.date_of_birth,
          address: result.address,
          province: result.province,
          district: result.district,
          subDistrict: result.sub_district,
          isVerified: true,
          verificationTimestamp: new Date().toISOString(),
        } : undefined,
        metadata: {
          provider: 'DOPA',
          transactionId: result.transaction_id,
          dopaReferenceId: result.reference_id,
        },
        errors: result.verified ? undefined : [result.error_message || 'DOPA verification failed'],
      };
    } catch (error) {
      return {
        success: false,
        requestId: request.requestId,
        method: 'dopa',
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'DOPA verification failed'],
      };
    }
  }
}

// ThaID App Integration via NDID SaaS
export class ThaIDVerificationService {
  private apiKey: string;
  private clientId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.THAID_API_KEY || '';
    this.clientId = process.env.THAID_CLIENT_ID || '';
    this.baseUrl = process.env.USE_SANDBOX === 'true' 
      ? process.env.THAID_SANDBOX_URL || 'https://sandbox-thaid.ndid.co.th/v1'
      : process.env.THAID_BASE_URL || 'https://thaid.ndid.co.th/v1';
  }

  async verifyWithThaIDApp(request: VerificationRequest): Promise<VerificationResult> {
    try {
      if (!this.apiKey) {
        throw new Error('ThaID API credentials not configured');
      }

      // ThaID App verification via NDID SaaS
      const thaidRequest = {
        citizen_id: request.citizenData.citizenId,
        request_id: request.requestId,
        callback_url: request.callbackUrl || `${process.env.BASE_URL}/api/auth/thaid/callback`,
        service_name: 'อบต.วังสามหมอ Tour Der Wang',
        purpose: 'การยืนยันตัวตนสำหรับใช้บริการท้องถิ่น',
        data_request: {
          first_name: true,
          last_name: true,
          date_of_birth: true,
          address: true,
          house_registration: true,
        },
        face_verification: request.biometricData ? {
          face_image: request.biometricData.faceImage,
          liveness_check: request.biometricData.livenessCheck,
          anti_spoofing: request.biometricData.antiSpoofing,
        } : undefined,
      };

      const response = await fetch(`${this.baseUrl}/verification/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
        },
        body: JSON.stringify(thaidRequest),
      });

      if (!response.ok) {
        throw new Error(`ThaID API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        requestId: request.requestId,
        method: 'thaid_app',
        identityAssuranceLevel: 'IAL3',
        metadata: {
          provider: 'ThaID',
          transactionId: result.transaction_id,
          blockchainHash: result.blockchain_hash,
        },
      };
    } catch (error) {
      return {
        success: false,
        requestId: request.requestId,
        method: 'thaid_app',
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'ThaID verification failed'],
      };
    }
  }

  async checkThaIDStatus(requestId: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/verification/status/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId,
        },
      });

      const result = await response.json();

      if (result.status === 'completed' && result.verified) {
        return {
          success: true,
          requestId,
          method: 'thaid_app',
          identityAssuranceLevel: 'IAL3',
          verifiedData: {
            citizenId: result.data.citizen_id,
            firstName: result.data.first_name_th,
            lastName: result.data.last_name_th,
            dateOfBirth: result.data.date_of_birth,
            address: result.data.current_address,
            province: result.data.province,
            district: result.data.district,
            subDistrict: result.data.sub_district,
            isVerified: true,
            verificationTimestamp: new Date().toISOString(),
          },
          biometricScore: result.biometric_score,
          metadata: {
            provider: 'ThaID',
            transactionId: result.transaction_id,
            blockchainHash: result.blockchain_hash,
          },
        };
      }

      return {
        success: false,
        requestId,
        method: 'thaid_app',
        identityAssuranceLevel: 'IAL1',
        errors: [result.error || 'ThaID verification pending or failed'],
      };
    } catch (error) {
      return {
        success: false,
        requestId,
        method: 'thaid_app',
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'ThaID status check failed'],
      };
    }
  }
}

// Main Thai ID Verification Service
export class ThaiIdVerificationService {
  private ndidService: NDIDVerificationService;
  private dopaService: DOPAVerificationService;
  private thaidService: ThaIDVerificationService;

  constructor() {
    this.ndidService = new NDIDVerificationService();
    this.dopaService = new DOPAVerificationService();
    this.thaidService = new ThaIDVerificationService();
  }

  async verifyIdentity(request: VerificationRequest): Promise<VerificationResult> {
    switch (request.method) {
      case 'ndid':
        return this.ndidService.initiateVerification(request);
      case 'dopa':
        return this.dopaService.verifyIdentity(request);
      case 'thaid_app':
        return this.thaidService.verifyWithThaIDApp(request);
      case 'ekyc':
        // eKYC integration would go here
        return {
          success: false,
          requestId: request.requestId,
          method: 'ekyc',
          identityAssuranceLevel: 'IAL1',
          errors: ['eKYC service not yet implemented'],
        };
      default:
        return {
          success: false,
          requestId: request.requestId,
          method: request.method,
          identityAssuranceLevel: 'IAL1',
          errors: ['Unsupported verification method'],
        };
    }
  }

  async checkStatus(requestId: string, method: string): Promise<VerificationResult> {
    switch (method) {
      case 'ndid':
        return this.ndidService.checkVerificationStatus(requestId);
      case 'thaid_app':
        return this.thaidService.checkThaIDStatus(requestId);
      case 'dopa':
        // DOPA is typically synchronous, so we would just return the stored result
        return {
          success: false,
          requestId,
          method: 'dopa',
          identityAssuranceLevel: 'IAL1',
          errors: ['DOPA verification is synchronous - check database for results'],
        };
      default:
        return {
          success: false,
          requestId,
          method,
          identityAssuranceLevel: 'IAL1',
          errors: ['Unsupported verification method for status check'],
        };
    }
  }

  // Helper method to generate ThaID deep link
  generateThaIdDeepLink(requestId: string, citizenId: string): string {
    const baseUrl = 'thaid://verify';
    const params = new URLSearchParams({
      request_id: requestId,
      citizen_id: citizenId,
      service_name: 'อบต.วังสามหมอ',
      callback_url: `${process.env.BASE_URL}/api/auth/thaid/callback`,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  // Helper method to generate QR code data
  generateQRCodeData(requestId: string, method: string): string {
    return JSON.stringify({
      request_id: requestId,
      verification_method: method,
      service_name: 'อบต.วังสามหมอ Tour Der Wang',
      timestamp: new Date().toISOString(),
    });
  }

  // Get verification status (unified method)
  async getVerificationStatus(requestId: string, method: string): Promise<VerificationResult> {
    return this.checkStatus(requestId, method);
  }
}