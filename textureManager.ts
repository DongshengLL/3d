import * as THREE from 'three';

export class TextureManager {
    private textures = new Map();
    private currentTextureId = null;
    private scene;
    private textureListElement;
    private uploadArea;
    private fileInput;

    constructor(scene) {
        this.scene = scene;
        this.textureListElement = document.getElementById('texture-list');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        
        this.initEvents();
    }

    private initEvents() {
        // 文件选择
        this.fileInput.addEventListener('change', (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // 点击上传
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
    }

    private async handleFile(file) {
        if (file.type.startsWith('image/')) {
            await this.addTexture(file);
        }
    }

    private async addTexture(file) {
        try {
            const id = Date.now().toString();
            const texture = await this.loadTexture(file);
            const preview = await this.createPreview(file);
            
            // 清除之前的贴图
            this.clearAll();
            
            this.textures.set(id, {
                id,
                name: file.name,
                texture,
                preview,
                size: this.formatSize(file.size)
            });
            
            this.renderList();
            this.applyTexture(id);
        } catch (error) {
            console.error('加载贴图失败:', error);
            alert(`无法加载贴图 ${file.name}`);
        }
    }

    private loadTexture(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const texture = new THREE.Texture(img);
                    texture.needsUpdate = true;
                    
                    // 设置贴图重复
                    // texture.wrapS = THREE.RepeatWrapping;
                    // texture.wrapT = THREE.RepeatWrapping;
                    
                    resolve(texture);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private createPreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
    }

    private formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    private renderList() {
        this.textureListElement.innerHTML = '';
        
        this.textures.forEach((item) => {
            const element = document.createElement('div');
            element.className = `texture-item ${item.id === this.currentTextureId ? 'active' : ''}`;
            element.innerHTML = `
                <img src="${item.preview}" class="texture-preview" alt="${item.name}">
                <div class="texture-info">
                    <div class="texture-name">${item.name}</div>
                    <div class="texture-size">${item.size}</div>
                </div>
                <button class="remove-texture">×</button>
            `;

            // 点击应用贴图
            element.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).classList.contains('remove-texture')) {
                    this.applyTexture(item.id);
                }
            });

            // 删除贴图
            const removeBtn = element.querySelector('.remove-texture');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeTexture(item.id);
                });
            }

            this.textureListElement.appendChild(element);
        });
    }

    private applyTexture(id) {
        const item = this.textures.get(id);
        if (!item) return;

        this.currentTextureId = id;
        
        // 应用到模型
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                // 跳过地板
                if (child.name === 'ground' || child.position.y < 0) return;
                
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.map !== undefined) {
                            mat.map = item.texture;
                            mat.needsUpdate = true;
                        }
                    });
                } else {
                    if (child.material.map !== undefined) {
                        child.material.map = item.texture;
                        child.material.needsUpdate = true;
                    }
                }
            }
        });

        this.renderList();
    }

    // 设置贴图缩放
    public setTextureScale(scaleX = 1, scaleY = 1) {
        if (this.currentTextureId) {
            const item = this.textures.get(this.currentTextureId);
            if (item && item.texture) {
                item.texture.repeat.set(scaleX, scaleY);
                item.texture.needsUpdate = true;
            }
        }
    }

    // 设置贴图偏移
    public setTextureOffset(offsetX = 0, offsetY = 0) {
        if (this.currentTextureId) {
            const item = this.textures.get(this.currentTextureId);
            if (item && item.texture) {
                item.texture.offset.set(offsetX, offsetY);
                item.texture.needsUpdate = true;
            }
        }
    }

    // 设置贴图旋转
    public setTextureRotation(rotation = 0) {
        if (this.currentTextureId) {
            const item = this.textures.get(this.currentTextureId);
            if (item && item.texture) {
                item.texture.rotation = rotation;
                item.texture.needsUpdate = true;
            }
        }
    }

    // 重置贴图变换
    public resetTextureTransform() {
        this.setTextureScale(1, 1);
        this.setTextureOffset(0, 0);
        this.setTextureRotation(0);
    }

    private removeTexture(id) {
        const item = this.textures.get(id);
        if (!item) return;

        item.texture.dispose();
        
        if (id === this.currentTextureId) {
            this.clearModelTextures();
            this.currentTextureId = null;
        }

        this.textures.delete(id);
        this.renderList();
    }

    private clearModelTextures() {
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                if (child.name === 'ground' || child.position.y < 0) return;
                
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.map !== undefined) {
                            mat.map = null;
                            mat.needsUpdate = true;
                        }
                    });
                } else {
                    if (child.material.map !== undefined) {
                        child.material.map = null;
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
    }

    public clearAll() {
        this.textures.forEach(item => item.texture.dispose());
        this.textures.clear();
        this.currentTextureId = null;
        this.clearModelTextures();
        this.renderList();
    }
}

export default TextureManager; 