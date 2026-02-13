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
                    <a href="https://line.me/ti/p/tsAGZrm9vt?text=${encodeURIComponent('我想購買：' + product.name)}" 
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

// 結帳功能 - Email / LINE
function showCheckoutForm() {
    const cart = Cart.get();
    if (cart.length === 0) {
        alert('購物車是空的！');
        return;
    }

    // 生成訂單摘要
    let orderItems = cart.map(item => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">NT$ ${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
    `).join('');

    let orderSummary = cart.map(item => 
        `- ${item.name} x${item.quantity} = NT$ ${item.price * item.quantity}`
    ).join('%0D%0A');

    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>📦 填寫訂單資料</h2>
                <button class="modal-close" onclick="closeCheckoutForm()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="checkoutForm" onsubmit="submitOrder(event)">
                    <div class="form-group">
                        <label>姓名 *</label>
                        <input type="text" id="customerName" required placeholder="請輸入姓名">
                    </div>
                    <div class="form-group">
                        <label>電話 *</label>
                        <input type="tel" id="customerPhone" required placeholder="09xx-xxx-xxx">
                    </div>
                    <div class="form-group">
                        <label>LINE ID</label>
                        <input type="text" id="customerLine" placeholder="方便聯繫用">
                    </div>
                    <div class="form-group">
                        <label>配送地址 *</label>
                        <input type="text" id="shippingAddress" required placeholder="完整地址">
                    </div>
                    <div class="form-group">
                        <label>備註</label>
                        <textarea id="orderNote" rows="2" placeholder="特殊需求"></textarea>
                    </div>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px;">📋 訂單摘要</h4>
                        ${cart.map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${item.name} x${item.quantity}</span>
                                <span>NT$ ${(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        `).join('')}
                        <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem;">
                            <span>總計</span>
                            <span style="color: var(--accent-color);">NT$ ${Cart.total.toLocaleString()}</span>
                        </div>
                    </div>

                    <button type="submit" class="btn-save" style="width: 100%; margin-bottom: 10px;">📤 提交訂單</button>
                </form>

                <div style="text-align: center; margin-top: 15px;">
                    <p style="color: #666; margin-bottom: 10px;">或透過通訊軟體聯繫：</p>
                    <div style="display: flex; gap: 10px;">
                        <a href="https://line.me/ti/p/tsAGZrm9vt?text=${encodeURIComponent('我想購買孔雀魚，訂單資訊如下：\n\n' + cart.map(item => item.name + ' x' + item.quantity).join('\n') + '\n\n總計：NT$' + Cart.total.toLocaleString())}" 
                           style="flex: 1; padding: 12px; background: #06C755; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center;"
                           target="_blank">
                            💬 LINE 聯繫
                        </a>
                        <a href="mailto:your@email.com?subject=訂購孔雀魚&body=${encodeURIComponent('訂單資訊：\n\n' + cart.map(item => item.name + ' x' + item.quantity + ' = NT$' + (item.price * item.quantity)).join('\n') + '\n\n總計：NT$' + Cart.total.toLocaleString() + '\n\n姓名：\n電話：\n地址：')}" 
                           style="flex: 1; padding: 12px; background: #4285F4; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center;">
                            📧 Email
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeCheckoutForm() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.remove();
}

async function submitOrder(event) {
    event.preventDefault();

    const orderData = {
        customer_name: document.getElementById('customerName').value.trim(),
        customer_phone: document.getElementById('customerPhone').value.trim(),
        customer_line_id: document.getElementById('customerLine').value.trim(),
        shipping_address: document.getElementById('shippingAddress').value.trim(),
        total_amount: Cart.total,
        note: document.getElementById('orderNote').value.trim(),
        status: 'pending'
    };

    // 儲存到 Supabase（如果已設定）
    if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData]);

            if (error) throw error;

            // 也儲存訂單項目
            const cart = Cart.get();
            const orderItems = cart.map(item => ({
                order_id: data[0].id,
                product_id: item.id,
                product_name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            }));

            await supabase.from('order_items').insert(orderItems);

            alert('✅ 訂單已提交！我們會盡快與您聯繫。');
            Cart.clear();
            closeCheckoutForm();

        } catch (error) {
            console.error('儲存訂單失敗:', error);
            alert('❌ 訂單提交失敗，請用 LINE 或 Email 聯繫我們');
        }
    } else {
        // 預覽模式：生成 Email 連結
        const subject = encodeURIComponent('【Aquarium Studio】訂單提交');
        const body = encodeURIComponent(
            `訂單資訊已提交，以下是我的訂單：\n\n` +
            `姓名：${orderData.customer_name}\n` +
            `電話：${orderData.customer_phone}\n` +
            `LINE：${orderData.customer_line_id || '無'}\n` +
            `地址：${orderData.shipping_address}\n` +
            `備註：${orderData.note || '無'}\n\n` +
            `--- 商品 ---\n` +
            Cart.get().map(item => `${item.name} x${item.quantity} = NT$ ${item.price * item.quantity}`).join('\n') +
            `\n\n總計：NT$ ${Cart.total.toLocaleString()}`
        );
        
        window.location.href = `mailto:your@email.com?subject=${subject}&body=${body}`;
        showToast('✅ 請發送 Email 完成訂單！');
        Cart.clear();
        closeCheckoutForm();
    }
}
