let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let editId = null;

let $ = id => document.getElementById(id);
let today = () => new Date().toISOString().split('T')[0];

$('dateInput').value = today();

function getForm() {
    return {
        desc: $('descInput').value.trim(),
        amount: parseFloat($('amountInput').value),
        category: $('categoryInput').value,
        date: $('dateInput').value
    };
}

function setForm(exp) {
    $('descInput').value = exp ? exp.desc : '';
    $('amountInput').value = exp ? exp.amount : '';
    $('categoryInput').value = exp ? exp.category : '';
    $('dateInput').value = exp ? exp.date : today();
}

function saveExpense() {
    let form = getForm();
    if (!form.desc || !form.amount || !form.date) {
        alert('Please fill all fields');
        return;
    }

    if (editId) {
        let idx = expenses.findIndex(e => e.id === editId);
        expenses[idx] = { id: editId, ...form };
        editId = null;
    } else {
        expenses.push({ id: Date.now(), ...form });
    }

    localStorage.setItem('expenses', JSON.stringify(expenses));
    setForm();
    $('formTitle').textContent = 'Add Expense';
    $('cancelBtn').style.display = 'none';
    render();
}

function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    render();
}

function editExpense(id) {
    let exp = expenses.find(e => e.id === id);
    setForm(exp);
    editId = id;
    $('formTitle').textContent = 'Edit Expense';
    $('cancelBtn').style.display = 'block';
}

function cancelEdit() {
    editId = null;
    $('formTitle').textContent = 'Add Expense';
    $('cancelBtn').style.display = 'none';
    setForm();
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    let isDark = document.body.classList.contains('dark');
    $('themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    $('themeBtn').textContent = '☀️';
}

function render() {
    let total = expenses.reduce((sum, e) => sum + e.amount, 0);
    let now = new Date();
    let monthTotal = expenses
        .filter(e => {
            let d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);

    $('totalAmount').textContent = '₹' + total;
    $('monthAmount').textContent = '₹' + monthTotal;
    $('totalEntries').textContent = expenses.length;

    renderList();
    drawPieChart();
    drawBarChart();
}

function renderList() {
    let list = $('expenseList');
    list.innerHTML = '';

    [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(e => {
            let div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <div class="expense-info">
                    <h4>${e.desc}</h4>
                    <p>${e.category} • ${e.date}</p>
                </div>
                <div style="display:flex;align-items:center">
                    <span class="expense-amount">₹${e.amount}</span>
                    <div class="expense-actions">
                        <button onclick="editExpense(${e.id})">✏️</button>
                        <button onclick="deleteExpense(${e.id})">🗑️</button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
}

let catColors = {
    Food: '#e94560', Travel: '#0f3460', Rent: '#533483',
    Shopping: '#e9a045', Bills: '#45e9a0', Other: '#4560e9'
};

function drawPieChart() {
    let canvas = $('chart');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 300, 300);

    let totals = {};
    expenses.forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
    
    let keys = Object.keys(totals);
    let values = Object.values(totals);
    let sum = values.reduce((a, b) => a + b, 0);

    if (sum === 0) {
        ctx.fillStyle = '#ccc';
        ctx.font = '14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', 150, 150);
        $('chartLegend').innerHTML = '';
        return;
    }

    let start = 0, cx = 150, cy = 150, r = 120;
    keys.forEach((key, i) => {
        let slice = (values[i] / sum) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, start + slice);
        ctx.fillStyle = catColors[key] || '#999';
        ctx.fill();
        start += slice;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains('dark') ? '#16213e' : 'white';
    ctx.fill();

    $('chartLegend').innerHTML = keys.map(k => 
        `<span><span class="legend-color" style="background:${catColors[k] || '#999'}"></span>${k}: ₹${totals[k]}</span>`
    ).join('');
}

function drawBarChart() {
    let container = $('barChart');
    container.innerHTML = '';

    let monthly = {};
    expenses.forEach(e => {
        let d = new Date(e.date);
        let key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        monthly[key] = (monthly[key] || 0) + e.amount;
    });

    let keys = Object.keys(monthly).sort().slice(-6);
    let values = keys.map(k => monthly[k]);
    let max = Math.max(...values, 1);
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    if (keys.length === 0) {
        container.innerHTML = '<p style="color:#888;font-size:0.9rem">No data yet</p>';
        return;
    }

    keys.forEach((k, i) => {
        let h = (values[i] / max) * 160;
        let label = months[parseInt(k.split('-')[1]) - 1];
        let wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.innerHTML = `
            <span class="bar-value">₹${values[i]}</span>
            <div class="bar" style="height:${h}px"></div>
            <span class="bar-label">${label}</span>
        `;
        container.appendChild(wrapper);
    });
}

render();
