// Supabase 配置 - 請 @Mars_yasonok_bot 填入正確的連接資訊
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// 購物車管理 (LocalStorage)
const Cart = {
    key: 'aquarium_cart',
    
    get() {
        return JSON.parse(localStorage.getItem(this.key) || '[]');
    },
    
    add(product, quantity = 1) {
        const cart = this.get();
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }
        localStorage.setItem(this.key, JSON.stringify(cart));
        this.updateCount();
        return cart;
    },
    
    remove(productId) {
        const cart = this.get().filter(item => item.id !== productId);
        localStorage.setItem(this.key, JSON.stringify(cart));
        this.updateCount();
        return cart;
    },
    
    clear() {
        localStorage.removeItem(this.key);
        this.updateCount();
    },
    
    updateCount() {
        const count = this.get().reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count') && (document.getElementById('cart-count').textContent = count);
    },
    
    get total() {
        return this.get().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
};

// 初始化 Supabase client
let supabase;

async function initSupabase() {
    if (typeof SUPABASE_URL !== 'string' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.log('⚠️ Supabase 尚未設定，顯示預覽模式');
        showPreviewMode();
        renderPreviewProducts();
        return false;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 訂閱即時更新
    subscribeToProducts();
    
    // 載入商品
    await loadProducts();
    
    // 更新購物車數量
    Cart.updateCount();
    
    return true;
}

// 預覽模式（Supabase 未設定時）- 顯示範例商品
function renderPreviewProducts() {
    const previewData = [
        { id: 1, name: '紅藍白子孔雀魚', type: '白子', gender: '公', price: 600, stock: 5, image_url: 'https://via.placeholder.com/400x300?text=Red+Blue+Albino', note: '熱銷中！' },
        { id: 2, name: '黃金扇尾', type: '扇尾', gender: '母', price: 450, stock: 3, image_url: 'https://via.placeholder.com/400x300?text=Golden+Fan', note: '繁殖專用' },
        { id: 3, name: '藍蛇紋孔雀', type: '蛇紋', gender: '對', price: 1200, stock: 2, image_url: 'https://via.placeholder.com/400x300?text=Blue+Snake', note: '限量販售' },
        { id: 4, name: '莫斯科藍', type: '藍色系', gender: '公', price: 800, stock: 8, image_url: 'https://via.placeholder.com/400x300?text=Moscow+Blue' },
        { id: 5, name: '紅禮服孔雀', type: '禮服', gender: '母', price: 550, stock: 0, image_url: 'https://via.placeholder.com/400x300?text=Red+Tuxedo', note: '已售完' },
    ];
    allProducts = previewData;
    renderProducts(previewData);
}

// 從 Supabase 載入商品
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = data || [];
        renderProducts(allProducts);
    } catch (error) {
        console.error('載入商品失敗:', error);
        showError();
    }
}

// 渲染商品列表
function renderProducts(products) {
    const container = document.getElementById('products-container');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🐟 暫無商品</h3>
                <p>敬請期待我們的孔雀魚！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" data-type="${product.type || ''}" data-gender="${product.gender || ''}">
            <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onclick="openLightbox('${product.image_url || ''}')"
                 onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta">
                    ${product.type ? `<span class="product-tag">${product.type}</span>` : ''}
                    ${product.gender ? `<span class="product-tag">${product.gender}</span>` : ''}
                </div>
                <div class="product-price">NT$ ${product.price.toLocaleString()}</div>
                <div class="product-stock ${getStockClass(product.stock)}">
                    庫存: ${product.stock} 隻
                </div>
                ${product.note ? `<p style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">${product.note}</p>` : ''}
                <div class="product-actions" style="display: flex; gap: 10px;">
                    <button class="btn-buy" style="flex: 1;" 
                            onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})"
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        🛒 加入購物車
                    </button>
                    <a href="https://line.me/ti/p/@yourlineid?text=${encodeURIComponent('我想購買：' + product.name)}" 
                       class="btn-buy" 
                       style="flex: 1; background: #28a745;"
                       target="_blank">
                        💬 聯繫購買
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// 開啟圖片燈箱
function openLightbox(imageUrl) {
    if (!imageUrl) return;
    document.getElementById('lightboxImg').src = imageUrl;
    document.getElementById('lightbox').classList.add('active');
}

// 關閉圖片燈箱
function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// 篩選功能
let allProducts = [];

function filterProducts() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const activeTag = document.querySelector('.filter-tag.active').dataset.filter;
    
    let filtered = allProducts.filter(product => {
        // 關鍵字搜尋
        const matchKeyword = !keyword || 
            product.name.toLowerCase().includes(keyword) ||
            (product.type && product.type.toLowerCase().includes(keyword)) ||
            (product.note && product.note.toLowerCase().includes(keyword));
        
        // 標籤篩選
        let matchTag = true;
        if (activeTag !== 'all') {
            const [field, value] = activeTag.split(':');
            if (field === 'type') {
                matchTag = product.type === value || product.gender === value;
            }
        }
        
        return matchKeyword && matchTag;
    });
    
    renderProducts(filtered);
}

// 初始化篩選標籤
document.addEventListener('DOMContentLoaded', () => {
    // 篩選標籤點擊
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts();
        });
    });
});

// 加入購物車
function addToCart(product) {
    if (product.stock <= 0) {
        alert('抱歉，此商品已售完！');
        return;
    }
    
    Cart.add(product, 1);
    showToast(`✅ 已將「${product.name}」加入購物車！`);
    
    // 更新顯示
    if (typeof loadProducts === 'function') {
        loadProducts();
    }
}

// 顯示提示訊息
function showToast(message) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 9999;
        animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 庫存狀態樣式
function getStockClass(stock) {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 3) return 'low-stock';
    return 'in-stock';
}

// 顯示錯誤
function showError() {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <div class="empty-state">
            <h3>❌ 載入失敗</h3>
            <p>請稍後再試，或聯繫管理員</p>
        </div>
    `;
}

// 訂閱 Supabase 即時更新
function subscribeToProducts() {
    if (!supabase) return;

    supabase
        .channel('products-changes')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'products' 
        }, (payload) => {
            console.log('📦 商品更新:', payload);
            // 重新載入商品列表
            loadProducts();
        })
        .subscribe((status) => {
            console.log('📡 訂閱狀態:', status);
        });
}

// 開啟購物車
function openCart() {
    renderCart();
    document.getElementById('cartModal').classList.add('active');
}

// 關閉購物車
function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
}

// 渲染購物車
function renderCart() {
    const cart = Cart.get();
    const body = document.getElementById('cartBody');
    const total = Cart.total;
    
    document.getElementById('cartTotal').textContent = `NT$ ${total.toLocaleString()}`;
    
    if (cart.length === 0) {
        body.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-light);">
                <p style="font-size: 3rem; margin-bottom: 15px;">🛒</p>
                <p>購物車是空的</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">去看看我們的孔雀魚吧！</p>
            </div>
        `;
        document.getElementById('checkoutBtn').style.display = 'none';
        return;
    }
    
    document.getElementById('checkoutBtn').style.display = 'block';
    
    body.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url || 'https://via.placeholder.com/60x60?text=No'}" 
                 alt="${item.name}" 
                 class="cart-item-image"
                 onerror="this.src='https://via.placeholder.com/60x60?text=No'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">NT$ ${item.price.toLocaleString()}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
        </div>
    `).join('');
}

// 更新購物車數量
function updateCartQty(productId, delta) {
    const cart = Cart.get();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            Cart.remove(productId);
        } else {
            localStorage.setItem(Cart.key, JSON.stringify(cart));
        }
    }
    Cart.updateCount();
    renderCart();
}

// 移除商品
function removeFromCart(productId) {
    Cart.remove(productId);
    showToast('已移除商品');
    Cart.updateCount();
    renderCart();
}

// 手機選單
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // 點擊背景關閉購物車
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('cartModal')) {
            closeCart();
        }
    });
});

// 匯出函數供其他模組使用
window.initSupabase = initSupabase;
window.loadProducts = loadProducts;
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
