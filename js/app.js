// Supabase 配置 - 請 @Mars_yasonok_bot 填入正確的連接資訊
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// 初始化 Supabase client
let supabase;

async function initSupabase() {
    if (typeof SUPABASE_URL !== 'string' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.log('⚠️ Supabase 尚未設定，顯示預覽模式');
        showPreviewMode();
        return false;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 訂閱即時更新
    subscribeToProducts();
    
    // 載入商品
    await loadProducts();
    
    return true;
}

// 預覽模式（Supabase 未設定時）
function showPreviewMode() {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <div class="empty-state">
            <h3>🔧 系統設定中</h3>
            <p>後台管理員正在設定資料庫，請稍後再來！</p>
            <p style="margin-top: 10px; font-size: 0.9rem;">如需管理商品，請前往 <a href="admin.html">管理後台</a></p>
        </div>
    `;
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

        renderProducts(data || []);
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
        <div class="product-card">
            <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                 alt="${product.name}" 
                 class="product-image"
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
                <a href="https://line.me/ti/p/@yourlineid?text=${encodeURIComponent('我想購買：' + product.name)}" 
                   class="btn-buy" 
                   target="_blank">
                    💬 聯繫購買
                </a>
            </div>
        </div>
    `).join('');
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
});

// 匯出函數供其他模組使用
window.initSupabase = initSupabase;
window.loadProducts = loadProducts;
