// ── NAV ──
function navBar() {
    document.getElementById('navBar').innerHTML = `
        <a href="index.html">🏠 Home</a>
        <a href="filter.html">🔍 Filter</a>
        <a href="charts.html">📊 Charts</a>
        <a href="about.html">ℹ️ About</a>
    `
}

// ── STORAGE ──
function setExpensesData(expensesData) {
    localStorage.setItem('ExpensesData', JSON.stringify(expensesData))
}

function getExpensesData() {
    return JSON.parse(localStorage.getItem('ExpensesData')) || []
}

// ── ADD / UPDATE ──
function addExpenseToData() {
    const expensesData = getExpensesData()
    const type        = document.getElementById('type').value
    const description = document.getElementById('description').value
    const cost        = document.getElementById('cost').value
    const date        = document.getElementById('date').value
    const isUpdate    = document.getElementById('isUpdate').value
    const localId     = +document.getElementById('id').value

    if (isUpdate === 'false') {
        expensesData.push({ type, description, cost: +cost, date, id: expensesData.length + 1 })
    } else {
        for (const expense of expensesData) {
            if (expense.id === localId) {
                expense.type        = type
                expense.description = description
                expense.cost        = +cost
                expense.date        = date
            }
        }
        document.getElementById('isUpdate').value = 'false'
        document.getElementById('submit').innerHTML = '➕ Submit'
    }
    setExpensesData(expensesData)
}

// ── TABLE ──
function syncDataToTable(doc, data) {
    const expensesData = data || getExpensesData()
    let HTMLString = ''

    if (expensesData.length === 0) {
        HTMLString = `<tr><td colspan="5" style="color:#999; font-style:italic;">No expenses found.</td></tr>`
    }

    for (const expense of expensesData) {
        HTMLString += `<tr>
            <td>${expense.type}</td>
            <td>${expense.description || '—'}</td>
            <td>$${expense.cost}</td>
            <td>${expense.date}</td>
            <td>
                <button onclick="updateExpense(${expense.id})">✏️ Edit</button>
                <button onclick="deleteExpense(${expense.id})" style="background:#e53935;">🗑️ Delete</button>
            </td>
        </tr>`
    }

    if (window.location.pathname.endsWith(doc)) {
        document.getElementById('tbody').innerHTML = HTMLString
    }
}

// ── DELETE ──
function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    let expensesData = getExpensesData()
    expensesData = expensesData.filter(expense => expense.id !== id)
    setExpensesData(expensesData)
    syncDataToTable('index.html')
}

// ── EDIT ──
function updateExpense(id) {
    document.getElementById('isUpdate').value = 'true'
    document.getElementById('id').value = id
    const expensesData = getExpensesData()
    for (const expense of expensesData) {
        if (expense.id === id) {
            document.getElementById('type').value        = expense.type
            document.getElementById('description').value = expense.description
            document.getElementById('cost').value        = expense.cost
            document.getElementById('date').value        = expense.date
            document.getElementById('submit').innerHTML  = '💾 Update'
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── FORM SUBMIT ──
function expensesFormFunc(event) {
    event.preventDefault()

    if (document.getElementById('type').value === 'other') {
        if (!document.getElementById('description').value.trim()) {
            alert('Please add a description when selecting "Other".')
            return
        }
    }

    const cost = +document.getElementById('cost').value
    if (cost <= 0 || cost > 100000) {
        alert('Cost must be between 1 and 100,000.')
        return
    }

    if (new Date(document.getElementById('date').value) > new Date()) {
        alert('Date cannot be in the future.')
        return
    }

    addExpenseToData()
    syncDataToTable('index.html')
    event.target.reset()
}

// ── FILTER PAGE ──
function setSelecter() {
    const yearSelect  = document.getElementById('year')
    const monthSelect = document.getElementById('month')
    const daySelect   = document.getElementById('day')

    yearSelect.innerHTML  = `<option selected value="">Year</option>`
    monthSelect.innerHTML = `<option selected value="">Month</option>`
    daySelect.innerHTML   = `<option selected value="">Day</option>`

    for (let i = 2020; i < 2027; i++)
        yearSelect.innerHTML += `<option value="${i}">${i}</option>`
    for (let i = 1; i <= 12; i++)
        monthSelect.innerHTML += `<option value="${i}">${i}</option>`
    for (let i = 1; i <= 31; i++)
        daySelect.innerHTML += `<option value="${i}">${i}</option>`
}

function filter() {
    let filteredData = getExpensesData()
    const year  = document.getElementById('year').value
    const month = document.getElementById('month').value
    const day   = document.getElementById('day').value
    const min   = document.getElementById('min').value
    const max   = document.getElementById('max').value

    if (year)  filteredData = filteredData.filter(item => item.date.split('-')[0] === year)
    if (month) filteredData = filteredData.filter(item => +(item.date.split('-')[1]) === +month)
    if (day)   filteredData = filteredData.filter(item => +(item.date.split('-')[2]) === +day)
    if (min)   filteredData = filteredData.filter(item => +item.cost >= +min)
    if (max)   filteredData = filteredData.filter(item => +item.cost <= +max)

    syncDataToTable('filter.html', filteredData)
}

function filterFormFunc(event) {
    event.preventDefault()
    filter()
}

// ── CHARTS PAGE ──
function initCharts() {
    const expenses = getExpensesData()

    if (expenses.length === 0) {
        document.body.innerHTML += "<p class='no-data'>📭 No expenses yet. Add some on the Home page.</p>"
        return
    }

    const categoryTotals = {}
    for (const e of expenses)
        categoryTotals[e.type] = (categoryTotals[e.type] || 0) + Number(e.cost)

    new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#4CAF50','#36A2EB','#FFCE56','#FF6384','#9966FF','#FF9F40']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    })
}

// ── HISTOGRAM ──
let histogramInstance = null

function renderHistogram(mode) {
    const expenses = getExpensesData()
    const totals = {}
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    for (const e of expenses) {
        if (!e.date) continue
        const parts = e.date.split('-')
        const key = mode === 'year' ? parts[0] : parts[0] + '-' + monthNames[+parts[1] - 1]
        totals[key] = (totals[key] || 0) + Number(e.cost)
    }

    const sortedKeys = Object.keys(totals).sort()

    document.getElementById('btnYear').style.background  = mode === 'year'  ? '#388E3C' : '#4CAF50'
    document.getElementById('btnMonth').style.background = mode === 'month' ? '#388E3C' : '#4CAF50'

    if (histogramInstance) histogramInstance.destroy()

    histogramInstance = new Chart(document.getElementById('histogramChart'), {
        type: 'bar',
        data: {
            labels: sortedKeys,
            datasets: [{
                label: mode === 'year' ? 'Total per Year ($)' : 'Total per Month ($)',
                data: sortedKeys.map(k => totals[k]),
                backgroundColor: sortedKeys.map((_, i) => `hsl(${120 + i * 20}, 55%, 50%)`),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => '$' + v } },
                x: { ticks: { maxRotation: 45, minRotation: 30 } }
            }
        }
    })
}

// ── EXPORT ──
function exportCSV() {
    const data = getExpensesData()
    if (!data.length) { alert('No expenses to export.'); return }
    let csv = 'ID,Type,Description,Cost,Date\n'
    for (const e of data)
        csv += `${e.id},"${e.type}","${e.description || ''}",${e.cost},${e.date}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'expenses.csv'; a.click()
    URL.revokeObjectURL(url)
}

function exportPDF() {
    const data = getExpensesData()
    if (!data.length) { alert('No expenses to export.'); return }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor('#4CAF50')
    doc.text('Expenses Report', 14, 20)
    doc.setTextColor('#333333')
    doc.setFontSize(10)
    let y = 35
    doc.setFillColor(76, 175, 80)
    doc.setTextColor('#ffffff')
    doc.rect(14, y - 5, 182, 8, 'F')
    doc.text('ID', 16, y); doc.text('Type', 30, y); doc.text('Description', 70, y)
    doc.text('Cost', 140, y); doc.text('Date', 165, y)
    y += 10
    doc.setTextColor('#333333')
    for (const e of data) {
        if (y > 270) { doc.addPage(); y = 20 }
        if (data.indexOf(e) % 2 === 0) {
            doc.setFillColor(242, 242, 242)
            doc.rect(14, y - 5, 182, 8, 'F')
        }
        doc.text(String(e.id), 16, y)
        doc.text(String(e.type), 30, y)
        doc.text(String(e.description || '').substring(0, 30), 70, y)
        doc.text('$' + e.cost, 140, y)
        doc.text(String(e.date), 165, y)
        y += 10
    }
    doc.save('expenses_report.pdf')
}

// ── INIT ──
navBar()

if (document.getElementById('tbody')) {
    syncDataToTable('index.html')
    syncDataToTable('filter.html')
}

if (window.location.pathname.endsWith('filter.html'))
    setSelecter()

if (window.location.pathname.endsWith('charts.html')) {
    initCharts()
    renderHistogram('year')
}