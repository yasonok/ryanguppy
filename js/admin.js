// Supabase 配置 - 請 @Mars_yasonok_bot 填入正確的連接資訊
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase;
let isPreviewMode = false;
let allProducts = [];
let allOrders = [];

// 初始化
async function initAdmin() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.log('⚠️ Supabase 尚未設定，進入預覽模式');
        showPreviewMode();
        loadPreviewData();
        return false;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 載入資料
    await Promise.all([
        loadAdminProducts(),
        loadOrders()
    ]);
    
    // 訂閱即時更新
    subscribeToProducts();
    
    return true;
}

// 預覽模式
function showPreviewMode() {
    isPreviewMode = true;
    document.getElementById('setupNotice').style.display = 'block';
    showToast('⚠️ 預覽模式 - 請設定 Supabase', 'warning');
}

// 載入預覽資料
function loadPreviewData() {
    allProducts = [
        { id: 1, name: '紅藍白子孔雀魚', type: '白子', gender: '公', price: 600, stock: 5, status: 'available', note: '熱銷中！', image_url: '' },
        { id: 2, name: '黃金扇尾', type: '扇尾', gender: '母', price: 450, stock: 3, status: 'available', note: '繁殖專用', image_url: '' },
        { id: 3, name: '藍蛇紋孔雀', type: '蛇紋', gender: '對', price: 1200, stock: 2, status: 'available', note: '限量販售', image_url: '' },
        { id: 4, name: '莫斯科藍', type: '藍色系', gender: '公', price: 800, stock: 8, status: 'available', note: '', image_url: '' },
        { id: 5, name: '紅禮服孔雀', type: '禮服', gender: '母', price: 550, stock: 0, status: 'sold', note: '已售完', image_url: '' },
    ];
    allOrders = [];
    renderProducts();
    updateStats();
}

// 從 Supabase 載入商品
async function loadAdminProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = data || [];
        renderProducts();
        updateStats();
    } catch (error) {
        console.error('載入商品失敗:', error);
        showToast('❌ 載入商品失敗: ' + error.message, 'error');
    }
}

// 載入訂單
async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allOrders = data || [];
        updateStats();
    } catch (error) {
        console.error('載入訂單失敗:', error);
    }
}

// 渲染商品列表
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!allProducts || allProducts.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = allProducts.map(product => `
        <tr>
            <td>
                <img src="${product.image_url || 'https://via.placeholder.com/60x60?text=🐟'}" 
                     alt="${product.name}" 
                     class="product-thumb"
                     onerror="this.src='https://via.placeholder.com/60x60?text=🐟'">
            </td>
            <td>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">
                        ${product.type ? product.type + ' | ' : ''}${product.gender || ''}
                        ${product.note ? '<br><span style="color: #888;">' + product.note + '</span>' : ''}
                    </div>
                </div>
            </td>
            <td class="price">NT$ ${product.price.toLocaleString()}</td>
            <td>
                <span class="${product.stock <= 0 ? 'text-danger' : product.stock <= 3 ? 'text-warning' : ''}">
                    ${product.stock} 隻
                </span>
            </td>
            <td>
                <span class="status-badge status-${product.status}">
                    ${getStatusText(product.status)}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" onclick="openEditModal('${product.id}')" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}')" title="刪除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 更新統計
function updateStats() {
    // 商品數量
    document.getElementById('statProducts').textContent = allProducts.length;
    
    // 總庫存
    const totalStock = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    document.getElementById('statStock').textContent = totalStock + ' 隻';
    
    // 訂單數量
    document.getElementById('statOrders').textContent = allOrders.length;
    
    // 銷售金額
    const totalRevenue = allOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    document.getElementById('statRevenue').textContent = 'NT$ ' + totalRevenue.toLocaleString();
}

// 篩選商品
function filterProducts() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allProducts.filter(product => {
        return !keyword || 
            product.name.toLowerCase().includes(keyword) ||
            (product.type && product.type.toLowerCase().includes(keyword)) ||
            (product.note && product.note.toLowerCase().includes(keyword));
    });
    
    // 暫時保存並渲染
    const temp = allProducts;
    allProducts = filtered;
    renderProducts();
    allProducts = temp;
}

// 狀態文字
function getStatusText(status) {
    const statusMap = {
        'available': '上架中',
        'sold': '已售出',
        'hold': '保留',
        'pending': '待處理',
        'confirmed': '已確認',
        'shipped': '已出貨',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 開啟新增 Modal
function openAddModal() {
    if (isPreviewMode) {
        showToast('⚠️ 預覽模式無法儲存，請設定 Supabase', 'warning');
    }
    
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> 新增商品';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.querySelector('.image-preview').classList.remove('has-image');
    document.getElementById('productModal').classList.add('active');
}

// 開啟編輯 Modal
async function openEditModal(id) {
    if (isPreviewMode) {
        showToast('⚠️ 預覽模式無法儲存，請設定 Supabase', 'warning');
    }
    
    try {
        let product;
        if (isPreviewMode) {
            product = allProducts.find(p => p.id == id);
        } else {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            product = data;
        }

        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> 編輯商品';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productType').value = product.type || '';
        document.getElementById('productGender').value = product.gender || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productImage').value = product.image_url || '';
        document.getElementById('productStatus').value = product.status || 'available';
        document.getElementById('productNote').value = product.note || '';
        
        if (product.image_url) {
            document.getElementById('imagePreview').src = product.image_url;
            document.querySelector('.image-preview').classList.add('has-image');
        }

        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('取得商品失敗:', error);
        showToast('❌ 取得商品失敗！', 'error');
    }
}

// 關閉 Modal
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

// 儲存商品
async function saveProduct() {
    if (isPreviewMode) {
        showToast('⚠️ 預覽模式無法儲存，請設定 Supabase', 'warning');
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
        showToast('❌ 請填寫商品名稱和價格！', 'error');
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
            showToast('✅ 商品更新成功！', 'success');
        } else {
            // 新增
            const { error } = await supabase
                .from('products')
                .insert([productData]);

            if (error) throw error;
            showToast('✅ 商品新增成功！', 'success');
        }

        closeModal();
        await loadAdminProducts();
    } catch (error) {
        console.error('儲存失敗:', error);
        showToast('❌ 儲存失敗：' + error.message, 'error');
    }
}

// 刪除商品
async function deleteProduct(id) {
    if (!confirm('確定要刪除這個商品嗎？\n此動作無法復原！')) return;

    if (isPreviewMode) {
        showToast('⚠️ 預覽模式無法刪除，請設定 Supabase', 'warning');
        return;
    }

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('✅ 商品已刪除！', 'success');
        await loadAdminProducts();
    } catch (error) {
        console.error('刪除失敗:', error);
        showToast('❌ 刪除失敗：' + error.message, 'error');
    }
}

// 同步提示
function syncToWebsite() {
    if (isPreviewMode) {
        showToast('⚠️ 預覽模式 - 請先設定 Supabase', 'warning');
        return;
    }
    
    showToast('✅ 資料已同步到網站！', 'success');
}

// 顯示 Toast
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
window.filterProducts = filterProducts;
window.previewImage = previewImage;
window.showToast = showToast;