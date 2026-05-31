import React from 'react';
import './DigitalPagingBoard.css';

const DigitalPagingBoard = ({ onClose }) => {
  return (
    <div className="digital-paging-board" onClick={onClose}>
      <div className="paging-text">
        MR. JOHN
      </div>
    </div>
  );
};

export default DigitalPagingBoard;
