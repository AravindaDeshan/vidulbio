document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize UI elements
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const appContent = document.getElementById('app-content');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Show register form
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });
    
    // Show login form
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });
    
    // Login handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        firebaseAuth.signInWithEmailAndPassword(email, password)
            .then(() => {
                // Successfully logged in
                loginSection.style.display = 'none';
                appContent.style.display = 'block';
                initApp();
            })
            .catch(error => {
                alert('Login failed: ' + error.message);
            });
    });
    
    // Register handler
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        firebaseAuth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                alert('Registration successful! Please login.');
                registerSection.style.display = 'none';
                loginSection.style.display = 'block';
            })
            .catch(error => {
                alert('Registration failed: ' + error.message);
            });
    });
    
    // Logout handler
    logoutBtn.addEventListener('click', function() {
        firebaseAuth.signOut()
            .then(() => {
                appContent.style.display = 'none';
                loginSection.style.display = 'block';
            })
            .catch(error => {
                alert('Logout failed: ' + error.message);
            });
    });
    
    // Check if user is already logged in
    firebaseAuth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            loginSection.style.display = 'none';
            appContent.style.display = 'block';
            initApp();
        } else {
            // No user is signed in
            loginSection.style.display = 'block';
            appContent.style.display = 'none';
        }
    });
    
    function initApp() {
        // Tab functionality
        const tabButtons = document.querySelectorAll('.tab-btn:not(#logout-btn)');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons and content
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Add active class to clicked button and corresponding content
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Load data for the active tab
                switch(tabId) {
                    case 'dashboard':
                        loadDashboardData();
                        break;
                    case 'return':
                        loadActiveJobs();
                        break;
                    case 'reports':
                        // Default to current month
                        const currentDate = new Date();
                        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                        document.getElementById('report-month').value = currentMonth;
                        break;
                }
            });
        });
        
        // Issue Items Form
        const issueForm = document.getElementById('issue-form');
        issueForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const jobId = document.getElementById('job-id').value;
            const personName = document.getElementById('person-name').value;
            const task = document.getElementById('task').value;
            const date = document.getElementById('date').value;
            
            // Collect all items
            const itemRows = document.querySelectorAll('.item-row');
            const items = [];
            
            itemRows.forEach(row => {
                const itemName = row.querySelector('.item-name').value;
                const quantityInput = row.querySelector('.item-quantity');
                const unitInput = row.querySelector('.item-unit');
                
                if (itemName && quantityInput.value && unitInput.value) {
                    items.push({
                        itemName: itemName,
                        quantity: parseInt(quantityInput.value),
                        unit: unitInput.value
                    });
                }
            });
            
            if (items.length === 0) {
                alert('Please add at least one item');
                return;
            }
            
            // Issue items
            issueItems(jobId, personName, items, task, date)
                .then(() => {
                    alert('Items issued successfully!');
                    issueForm.reset();
                    // Reset to one empty item row
                    const itemsContainer = document.querySelector('.items-container');
                    itemsContainer.innerHTML = '';
                    itemsContainer.appendChild(createItemRow());
                    
                    // Update dashboard
                    loadDashboardData();
                    loadActiveJobs();
                })
                .catch(error => {
                    console.error('Error issuing items:', error);
                    alert('Error issuing items: ' + error.message);
                });
        });
        
        // Add another item row
        document.getElementById('add-item-btn').addEventListener('click', function() {
            const itemsContainer = document.querySelector('.items-container');
            itemsContainer.appendChild(createItemRow());
        });
        
        // Search active jobs
        document.getElementById('search-btn').addEventListener('click', function() {
            const searchTerm = document.getElementById('job-search').value.toLowerCase();
            filterActiveJobs(searchTerm);
        });
        
        // Return items modal
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('return-btn')) {
                const jobId = e.target.getAttribute('data-job-id');
                openReturnModal(jobId);
            }
        });
        
        // Close modal
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal')) {
                closeAllModals();
            }
        });
        
        // Return form submission
        const returnForm = document.getElementById('return-form');
        returnForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const jobId = document.getElementById('modal-job-id').textContent;
            const returnItems = [];
            
            document.querySelectorAll('#return-items-list .return-item').forEach(item => {
                const returnedQty = parseInt(item.querySelector('.returned-qty').value);
                const originalQty = parseInt(item.querySelector('.original-qty').textContent);
                
                returnItems.push({
                    itemName: item.querySelector('.item-name').textContent,
                    returnedQty: returnedQty,
                    originalQty: originalQty,
                    unit: item.querySelector('.item-unit').textContent
                });
            });
            
            returnItemsToInventory(jobId, returnItems)
                .then(() => {
                    alert('Items returned successfully!');
                    closeAllModals();
                    loadDashboardData();
                    loadActiveJobs();
                })
                .catch(error => {
                    console.error('Error returning items:', error);
                    alert('Error returning items: ' + error.message);
                });
        });
        
        // Generate report
        document.getElementById('generate-report').addEventListener('click', function() {
            const month = document.getElementById('report-month').value;
            generateMonthlyReport(month);
        });
        
        // Load initial data
        loadDashboardData();
        loadActiveJobs();
    }
});

// Helper function to create an item row
function createItemRow() {
    const row = document.createElement('div');
    row.className = 'item-row';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'item-name';
    nameInput.placeholder = 'Item Name';
    nameInput.required = true;
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'item-quantity';
    quantityInput.min = '1';
    quantityInput.placeholder = 'Qty';
    quantityInput.required = true;
    
    const unitInput = document.createElement('input');
    unitInput.type = 'text';
    unitInput.className = 'item-unit';
    unitInput.placeholder = 'Unit (kg, liters, etc.)';
    unitInput.required = true;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-item-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', function() {
        row.remove();
    });
    
    row.appendChild(nameInput);
    row.appendChild(quantityInput);
    row.appendChild(unitInput);
    row.appendChild(removeBtn);
    
    return row;
}

// Load dashboard data
function loadDashboardData() {
    // Get active jobs count
    firestoreDB.collection('activeJobs').get()
        .then(snapshot => {
            document.getElementById('active-jobs').textContent = snapshot.size;
            
            // Calculate total checked out items
            let totalCheckedOut = 0;
            snapshot.forEach(doc => {
                const job = doc.data();
                job.items.forEach(item => {
                    totalCheckedOut += item.quantity;
                });
            });
            document.getElementById('checked-out').textContent = totalCheckedOut;
        });
    
    // Get recent activity count and list
    firestoreDB.collection('transactions')
        .orderBy('date', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            document.getElementById('recent-activities').textContent = snapshot.size;
            
            const activityTable = document.querySelector('#activity-table tbody');
            activityTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const entry = doc.data();
                const row = document.createElement('tr');
                
                const dateCell = document.createElement('td');
                dateCell.textContent = entry.date.toDate().toLocaleDateString();
                row.appendChild(dateCell);
                
                const jobCell = document.createElement('td');
                jobCell.textContent = entry.jobId;
                row.appendChild(jobCell);
                
                const personCell = document.createElement('td');
                personCell.textContent = entry.personName;
                row.appendChild(personCell);
                
                const actionCell = document.createElement('td');
                actionCell.textContent = entry.action === 'issue' ? 'Issued' : 'Returned';
                actionCell.className = entry.action === 'issue' ? 'text-success' : 'text-info';
                row.appendChild(actionCell);
                
                activityTable.appendChild(row);
            });
        });
}

// Load active jobs
function loadActiveJobs() {
    firestoreDB.collection('activeJobs').get()
        .then(snapshot => {
            const tableBody = document.querySelector('#active-jobs-table tbody');
            tableBody.innerHTML = '';
            
            snapshot.forEach(doc => {
                const job = doc.data();
                const row = document.createElement('tr');
                
                const jobIdCell = document.createElement('td');
                jobIdCell.textContent = job.jobId;
                row.appendChild(jobIdCell);
                
                const personCell = document.createElement('td');
                personCell.textContent = job.personName;
                row.appendChild(personCell);
                
                const dateCell = document.createElement('td');
                dateCell.textContent = job.date.toDate().toLocaleDateString();
                row.appendChild(dateCell);
                
                const itemsCell = document.createElement('td');
                const itemsList = document.createElement('ul');
                job.items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.quantity} ${item.unit} of ${item.name}`;
                    itemsList.appendChild(li);
                });
                itemsCell.appendChild(itemsList);
                row.appendChild(itemsCell);
                
                const actionCell = document.createElement('td');
                const returnBtn = document.createElement('button');
                returnBtn.className = 'btn-secondary return-btn';
                returnBtn.setAttribute('data-job-id', job.jobId);
                returnBtn.textContent = 'Return';
                actionCell.appendChild(returnBtn);
                row.appendChild(actionCell);
                
                tableBody.appendChild(row);
            });
        });
}

// Filter active jobs
function filterActiveJobs(searchTerm) {
    const rows = document.querySelectorAll('#active-jobs-table tbody tr');
    
    rows.forEach(row => {
        const jobId = row.cells[0].textContent.toLowerCase();
        const personName = row.cells[1].textContent.toLowerCase();
        
        if (jobId.includes(searchTerm) || personName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Open return modal
function openReturnModal(jobId) {
    firestoreDB.collection('activeJobs').doc(jobId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('Job not found');
            }
            
            const job = doc.data();
            document.getElementById('modal-job-id').textContent = jobId;
            
            const itemsList = document.getElementById('return-items-list');
            itemsList.innerHTML = '';
            
            job.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'return-item';
                
                const itemName = document.createElement('h4');
                itemName.className = 'item-name';
                itemName.textContent = item.name;
                itemDiv.appendChild(itemName);
                
                const unitInfo = document.createElement('p');
                unitInfo.className = 'item-unit';
                unitInfo.textContent = `Unit: ${item.unit}`;
                itemDiv.appendChild(unitInfo);
                
                const originalQtyLabel = document.createElement('p');
                originalQtyLabel.textContent = `Originally issued: `;
                
                const originalQtySpan = document.createElement('span');
                originalQtySpan.className = 'original-qty';
                originalQtySpan.textContent = item.quantity;
                originalQtyLabel.appendChild(originalQtySpan);
                itemDiv.appendChild(originalQtyLabel);
                
                const returnQtyGroup = document.createElement('div');
                returnQtyGroup.className = 'form-group';
                
                const returnQtyLabel = document.createElement('label');
                returnQtyLabel.textContent = 'Quantity to return:';
                returnQtyGroup.appendChild(returnQtyLabel);
                
                const returnQtyInput = document.createElement('input');
                returnQtyInput.type = 'number';
                returnQtyInput.className = 'returned-qty';
                returnQtyInput.min = '0';
                returnQtyInput.max = item.quantity;
                returnQtyInput.value = item.quantity;
                returnQtyInput.required = true;
                returnQtyGroup.appendChild(returnQtyInput);
                
                itemDiv.appendChild(returnQtyGroup);
                itemsList.appendChild(itemDiv);
            });
            
            document.getElementById('return-modal').style.display = 'block';
        })
        .catch(error => {
            alert('Error loading job details: ' + error.message);
        });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Generate monthly report
function generateMonthlyReport(month) {
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    
    firestoreDB.collection('transactions')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
        .then(snapshot => {
            const summary = {
                totalIssued: 0,
                totalReturned: 0,
                netChange: 0
            };
            
            const transactions = [];
            
            snapshot.forEach(doc => {
                const t = doc.data();
                transactions.push({
                    ...t,
                    date: t.date.toDate()
                });
                
                if (t.action === 'issue') {
                    summary.totalIssued += t.quantity;
                    summary.netChange -= t.quantity;
                } else {
                    summary.totalReturned += t.quantity;
                    summary.netChange += t.quantity;
                }
            });
            
            // Update summary
            const summaryStats = document.getElementById('summary-stats');
            summaryStats.innerHTML = '';
            
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'report-summary-stats';
            
            const issuedStat = document.createElement('p');
            issuedStat.innerHTML = `<strong>Total Items Issued:</strong> ${summary.totalIssued}`;
            summaryDiv.appendChild(issuedStat);
            
            const returnedStat = document.createElement('p');
            returnedStat.innerHTML = `<strong>Total Items Returned:</strong> ${summary.totalReturned}`;
            summaryDiv.appendChild(returnedStat);
            
            const netStat = document.createElement('p');
            netStat.innerHTML = `<strong>Net Change:</strong> ${summary.netChange > 0 ? '+' : ''}${summary.netChange}`;
            summaryDiv.appendChild(netStat);
            
            summaryStats.appendChild(summaryDiv);
            
            // Update detailed transactions
            const reportTable = document.querySelector('#report-table tbody');
            reportTable.innerHTML = '';
            
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                const dateCell = document.createElement('td');
                dateCell.textContent = transaction.date.toLocaleDateString();
                row.appendChild(dateCell);
                
                const jobCell = document.createElement('td');
                jobCell.textContent = transaction.jobId;
                row.appendChild(jobCell);
                
                const personCell = document.createElement('td');
                personCell.textContent = transaction.personName;
                row.appendChild(personCell);
                
                const itemCell = document.createElement('td');
                itemCell.textContent = transaction.itemName;
                row.appendChild(itemCell);
                
                const qtyCell = document.createElement('td');
                qtyCell.textContent = transaction.quantity;
                row.appendChild(qtyCell);
                
                const actionCell = document.createElement('td');
                actionCell.textContent = transaction.action === 'issue' ? 'Issued' : 'Returned';
                actionCell.className = transaction.action === 'issue' ? 'text-success' : 'text-info';
                row.appendChild(actionCell);
                
                reportTable.appendChild(row);
            });
        });
}

// Issue items to a job
function issueItems(jobId, personName, items, task, date) {
    const dateObj = date ? new Date(date) : new Date();
    
    // Batch write to Firestore
    const batch = firestoreDB.batch();
    
    // Add active job document
    const jobRef = firestoreDB.collection('activeJobs').doc(jobId);
    batch.set(jobRef, {
        jobId: jobId,
        personName: personName,
        items: items,
        task: task,
        date: dateObj
    });
    
    // Add transaction records
    items.forEach(item => {
        const transactionRef = firestoreDB.collection('transactions').doc();
        batch.set(transactionRef, {
            jobId: jobId,
            personName: personName,
            itemName: item.itemName,
            quantity: item.quantity,
            action: 'issue',
            task: task,
            date: dateObj,
            unit: item.unit
        });
    });
    
    return batch.commit();
}

// Return items from a job
function returnItemsToInventory(jobId, returnItems) {
    return firestoreDB.runTransaction(async (transaction) => {
        // Get the job document
        const jobRef = firestoreDB.collection('activeJobs').doc(jobId);
        const jobDoc = await transaction.get(jobRef);
        
        if (!jobDoc.exists) {
            throw new Error('Job not found');
        }
        
        const job = jobDoc.data();
        
        // Add transaction records for returns
        returnItems.forEach(item => {
            const transactionRef = firestoreDB.collection('transactions').doc();
            transaction.set(transactionRef, {
                jobId: jobId,
                personName: job.personName,
                itemName: item.itemName,
                quantity: item.returnedQty,
                action: 'return',
                task: job.task,
                date: new Date(),
                unit: item.unit
            });
        });
        
        // Check if all items are returned
        const allReturned = returnItems.every(returnItem => 
            returnItem.returnedQty === returnItem.originalQty
        );
        
        if (allReturned) {
            // Delete the active job if all items are returned
            transaction.delete(jobRef);
        }
        
        return Promise.resolve();
    });
}