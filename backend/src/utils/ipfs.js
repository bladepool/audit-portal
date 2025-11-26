const axios = require('axios');
const FormData = require('form-data');

/**
 * IPFS Upload Utilities
 * Supports multiple free IPFS providers:
 * 1. Tatum (Primary) - 50MB/month free
 * 2. Pinata (Fallback) - 1GB free
 * 3. Web3.Storage (Alternative) - Free unlimited
 */

class IPFSUploader {
  constructor() {
    // Tatum API Configuration
    this.tatumApiKey = process.env.TATUM_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3/ipfs';
    
    // Pinata API Configuration (fallback)
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.pinataBaseUrl = 'https://api.pinata.cloud';
    
    // Web3.Storage Configuration (alternative)
    this.web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
    this.web3StorageUrl = 'https://api.web3.storage';
    
    // NFT.Storage Configuration (alternative)
    this.nftStorageToken = process.env.NFT_STORAGE_TOKEN;
    this.nftStorageUrl = 'https://api.nft.storage';
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
   */
  async uploadToPinata(fileBuffer, filename) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('PINATA_API_KEY and PINATA_SECRET_KEY not configured');
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

      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
          },
        }
      );

      return {
        success: true,
        provider: 'pinata',
        ipfsHash: response.data.IpfsHash,
        url: `https://ipfs.io/ipfs/${response.data.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        pinSize: response.data.PinSize,
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
