import React from 'react';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import styles from 'styles/Home.module.css';

const BottomNavigationBar: React.FC = () => {
  const [value, setValue] = React.useState(0);

  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
      }}
      showLabels
    >
      <BottomNavigationAction label="Home" icon={<img src="asset/icons/Home.png" alt="Home" className={styles.bottom_navigation_icons}/>} />
      <BottomNavigationAction label="Chat" icon={<img src="asset/icons/Chat.png" alt="Chat" className='bottom_navigation_icons'/>}  />
      <BottomNavigationAction label="Concept" icon={<img src="asset/icons/Concept.png" alt="Concept" className='bottom_navigation_icons'/>}  />
      <BottomNavigationAction label="Account" icon={<img src="asset/icons/Account.png" alt="Account" className='bottom_navigation_icons'/>}  />
    </BottomNavigation>
  );
};

export default BottomNavigationBar;
