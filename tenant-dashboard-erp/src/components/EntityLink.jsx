import React from 'react';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const EntityLink = ({ type, children, gold = false, style = {} }) => {
  const { openDriverProfile, openClientProfile, openVehicleProfile, openStaffProfile } = useEntityLinker();

  if (!children || children === 'Unassigned' || children === 'TBD' || children === '—') {
    return <span style={{ color: gold ? 'var(--color-gold)' : 'inherit', ...style }}>{children || '—'}</span>;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (type === 'Driver') openDriverProfile(children);
    else if (type === 'Client' || type === 'Passenger') openClientProfile(children);
    else if (type === 'Vehicle') openVehicleProfile(children);
    else if (type === 'Staff') openStaffProfile(children);
  };

  return (
    <span
      className={`cc-mock-link${gold ? ' text-gold' : ''}`}
      onClick={handleClick}
      title={`Open ${type} Profile`}
      style={style}
    >
      {children}
    </span>
  );
};

export default EntityLink;
