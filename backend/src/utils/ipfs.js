const axios = require('axios');
const FormData = require('form-data');
const Settings = require('../models/Settings');

/**
 * IPFS Upload Utilities
 * Supports multiple free IPFS providers:
 * 1. Tatum (Primary) - 50MB/month free
 * 2. Pinata (Fallback) - 1GB free
 * 3. Web3.Storage (Alternative) - Free unlimited
 * 4. NFT.Storage (Alternative) - Free unlimited
 * 
 * API keys can be configured via:
 * 1. Admin Settings UI (preferred - stored in database)
 * 2. Environment variables (.env file - fallback)
 */

class IPFSUploader {
  constructor() {
    // API keys will be loaded from database or .env
    this.tatumApiKey = null;
    this.pinataApiKey = null;
    this.pinataSecretKey = null;
    this.pinataJwt = null;
    this.web3StorageToken = null;
    this.nftStorageToken = null;
    
    // API endpoints
    this.tatumBaseUrl = 'https://api.tatum.io/v3/ipfs';
    this.pinataBaseUrl = 'https://api.pinata.cloud';
    this.web3StorageUrl = 'https://api.web3.storage';
    this.nftStorageUrl = 'https://api.nft.storage';
    
    // Load settings flag
    this.settingsLoaded = false;
  }

  /**
   * Load API keys from database settings (preferred) or environment variables (fallback)
   */
  async loadSettings() {
    if (this.settingsLoaded) {
      return; // Already loaded
    }

    try {
      // Try to load from database first
      this.tatumApiKey = await Settings.get('tatum_api_key') || process.env.TATUM_API_KEY;
      this.pinataApiKey = await Settings.get('pinata_api_key') || process.env.PINATA_API_KEY;
      this.pinataSecretKey = await Settings.get('pinata_secret_key') || process.env.PINATA_SECRET_KEY;
      this.pinataJwt = await Settings.get('pinata_jwt') || process.env.PINATA_JWT;
      this.web3StorageToken = await Settings.get('web3_storage_token') || process.env.WEB3_STORAGE_TOKEN;
      this.nftStorageToken = await Settings.get('nft_storage_token') || process.env.NFT_STORAGE_TOKEN;
      
      this.settingsLoaded = true;
      
      console.log('IPFS Settings loaded:', {
        tatum: this.tatumApiKey ? '✓ Configured' : '✗ Not configured',
        pinata: this.pinataApiKey && (this.pinataSecretKey || this.pinataJwt) ? '✓ Configured' : '✗ Not configured',
        web3Storage: this.web3StorageToken ? '✓ Configured' : '✗ Not configured',
        nftStorage: this.nftStorageToken ? '✓ Configured' : '✗ Not configured'
      });
    } catch (error) {
      console.error('Error loading IPFS settings from database, using .env fallback:', error.message);
      // Fallback to environment variables
      this.tatumApiKey = process.env.TATUM_API_KEY;
      this.pinataApiKey = process.env.PINATA_API_KEY;
      this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
      this.pinataJwt = process.env.PINATA_JWT;
      this.web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
      this.nftStorageToken = process.env.NFT_STORAGE_TOKEN;
      this.settingsLoaded = true;
    }
  }

  /**
   * Upload file to IPFS using Tatum (Primary)
   * Free tier: 50MB/month
   * Docs: https://docs.tatum.io/reference/storeipfs
   */
  async uploadToTatum(fileBuffer, filename) {
    if (!this.tatumApiKey) {
      throw new Error('TATUM_API_KEY not configured in environment variables');
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, filename);

      const response = await axios.post(
        `${this.tatumBaseUrl}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'x-api-key': this.tatumApiKey,
          },
        }
      );

      return {
        success: true,
        provider: 'tatum',
        ipfsHash: response.data.ipfsHash,
        url: `https://ipfs.io/ipfs/${response.data.ipfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.ipfsHash}`,
      };
    } catch (error) {
      console.error('Tatum upload failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload file to IPFS using Pinata (Fallback)
   * Free tier: 1GB storage, unlimited bandwidth
   * Docs: https://docs.pinata.cloud/
   * Supports both API Key/Secret and JWT authentication
   */
  async uploadToPinata(fileBuffer, filename) {
    // Check for JWT first (preferred), then API Key/Secret
    const hasJwt = !!this.pinataJwt;
    const hasApiKey = !!(this.pinataApiKey && this.pinataSecretKey);
    
    if (!hasJwt && !hasApiKey) {
      throw new Error('Pinata not configured. Need either JWT or API Key + Secret');
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, filename);

      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          project: 'audit-portal',
          type: 'logo',
        },
      });
      formData.append('pinataMetadata', metadata);

      // Build headers based on auth method
      const headers = {
        ...formData.getHeaders(),
      };
      
      if (hasJwt) {
        // JWT authentication (preferred)
        headers['Authorization'] = `Bearer ${this.pinataJwt}`;
      } else {
        // API Key/Secret authentication (legacy)
        headers['pinata_api_key'] = this.pinataApiKey;
        headers['pinata_secret_api_key'] = this.pinataSecretKey;
      }

      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
        formData,
        { headers }
      );

      return {
        success: true,
        provider: 'pinata',
        ipfsHash: response.data.IpfsHash,
        url: `https://ipfs.io/ipfs/${response.data.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
      };
    } catch (error) {
      console.error('Pinata upload failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload file to IPFS using Web3.Storage (Alternative)
   * Free tier: Unlimited storage
   * Docs: https://web3.storage/docs/
   */
  async uploadToWeb3Storage(fileBuffer, filename) {
    if (!this.web3StorageToken) {
      throw new Error('WEB3_STORAGE_TOKEN not configured');
    }

    try {
      const { File } = await import('web3.storage');
      const files = [new File([fileBuffer], filename)];

      const response = await axios.post(
        `${this.web3StorageUrl}/upload`,
        files,
        {
          headers: {
            'Authorization': `Bearer ${this.web3StorageToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const cid = response.data.cid;

      return {
        success: true,
        provider: 'web3.storage',
        ipfsHash: cid,
        url: `https://ipfs.io/ipfs/${cid}`,
        gatewayUrl: `https://w3s.link/ipfs/${cid}`,
      };
    } catch (error) {
      console.error('Web3.Storage upload failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload file to IPFS using NFT.Storage (Alternative)
   * Free tier: Unlimited storage for NFTs
   * Docs: https://nft.storage/docs/
   */
  async uploadToNFTStorage(fileBuffer, filename) {
    if (!this.nftStorageToken) {
      throw new Error('NFT_STORAGE_TOKEN not configured');
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, filename);

      const response = await axios.post(
        `${this.nftStorageUrl}/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.nftStorageToken}`,
          },
        }
      );

      const cid = response.data.value.cid;

      return {
        success: true,
        provider: 'nft.storage',
        ipfsHash: cid,
        url: `https://ipfs.io/ipfs/${cid}`,
        gatewayUrl: `https://nft.storage/ipfs/${cid}`,
      };
    } catch (error) {
      console.error('NFT.Storage upload failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload with automatic fallback
   * Tries providers in order: Tatum -> Pinata -> Web3.Storage -> NFT.Storage
   */
  async upload(fileBuffer, filename) {
    // Ensure settings are loaded from database/env
    await this.loadSettings();
    
    const providers = [
      { name: 'tatum', method: this.uploadToTatum.bind(this) },
      { name: 'pinata', method: this.uploadToPinata.bind(this) },
      { name: 'web3.storage', method: this.uploadToWeb3Storage.bind(this) },
      { name: 'nft.storage', method: this.uploadToNFTStorage.bind(this) },
    ];

    let lastError;

    for (const provider of providers) {
      try {
        console.log(`Attempting upload to ${provider.name}...`);
        const result = await provider.method(fileBuffer, filename);
        console.log(`Successfully uploaded to ${provider.name}`);
        return result;
      } catch (error) {
        console.log(`${provider.name} failed, trying next provider...`);
        lastError = error;
        continue;
      }
    }

    throw new Error(`All IPFS providers failed. Last error: ${lastError.message}`);
  }

  /**
   * Validate file before upload
   */
  validateFile(fileBuffer, maxSizeMB = 10) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File is empty');
    }

    if (fileBuffer.length > maxSizeBytes) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    return true;
  }

  /**
   * Get IPFS gateway URLs for a given hash
   */
  getGatewayUrls(ipfsHash) {
    return {
      ipfs: `https://ipfs.io/ipfs/${ipfsHash}`,
      pinata: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      infura: `https://infura-ipfs.io/ipfs/${ipfsHash}`,
      web3storage: `https://w3s.link/ipfs/${ipfsHash}`,
    };
  }
}

// Export singleton instance
const ipfsUploader = new IPFSUploader();

module.exports = {
  IPFSUploader,
  ipfsUploader,
  uploadToIPFS: (fileBuffer, filename) => ipfsUploader.upload(fileBuffer, filename),
  validateFile: (fileBuffer, maxSizeMB) => ipfsUploader.validateFile(fileBuffer, maxSizeMB),
  getGatewayUrls: (ipfsHash) => ipfsUploader.getGatewayUrls(ipfsHash),
};
