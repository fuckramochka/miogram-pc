/**
 * MiogramCloudVaultFile: Model representing a virtual file stored in the encrypted Miogram Cloud Vault.
 * Ported 1:1 from app.miogram.bridge.cloudvault.MiogramCloudVaultFile.java.
 */

export class MiogramCloudVaultFile {
  public fileId = '';
  public name = '';
  public totalSize = 0;
  public mimeType = '';
  public chunksCount = 1;
  public chunkSize = 100 * 1024 * 1024; // 100MB default
  public sha256 = '';
  public topicId = 0;
  public topicName = '';
  public date = Math.floor(Date.now() / 1000);
  public chunkMsgIds: number[] = [];
  public chunkDocIds: string[] = [];

  public isDownloading = false;
  public downloadProgress = 0;
  public isUploading = false;
  public uploadProgress = 0;

  constructor(init?: Partial<MiogramCloudVaultFile>) {
    if (init) Object.assign(this, init);
  }

  public getFormattedSize(): string {
    const bytes = this.totalSize;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  public getFileExtension(): string {
    if (!this.name) return '';
    const idx = this.name.lastIndexOf('.');
    if (idx > 0 && idx < this.name.length - 1) {
      return this.name.substring(idx + 1).toLowerCase();
    }
    return '';
  }

  public isMedia(): boolean {
    const ext = this.getFileExtension();
    return ['mp4', 'mkv', 'avi', 'mov', 'webm', 'jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  }

  public isAudio(): boolean {
    const ext = this.getFileExtension();
    return ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'opus', 'aac'].includes(ext);
  }

  public toJson(): Record<string, any> {
    return {
      v: 1,
      fileId: this.fileId,
      name: this.name,
      size: this.totalSize,
      mime: this.mimeType,
      chunks: this.chunksCount,
      chunkSize: this.chunkSize,
      sha256: this.sha256,
      topicId: this.topicId,
      topicName: this.topicName,
      date: this.date,
      chunkMsgIds: this.chunkMsgIds,
      chunkDocIds: this.chunkDocIds,
    };
  }

  public static fromJson(obj: any): MiogramCloudVaultFile | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const file = new MiogramCloudVaultFile();
    file.fileId = String(obj.fileId || '');
    file.name = String(obj.name || 'Untitled');
    file.totalSize = Number(obj.size || 0);
    file.mimeType = String(obj.mime || '');
    file.chunksCount = Number(obj.chunks || 1);
    file.chunkSize = Number(obj.chunkSize || 100 * 1024 * 1024);
    file.sha256 = String(obj.sha256 || '');
    file.topicId = Number(obj.topicId || 0);
    file.topicName = String(obj.topicName || '');
    file.date = Number(obj.date || Math.floor(Date.now() / 1000));
    file.chunkMsgIds = Array.isArray(obj.chunkMsgIds) ? obj.chunkMsgIds.map(Number) : [];
    file.chunkDocIds = Array.isArray(obj.chunkDocIds) ? obj.chunkDocIds.map(String) : [];
    return file;
  }
}

export default MiogramCloudVaultFile;
