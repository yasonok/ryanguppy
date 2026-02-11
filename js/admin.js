// Supabase 配置 - 請 @Mars_yasonok_bot 填入正確的連接資訊
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
// 需要有寫入權限的 key，建議使用 service_role key

let supabase;
let isPreviewMode = false;

async function initAdmin() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.log('⚠️ Supabase 尚未設定，進入預覽模式');
        showPreviewMode();
        return false;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 載入商品列表
    await loadAdminProducts();
    
    // 訂閱即時更新
    subscribeToProducts();
    
    return true;
}

// 預覽模式
function showPreviewMode() {
    isPreviewMode = true;
    const container = document.getElementById('admin-table-container');
    container.innerHTML = `
        <div class="empty-admin">
            <h3>🔧 系統設定中</h3>
            <p>請 @Mars_yasonok_bot 設定 Supabase 連接資訊</p>
            <p style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                需要修改 js/app.js 和 js/admin.js 中的 SUPABASE_URL 和 SUPABASE_ANON_KEY
            </p>
        </div>
    `;
}

// 從 Supabase 載入商品列表
async function loadAdminProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderAdminTable(data || []);
    } catch (error) {
        console.error('載入商品失敗:', error);
        showAdminError(error);
    }
}

// 渲染管理表格
function renderAdminTable(products) {
    const container = document.getElementById('admin-table-container');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-admin">
                <h3>🐟 尚無商品</h3>
                <p>點擊「新增商品」開始上架！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>圖片</th>
                    <th>名稱</th>
                    <th>價格</th>
                    <th>庫存</th>
                    <th>狀態</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td>
                            <img src="${product.image_url || 'https://via.placeholder.com/60x60?text=No'}" 
                                 alt="${product.name}" 
                                 class="product-thumb"
                                 onerror="this.src='https://via.placeholder.com/60x60?text=No'">
                        </td>
                        <td>
                            <strong>${product.name}</strong>
                            ${product.type ? `<br><small style="color: #666;">${product.type}</small>` : ''}
                            ${product.gender ? `<br><small style="color: #666;">${product.gender}</small>` : ''}
                        </td>
                        <td>NT$ ${product.price.toLocaleString()}</td>
                        <td>${product.stock}</td>
                        <td>
                            <span class="status-badge status-${product.status}">
                                ${getStatusText(product.status)}
                            </span>
                        </td>
                        <td>
                            <div class="admin-actions">
                                <button class="btn-edit" onclick="openEditModal('${product.id}')">✏️ 編輯</button>
                                <button class="btn-delete" onclick="deleteProduct('${product.id}')">🗑️ 刪除</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// 狀態文字
function getStatusText(status) {
    const statusMap = {
        'available': '上架中',
        'sold': '已售出',
        'hold': '保留'
    };
    return statusMap[status] || status;
}

// 開啟新增 Modal
function openAddModal() {
    if (isPreviewMode) {
        alert('請先設定 Supabase 連接資訊！');
        return;
    }
    
    document.getElementById('modalTitle').textContent = '新增商品';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.add('active');
}

// 開啟編輯 Modal
async function openEditModal(id) {
    if (isPreviewMode) {
        alert('請先設定 Supabase 連接資訊！');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('modalTitle').textContent = '編輯商品';
        document.getElementById('productId').value = data.id;
        document.getElementById('productName').value = data.name || '';
        document.getElementById('productType').value = data.type || '';
        document.getElementById('productGender').value = data.gender || '';
        document.getElementById('productPrice').value = data.price || '';
        document.getElementById('productStock').value = data.stock || '';
        document.getElementById('productImage').value = data.image_url || '';
        document.getElementById('productStatus').value = data.status || 'available';
        document.getElementById('productNote').value = data.note || '';

        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('取得商品失敗:', error);
        alert('取得商品失敗！');
    }
}

// 關閉 Modal
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

// 儲存商品
async function saveProduct() {
    if (isPreviewMode) {
        alert('請先設定 Supabase 連接資訊！');
        return;
    }

    const productData = {
        name: document.getElementById('productName').value.trim(),
        type: document.getElementById('productType').value.trim(),
        gender: document.getElementById('productGender').value,
        price: parseInt(document.getElementById('productPrice').value) || 0,
        stock: parseInt(document.getElementById('productStock').value) || 0,
        image_url: document.getElementById('productImage').value.trim(),
        status: document.getElementById('productStatus').value,
        note: document.getElementById('productNote').value.trim()
    };

    if (!productData.name || !productData.price) {
        alert('請填寫商品名稱和價格！');
        return;
    }

    const productId = document.getElementById('productId').value;

    try {
        if (productId) {
            // 更新
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId);

            if (error) throw error;
            alert('✅ 商品更新成功！');
        } else {
            // 新增
            const { error } = await supabase
                .from('products')
                .insert([productData]);

            if (error) throw error;
            alert('✅ 商品新增成功！');
        }

        closeModal();
        await loadAdminProducts();
    } catch (error) {
        console.error('儲存失敗:', error);
        alert('儲存失敗：' + error.message);
    }
}

// 刪除商品
async function deleteProduct(id) {
    if (!confirm('確定要刪除這個商品嗎？')) return;

    if (isPreviewMode) {
        alert('請先設定 Supabase 連接資訊！');
        return;
    }

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('✅ 商品已刪除！');
        await loadAdminProducts();
    } catch (error) {
        console.error('刪除失敗:', error);
        alert('刪除失敗：' + error.message);
    }
}

// 同步到網站
function syncToWebsite() {
    alert('✅ 資料已儲存到 Supabase！\n\n顧客端會立即看到更新。\n\nVercel 會在 1-2 分鐘後自動部署。');
}

// 顯示錯誤
function showAdminError(error) {
    const container = document.getElementById('admin-table-container');
    container.innerHTML = `
        <div class="empty-admin">
            <h3>❌ 載入失敗</h3>
            <p>${error.message}</p>
            <p style="margin-top: 10px;">請檢查 Supabase 設定</p>
        </div>
    `;
}

// 訂閱即時更新
function subscribeToProducts() {
    if (isPreviewMode || !supabase) return;

    supabase
        .channel('admin-products-changes')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'products' 
        }, (payload) => {
            console.log('📦 商品更新:', payload);
            loadAdminProducts();
        })
        .subscribe((status) => {
            console.log('📡 訂閱狀態:', status);
        });
}

// 初始化
document.addEventListener('DOMContentLoaded', initAdmin);

// 匯出函數
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.syncToWebsite = syncToWebsite;
