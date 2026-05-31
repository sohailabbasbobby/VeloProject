import React, { useState } from 'react';
import './ShiftExpenseLog.css';

const ShiftExpenseLog = ({ onClose }) => {
    const [expenseType, setExpenseType] = useState('FUEL');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusText, setStatusText] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadReceipt = async () => {
        setIsUploading(true);
        try {
            const response = await fetch('http://localhost:8000/api/fleet/upload-receipt', {
                method: 'POST',
                headers: {
                    'x-tenant-id': 'TENANT-CORP-001',
                    'x-driver-id': 'DRV-100'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setReceiptUrl(data.url);
            } else {
                setStatusText("ERROR: UPLOAD FAILED.");
            }
        } catch (error) {
            setStatusText("ERROR: NETWORK TIMEOUT.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!amount || isNaN(amount)) {
            setStatusText("Please enter a valid amount.");
            return;
        }

        setIsSubmitting(true);
        setStatusText("Logging general shift expense...");

        try {
            const payload = {
                vehicleId: 'VEH-1111-2222',
                expenseType,
                amountPence: Math.round(parseFloat(amount) * 100),
                description,
                receiptUrl
            };

            const response = await fetch('http://localhost:8000/api/fleet/general-expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'TENANT-CORP-001',
                    'x-driver-id': 'DRV-100'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatusText("SHIFT EXPENSE LOGGED SUCCESSFULLY.");
                setTimeout(() => onClose(), 1500);
            } else {
                setStatusText("ERROR: FAILED TO TRANSMIT.");
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            setStatusText("ERROR: NETWORK TIMEOUT.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fullscreen-overlay shift-expense">
            <div className="header-nav">
                <button className="back-btn" onClick={onClose}>← Back</button>
                <h2 className="text-gold">Log Shift Expense</h2>
            </div>
            
            <div className="shift-content">
                <p className="text-muted mb-l">Record fuel top-ups, carwashes, or general shift outlays to maintain accurate profitability metrics.</p>

                <div className="input-group">
                    <label>Expense Category</label>
                    <div className="category-toggles">
                        <button className={expenseType === 'FUEL' ? 'active' : ''} onClick={() => setExpenseType('FUEL')}>⛽ Fuel</button>
                        <button className={expenseType === 'CARWASH' ? 'active' : ''} onClick={() => setExpenseType('CARWASH')}>🫧 Carwash</button>
                        <button className={expenseType === 'CUSTOM' ? 'active' : ''} onClick={() => setExpenseType('CUSTOM')}>🔧 Other</button>
                    </div>
                </div>

                <div className="input-group">
                    <label>Amount (£)</label>
                    <input 
                        type="number" 
                        placeholder="0.00" 
                        className="expense-input amount-input"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Description (Optional)</label>
                    <textarea 
                        placeholder="E.g., Waitrose Premium Unleaded" 
                        className="expense-input desc-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Receipt Evidence</label>
                    {receiptUrl ? (
                        <div className="receipt-attached">✓ Attached Securely</div>
                    ) : (
                        <button className="btn-upload" onClick={handleUploadReceipt} disabled={isUploading}>
                            {isUploading ? 'UPLOADING...' : '📎 Upload Receipt'}
                        </button>
                    )}
                </div>

                {statusText && <div className="status-indicator mt-m">{statusText}</div>}
                
                <button className="btn-submit-large mt-l" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'TRANSMITTING...' : 'SAVE SHIFT EXPENSE'}
                </button>
            </div>
        </div>
    );
};

export default ShiftExpenseLog;
