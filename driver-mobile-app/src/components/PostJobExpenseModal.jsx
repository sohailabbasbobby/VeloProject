import React, { useState } from 'react';
import './PostJobExpenseModal.css';

const PostJobExpenseModal = ({ onFinish }) => {
    const [expenseType, setExpenseType] = useState('TOLL');
    const [amount, setAmount] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusText, setStatusText] = useState(null);
    const [showCustom, setShowCustom] = useState(false);
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
        setStatusText("Transmitting expense to ledger...");

        try {
            const payload = {
                bookingId: 'JOB-9999', // Mocked last completed job
                expenseType: showCustom ? 'CUSTOM' : expenseType,
                amountPence: Math.round(parseFloat(amount) * 100),
                customLabel: showCustom ? customLabel : null,
                receiptUrl: receiptUrl
            };

            const response = await fetch('http://localhost:8000/api/fleet/booking-expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'TENANT-CORP-001',
                    'x-driver-id': 'DRV-100'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatusText("EXPENSE LOGGED SUCCESSFULLY.");
                setTimeout(() => onFinish(), 1500);
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
        <div className="expense-modal-overlay">
            <div className="expense-modal">
                <div className="expense-header">
                    <h2 className="text-gold">Post-Trip Outlays</h2>
                    <p className="text-muted text-sm">Log any tolls or parking fees incurred during the last ride.</p>
                </div>

                <div className="expense-content">
                    <div className="input-group">
                        <label>Expense Type</label>
                        {!showCustom ? (
                            <div className="type-toggles">
                                <button className={expenseType === 'TOLL' ? 'active' : ''} onClick={() => setExpenseType('TOLL')}>Toll</button>
                                <button className={expenseType === 'AIRPORT_FEE' ? 'active' : ''} onClick={() => setExpenseType('AIRPORT_FEE')}>Airport</button>
                                <button className={expenseType === 'PARKING' ? 'active' : ''} onClick={() => setExpenseType('PARKING')}>Parking</button>
                                <button className="custom-btn" onClick={() => setShowCustom(true)}>+ Custom</button>
                            </div>
                        ) : (
                            <div className="custom-input-row">
                                <input 
                                    type="text" 
                                    placeholder="Enter custom outlay label..." 
                                    className="expense-input"
                                    value={customLabel}
                                    onChange={(e) => setCustomLabel(e.target.value)}
                                />
                                <button className="cancel-custom" onClick={() => setShowCustom(false)}>✖</button>
                            </div>
                        )}
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
                        <label>Receipt Evidence</label>
                        {receiptUrl ? (
                            <div className="receipt-attached">✓ Attached Securely</div>
                        ) : (
                            <button className="btn-upload" onClick={handleUploadReceipt} disabled={isUploading}>
                                {isUploading ? 'UPLOADING...' : '📎 Upload Receipt'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="expense-footer">
                    {statusText && <span className="status-indicator">{statusText}</span>}
                    <div className="action-buttons">
                        <button className="btn-skip" onClick={onFinish} disabled={isSubmitting}>SKIP</button>
                        <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'SAVING...' : 'SAVE EXPENSE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostJobExpenseModal;
