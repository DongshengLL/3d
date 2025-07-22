import * as THREE from 'three';

const colors = [
    "rgb(216, 27, 67)", "rgb(142, 36, 170)", "rgb(81, 45, 168)", "rgb(48, 63, 159)", "rgb(30, 136, 229)", "rgb(0, 137, 123)",
    "rgb(67, 160, 71)", "rgb(251, 192, 45)", "rgb(245, 124, 0)", "rgb(230, 74, 25)", "rgb(233, 30, 78)", "rgb(156, 39, 176)",
    "rgb(0, 0, 0)", "rgb(255, 255, 255)", "rgb(128, 128, 128)"
];

const genColor = (scene) => {
    const container = document.getElementById('color-container');
    if (!container) return;

    // 添加标题
    const title = document.createElement('div');
    title.textContent = '颜色';
    title.style.cssText = 'color: #333; font-size: 14px; font-weight: bold; margin-bottom: 10px; text-align: center;';
    container.appendChild(title);

    colors.forEach((color) => {
        const item = document.createElement('div');
        item.style.cssText = `
            width: 35px; height: 35px; margin: 5px; border-radius: 50%; 
            background-color: ${color}; cursor: pointer; border: 2px solid #fff; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease; display: inline-block;
        `;

        item.addEventListener('mouseenter', () => {
            item.style.transform = 'scale(1.1)';
            item.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
            item.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        item.addEventListener('click', () => {
            // 清除其他选中状态
            container.querySelectorAll('div[style*="border-radius: 50%"]').forEach(el => {
                (el as HTMLElement).style.border = '2px solid #fff';
            });

            // 设置当前选中状态
            item.style.border = '3px solid #333';

            // 应用颜色到模型
            scene.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    if (child.name === 'ground') return;
                     child.material.color.set(color);
                }
            });
        });

        container.appendChild(item);
    });
}

export default genColor;
