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

      const response = await fetch(`${this.baseUrl}/rp/requests/idp_response`, {
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
          blockchainHash: result.blockchain_hash,
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
      const response = await fetch(`${this.baseUrl}/rp/requests/${requestId}`, {
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

      if (result.status === 'verified') {
        return {
          success: true,
          requestId: request.requestId,
          method: 'dopa',
          identityAssuranceLevel: 'IAL2',
          verifiedData: {
            citizenId: result.citizen_data.citizen_id,
            firstName: result.citizen_data.first_name_th,
            lastName: result.citizen_data.last_name_th,
            dateOfBirth: result.citizen_data.date_of_birth,
            address: result.citizen_data.address,
            province: result.citizen_data.province,
            district: result.citizen_data.district,
            subDistrict: result.citizen_data.sub_district,
            isVerified: true,
            verificationTimestamp: new Date().toISOString(),
          },
          metadata: {
            provider: 'DOPA',
            transactionId: result.transaction_id,
            dopaReferenceId: result.reference_id,
          },
        };
      }

      return {
        success: false,
        requestId: request.requestId,
        method: 'dopa',
        identityAssuranceLevel: 'IAL1',
        errors: [result.error_message || 'DOPA verification failed'],
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

// eKYC Service Integration
export class EKYCVerificationService {
  private apiKey: string;
  private baseUrl: string;
  private provider: string;

  constructor() {
    this.apiKey = process.env.EKYC_API_KEY || '';
    this.baseUrl = process.env.EKYC_BASE_URL || 'https://api.iapp.co.th/ekyc/v1';
    this.provider = process.env.EKYC_PROVIDER || 'iapp';
  }

  async verifyWithBiometric(request: VerificationRequest): Promise<VerificationResult> {
    try {
      if (!this.apiKey || !request.biometricData) {
        throw new Error('eKYC API credentials or biometric data not provided');
      }

      // eKYC API request with biometric verification
      const ekycRequest = {
        document_type: 'thai_national_id',
        citizen_id: request.citizenData.citizenId,
        face_image: request.biometricData.faceImage,
        liveness_check: request.biometricData.livenessCheck,
        anti_spoofing: request.biometricData.antiSpoofing,
        verification_level: 'high',
        request_id: request.requestId,
      };

      const response = await fetch(`${this.baseUrl}/verify/biometric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(ekycRequest),
      });

      if (!response.ok) {
        throw new Error(`eKYC API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.verification_status === 'passed') {
        return {
          success: true,
          requestId: request.requestId,
          method: 'ekyc',
          identityAssuranceLevel: 'IAL2',
          verifiedData: {
            citizenId: result.extracted_data.citizen_id,
            firstName: result.extracted_data.first_name_th,
            lastName: result.extracted_data.last_name_th,
            dateOfBirth: result.extracted_data.date_of_birth,
            isVerified: true,
            verificationTimestamp: new Date().toISOString(),
          },
          biometricScore: result.biometric_score,
          metadata: {
            provider: this.provider.toUpperCase(),
            transactionId: result.transaction_id,
          },
        };
      }

      return {
        success: false,
        requestId: request.requestId,
        method: 'ekyc',
        identityAssuranceLevel: 'IAL1',
        biometricScore: result.biometric_score,
        errors: [result.error_message || 'eKYC biometric verification failed'],
      };
    } catch (error) {
      return {
        success: false,
        requestId: request.requestId,
        method: 'ekyc',
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'eKYC verification failed'],
      };
    }
  }
}

// Main Verification Service Orchestrator
export class ThaiIdVerificationService {
  private ndidService: NDIDVerificationService;
  private dopaService: DOPAVerificationService;
  private ekycService: EKYCVerificationService;

  constructor() {
    this.ndidService = new NDIDVerificationService();
    this.dopaService = new DOPAVerificationService();
    this.ekycService = new EKYCVerificationService();
  }

  async verifyIdentity(request: VerificationRequest): Promise<VerificationResult> {
    try {
      switch (request.method) {
        case 'ndid':
          return await this.ndidService.initiateVerification(request);
        
        case 'dopa':
          return await this.dopaService.verifyIdentity(request);
        
        case 'ekyc':
          return await this.ekycService.verifyWithBiometric(request);
        
        case 'thaid_app':
          // ThaID app deep linking - redirect to mobile app
          return {
            success: true,
            requestId: request.requestId,
            method: 'thaid_app',
            identityAssuranceLevel: 'IAL2',
            metadata: {
              provider: 'ThaID',
              transactionId: request.requestId,
            },
          };
        
        default:
          throw new Error(`Unsupported verification method: ${request.method}`);
      }
    } catch (error) {
      return {
        success: false,
        requestId: request.requestId,
        method: request.method,
        identityAssuranceLevel: 'IAL1',
        errors: [error instanceof Error ? error.message : 'Verification failed'],
      };
    }
  }

  async getVerificationStatus(requestId: string, method: string): Promise<VerificationResult> {
    switch (method) {
      case 'ndid':
        return await this.ndidService.checkVerificationStatus(requestId);
      
      default:
        return {
          success: false,
          requestId,
          method,
          identityAssuranceLevel: 'IAL1',
          errors: ['Status check not implemented for this method'],
        };
    }
  }

  generateThaIdDeepLink(requestId: string, citizenId: string): string {
    const appScheme = process.env.THAID_APP_SCHEME || 'thaid://';
    const params = new URLSearchParams({
      action: 'verify',
      request_id: requestId,
      citizen_id: citizenId,
      callback_url: `${process.env.BASE_URL}/api/auth/thaid/callback`,
    });
    
    return `${appScheme}verify?${params.toString()}`;
  }

  generateQRCodeData(requestId: string, method: string): object {
    return {
      type: 'thai_id_verification',
      request_id: requestId,
      method,
      expire_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      callback_url: `${process.env.BASE_URL}/api/auth/${method}/callback`,
    };
  }
}