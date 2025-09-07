
import { db } from './firebase';
import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

const chartOfAccounts = [
    // Assets
    { id: '1010', name: 'Cash and Bank', group: 'Current Assets', isDebitNormal: true },
    { id: '1020', name: 'Accounts Receivable', group: 'Current Assets', isDebitNormal: true },
    { id: '1030', name: 'Inventory - Perishables', group: 'Current Assets', isDebitNormal: true },
    { id: '1210', name: 'General Equipment', group: 'Fixed Assets', isDebitNormal: true },

    // Liabilities
    { id: '2010', name: 'Accounts Payable', group: 'Current Liabilities', isDebitNormal: false },
    { id: '2020', name: 'Member Reimbursements Payable', group: 'Current Liabilities', isDebitNormal: false },

    // Equity
    { id: '3010', name: 'Club Capital', group: 'Equity', isDebitNormal: false },
    { id: '3020', name: 'Retained Earnings', group: 'Equity', isDebitNormal: false },

    // Revenue
    { id: '4010', name: 'Sponsorship Income', group: 'Revenue', isDebitNormal: false },
    { id: '4020', name: 'Event Income', group: 'Revenue', isDebitNormal: false },

    // Expenses
    { id: '5010', name: 'Equipment Purchase (Deprecated)', group: 'Expenses', isDebitNormal: true }, // Kept for historical data
    { id: '5020', name: 'Event Expenses', group: 'Expenses', isDebitNormal: true },
    { id: '5030', name: 'Consumables & Parts', group: 'Expenses', isDebitNormal: true },
    { id: '5040', name: 'Bank Fees', group: 'Expenses', isDebitNormal: true },
    { id: '5050', name: 'Loss on Asset Retirement', group: 'Expenses', isDebitNormal: true },
];

const inventoryItems = [
    { id: 'inv-1', name: 'Metal Cupboard (1)', description: '5 Shelves', location: 'Back left corner of room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-2', name: 'Metal Cupboard (2)', description: '6 Shelves', location: 'Back left corner of room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-3', name: 'Small Metal Cupboard (3)', description: '3 Shelves', location: 'Back left corner of room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-4', name: 'Metal Cupboard', description: 'Belongs to the man Soni. It stays locked, dont ask', location: 'Back left corner of room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-5', name: 'ESP32-S3-EYE', description: 'ESP32 with camera for image recognition, speech processing', location: 'Thrust Stand Electronics box, Cupboard 1, Bottom Row', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-6', name: 'Load Cell (small)', description: 'Used for thrust stand', location: 'Thrust Stand Electronics box, Cupboard 1, Bottom Row', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-7', name: 'Load Cell (Big)', description: 'Used for thrust stand', location: 'Thrust Stand Electronics box, Cupboard 1, Bottom Row', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-8', name: 'Depron Hexagonal Panels', description: 'Laser cut from depron. probably can be used for some plane...?', location: 'Cupboard 1, Row 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-9', name: 'P32 Tail wing part', description: 'XPS foam airfoil made for the p32', location: 'Cupboard 1, Row 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-10', name: 'Waveshare SC15 Servo', description: '17kg large torque servo, insane wali hai', location: 'Box 1, Cupboard 1, Row 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-11', name: 'FC 03', description: 'Optical Speed sensor used for sensing speed of motors, etc', location: 'Box 1, Cupboard 1, Row 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-12', name: 'Jhaadu', description: 'Please do use often', location: 'Below centre table', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-13', name: 'Dustpan', description: '', location: 'Below Centre table', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-14', name: 'SpeedyBee F405', description: 'Flight Controller stacked on PDB', location: 'SpeedyBee Box, Box 5, Row0, Cupboard1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-15', name: 'EMax multirotor motor', description: '1900 kv', location: 'Box2, Row 0, Cupboard1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-16', name: '0 drag Aurora Race-X', description: 'LED Strips', location: 'Box2, Row 0, Cupboard1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-17', name: 'FTDI board', description: 'Converts USB-B to another output', location: 'Box3, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-18', name: 'Arduino Pro mini', description: '', location: 'Box3, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-19', name: 'ESP832', description: '', location: 'Box3, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-20', name: 'Voltage Converter', description: '', location: 'Box3, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-21', name: '5V Relay Module', description: '', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-22', name: 'Single Relay board VO-1', description: '', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-23', name: 'Logic level Converter', description: '', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-24', name: 'QAPASS LCD Display', description: '', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-25', name: 'QA LCD Display Mini', description: '', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-26', name: 'DHT11', description: 'Temp, Humidity Sensor', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-27', name: 'Doble Relay', description: '2 Relay Module', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-28', name: 'XL4015', description: '5A DC-DC Step down Buck Converter module', location: 'Box 4, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-29', name: 'SpeedyBee TX 800', description: '', location: 'Box 5, Row0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-30', name: '3D printed Stuff', description: 'probaly useless, please see', location: '3D printed Boxes, Row 3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-31', name: 'LM2596', description: 'dc-dc buck Converter', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-32', name: 'RGB LED board 5050', description: '5V', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-33', name: 'ST L7805CV', description: 'Voltage Regulators', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-34', name: 'SMD LED CHIPS', description: '', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-35', name: 'Micro Motor', description: '720 7mm Dia DC 3V-3.7V for drones n quadcopters', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-36', name: 'Blue LED modules', description: '12V 3mm', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-37', name: 'Red LED modules', description: '12V, 3mm', location: 'Box 6, Row3, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-38', name: 'Ignition System', description: 'made by the Rishit the Kharbanda', location: 'IGN System Box, row 0, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-39', name: 'Airspeed Analog V1.1', description: 'Pitot tube airspeed sensor', location: 'Box 7, row 0, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-40', name: 'Power Module V6.0', description: '', location: 'Box 7, row 0, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-41', name: 'Brushless motor', description: '1100 kv, has a drone arm attached to it', location: 'Row 0, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-42', name: 'Packed Brushless Motor', description: 'Emax multicopter motor, 935 kv, has 2 props with it', location: 'Row 0, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-43', name: 'Misc Boxes', description: 'Miscelleneous', location: 'Bottom row, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-44', name: 'Dji spark drone', description: 'Arm is broken, Dji box', location: 'Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-45', name: 'Masks', description: 'Disposable Face mask box', location: 'Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-46', name: 'ESC', description: '30Amps', location: 'Box 9, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-47', name: 'Motors (Ready toski 2300 kv)', description: 'Ready toski 2300 kv', location: 'Box 8, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-48', name: 'Motors (Ready toski 2212- 920 kv)', description: 'Ready toski 2212- 920 kv', location: 'Box 8, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-49', name: 'Fotek SSR- 25DA', description: 'DC - ACVoltage converter', location: 'Box 9, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-50', name: 'CADDX FPV Rattle 2', description: 'Rattle 2', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-51', name: 'Touch Sensor', description: '', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-52', name: 'Hw 504 Joystick module', description: 'Hw 139', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-53', name: 'Max 6675 K-type thermocup sensor module', description: 'Temperature measuring sensor', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-54', name: 'Taparia Screw drivers set', description: 'Orange Coloured', location: 'Row 0, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-55', name: 'DC-DC step down buck converter module', description: 'XY-3606 model', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-56', name: 'DoBoFo Edf', description: 'D2836, 3500KV-4s', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-57', name: 'Gopro Case', description: '', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-58', name: '2-axis brushless Gimbal', description: 'Gimbal', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-59', name: 'Quadcopter PDB', description: '', location: 'Tray 1, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-60', name: 'allen key', description: '4.5 cm, 1.5 cm length', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-61', name: 'Antenna', description: 'Unknown', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-62', name: 'After Burner Prototype 1', description: 'Prototype', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-63', name: 'Male plug charger', description: 'Charger', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-64', name: 'Cable B type', description: 'B type cable', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-65', name: 'Speedybee Antenna', description: '5.8 GHz 2.8dBi Antenna. 1piece in a box of 2', location: 'Speedybee box, Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-66', name: 'coin cell', description: 'cr-2032, 3v', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-67', name: 'Eachine K-Loverleaves Mushroom Antenna', description: '5.8G 5dBi 6-Leaf Clover SMA/RP-SMA', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-68', name: 'Tactile push button switch', description: '', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-69', name: 'Box 10', description: 'The box of Boxes. it will box your boxes till you need the boxes from the box', location: 'Box 10, Bottom Row, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-70', name: 'MMCX', description: 'Micro miniature Coaxial', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-71', name: 'momentary push button', description: '', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-72', name: 'RF coaxial pigtail cable', description: 'MMCX to SMA adapter cable', location: 'Tray 2, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-73', name: 'Banana plugs to T-plug connector', description: '', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-74', name: 'Gimbal Motor 5288', description: '', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-75', name: 'Buzzer', description: '', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-76', name: 'Dys 1120 kv Motor', description: '1120 kv, D2836-7', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-77', name: 'Dji 2212/920 kv motor', description: '2212/920 kv', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-78', name: 'Crocodile clips cable', description: '', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-79', name: 'Espressif', description: 'Esp 32-S3-WROOM-1', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-80', name: 'RS 2205', description: '2300KV', location: 'Box 11, Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-81', name: '6.5 cm dia drone propellers', description: '', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-82', name: 'X-Box motherboard', description: 'x-box 360 motherboard, how tf', location: 'Row 2, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-83', name: 'Eachine EV800D FPV Goggles', description: '5.8G. A 3d printed outline is also there with it', location: 'Box 12, Row 2, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-84', name: 'Rubber Bands', description: 'Multipe', location: 'Box 12, Row 2, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-85', name: 'Glare Guard for Eachine Goggles', description: '', location: 'Box 12, Row 2, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-86', name: 'Eachine FPV VR Goggles Box', description: '', location: 'Row 2, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-87', name: 'Iron mini DIY', description: '', location: 'Bottom row, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-88', name: 'TBS Triumph Stub RP-SMA antenna', description: '', location: 'Tray 2,Row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-89', name: 'Jumper wires', description: 'Without jumpers pins. About 6 feet, kinda gay', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-90', name: 'Carbonfibre pieces', description: '', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-91', name: 'O-life remote', description: '', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-92', name: 'DC motor with a small prop', description: '', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-93', name: '4-digit red 7-segment LED display', description: '5461AS 0.56-inch', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-94', name: 'Ekectrobot 10 segment super bright red LED', description: '', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-95', name: 'Single digit Led display', description: 'Sun056CC RY 1007', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-96', name: 'LM393 Optical Photosensitive LDR light sensor module', description: '', location: 'Box 13, Row 0, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-97', name: 'Glue Gun sticks', description: 'Packets of 5', location: 'Glue Gun box(14),Row 2, cupboard 1', totalQuantity: 5, availableQuantity: 5, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-98', name: 'Pibox inspire Harddrive', description: 'Harddisk', location: 'row 1, Cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-99', name: 'Glue Gun', description: '60W, new', location: 'Glue Gun box(14), Row 2, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-100', name: 'Black wire', description: 'black af', location: 'Bottom row, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-101', name: 'Chair plastic', description: 'Blue, supports approximately one whole achyut(not sure tho)', location: 'RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-102', name: 'Wooden Stool', description: '', location: 'RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-103', name: 'Wooden chair', description: 'location of the most important ppl in the room', location: 'RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-104', name: 'Black chair', description: 'backrest is broken', location: 'RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-105', name: 'Table', description: 'To be used while sitting. position of power and productivity', location: 'Rc room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-106', name: 'Work Table', description: 'initiation point of hopes and dreams', location: 'RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-107', name: 'Step Work Table', description: '', location: 'RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-108', name: 'Pin Board', description: '', location: 'Back of RC room', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-109', name: 'Curtains', description: '', location: 'RC room windows', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-110', name: 'Flight Bag', description: 'The bag of dreams', location: 'RC', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-111', name: 'Black Rucksack small', description: '', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-112', name: 'Radiolink AT 10 Transmitter', description: '2.4GHz Orange and black', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-113', name: 'FrSKY Transmitter (Taranis Q, X7)', description: 'orange, antenna is broken', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-114', name: 'FrSKY Transmitter (Taranis Q, X7)', description: 'White', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-115', name: 'Flysky CT 6B', description: '2.4 GHz. Black with purple joysticks', location: 'Shelf 2, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-116', name: 'Flysky FS-I6', description: 'Black with purple joysticks', location: 'Shelf 1, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-117', name: 'Mini hdmi to usb A cable', description: '', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-118', name: 'PETG Orange 3D printer filament', description: 'dia 1.75, print temp:220-250 deg C', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-119', name: 'PLA+ 3D Filament', description: 'dia 1.75, print temp:190-220 deg C', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-120', name: 'Aux to Aux cable', description: 'braided', location: 'Shelf 0, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-121', name: 'Joystick cover radiomaster', description: 'Blue colored, rubber', location: 'Shelf 1, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-122', name: 'Misc Box', description: 'Miscelleneous', location: 'Shelf 2, Cupboard 3', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-123', name: '2024 SNAPS', description: 'Apogee 24', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-124', name: 'White cloth', description: 'Testing cloth', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-125', name: 'Pixhawk 2.4.8', description: '', location: 'Yog panjarale', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-126', name: 'DST (Double sided tape)', description: 'New', location: 'Shelf 1, Box 15, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-127', name: 'Thinner Glue sticks', description: 'Gluegun Packet', location: 'Glue Gun box(14),Row 2, cupboard 1', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-128', name: 'rubber band bag (1)', description: 'Packet', location: 'Shelf 1, Box 15, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-129', name: 'rubber band bag (2)', description: 'Packet', location: 'Shelf 1, Tray 3, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-130', name: 'Zip ties', description: 'Packet', location: 'Shelf 1, Box 15, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-131', name: 'Green ribbon', description: '', location: 'Shelf 1, Tray 3, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-132', name: 'Fevikwik', description: 'Instant glue', location: 'Shelf 1, Tray 3, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-133', name: 'Pencil cell', description: 'eveready battery cell (the ones used in clocks)', location: 'Shelf 1, Tray 3, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-134', name: 'Reflective tape', description: 'white', location: 'Shelf 1, Box 15, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-135', name: 'L brackets', description: 'Grey', location: 'Shelf 1, Box 16, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-136', name: 'Firewall', description: '10 white and 1 balck', location: 'Shelf 1, Box 16, Cupboard 5', totalQuantity: 11, availableQuantity: 11, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-137', name: 'Transparent tape', description: 'normal tape Pack of 6', location: 'Shelf 1, Cupboard 15', totalQuantity: 6, availableQuantity: 6, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-138', name: 'Fevicol (200g)', description: '200 g', location: 'Shelf 1, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-139', name: 'Fevicol (25g)', description: '25g', location: 'Shelf 1, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-140', name: 'Fevicol (20g)', description: '20g', location: 'Shelf 1, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-141', name: '4 black tapes', description: 'non electric but black', location: 'Shelf 1, Cupboard 15', totalQuantity: 4, availableQuantity: 4, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-142', name: 'Nerolac synthetic emamel', description: '', location: 'Shelf 1, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-143', name: 'Truwell cpvc solvent cement', description: 'solvent cement', location: 'Shelf 1, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-144', name: 'Aluminium foil roll', description: '', location: 'Shelf 2, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-145', name: 'Caminowa Fertilizer', description: 'NPK 13:00:45', location: 'Shelf 2, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-146', name: 'Potassium Nitrate', description: 'Extra pure', location: 'Shelf 2, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-147', name: 'Casette gas', description: '225 g butane gas', location: 'Shelf 2, Cupboard 15', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-148', name: '2 transparent tapes', description: 'normal tapes', location: 'Shelf 1, Tray 3, Cupboard 5', totalQuantity: 2, availableQuantity: 2, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-149', name: 'Steel pins', description: 'In a box', location: 'Steel pin box, Shelf 2, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-150', name: 'Control Horns box', description: 'Control horns 3d printed ones. White and orange', location: 'Control horns box, Shelf 1, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-151', name: 'Cycle spokes', description: 'Mostly bent', location: 'Shelf 1, Cupboad 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-152', name: 'Baking Powder', description: '', location: 'Shelf 2, Cupboard 5', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-153', name: 'B1 Battery', description: '3S, 2200 mah, Pro range, Battery health 11.5V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-154', name: 'B2 Battery', description: '3S, 2200mah, Pro range, Battery health 8.8V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-155', name: 'B3 Battery', description: '3S 2200mah, Pro range, Battery health 7.75V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-156', name: 'B4 Battery', description: '2S, Black battery, Battery health 8.53 V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-157', name: 'B5 Battery', description: '3S, 2200mah, Pro range, Battery health 12.4V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-158', name: 'B6 Battery', description: '3S, 2200mah, Pro range, Battery health 11.9V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-159', name: 'B7 Battery', description: '3S, 2200mah, Pro range, Battery health 8.63V, A bit inflated', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-160', name: 'B8 Battery', description: '4S, 4500mah, Pro range, Battery health 16.2V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-161', name: 'B9 Battery', description: '6S, 1380mah, Pro range, Battery health 24.2V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-162', name: 'B10 Raptor Battery', description: '4S, 3300mah, Pro range, Battery health 16.4V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-163', name: 'B11 Raptor Battery', description: '4S, 2500mah, Pro range, Battery health 16.5V', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-164', name: 'B12 Battery', description: '3S, 2200mah, ZOP power, Battery health 11.7V. Inflated black battery', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-165', name: 'B13 Battery', description: '2S, 2000mah, Black battery, Battery health 8.12. A bit inflated battery', location: 'Battery box', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-166', name: 'B14 Battery', description: '3S, 2200mah, Pro range, Battery health 12.1V. A bit inflated battery', location: 'Outside', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-167', name: 'B15 Battery', description: '3S, 5200mah, Pro range, Battery health 7.69V. A bit inflated battery', location: 'Outside', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-168', name: 'B16 Battery', description: '4S, 3300mah, Pro range, Battery health 13.3V. A bit inflated battery', location: 'Outside', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-169', name: 'FiberGlass Tape', description: '', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-170', name: 'WeAct Studio Demo motherboard', description: 'STM32H743VIT6-LCD', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-171', name: 'Noel Solder Wire', description: '', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: true },
    { id: 'inv-172', name: 'female to female jumper wires', description: '', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-173', name: 'header pins', description: '', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
    { id: 'inv-174', name: 'Breakout board PCB for UWB modules', description: '', location: '', totalQuantity: 1, availableQuantity: 1, checkedOutQuantity: 0, isPerishable: false },
];

const seedCollection = async (collectionName: string, data: any[]) => {
  if (data.length === 0) {
    console.log(`Skipping seeding for ${collectionName} as no data is provided.`);
    return;
  }
  console.log(`Seeding ${collectionName}...`);
  const batch = writeBatch(db);
  data.forEach((item) => {
    const docRef = doc(db, collectionName, item.id);
    const dataWithTimestamp = { ...item, createdAt: serverTimestamp() };
    batch.set(docRef, dataWithTimestamp);
  });
  await batch.commit();
  console.log(`${collectionName} seeded successfully.`);
};

const seedPermissions = async () => {
    console.log('Seeding permissions...');
    const permissionsByRole = {
        admin: { canApproveInventory: true, canApproveNewItemRequest: true, canApproveProjects: true, canCloseProjects: true, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: true, canHoldKey: true, canManageInventoryStock: true, canManageUsers: true, canMarkNewItemOrdered: true, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: true, canViewAllUsers: true, canViewDashboardMetrics: true, canViewFinanceSummary: true, canViewInventoryLogs: true },
        coordinator: { canApproveInventory: true, canApproveNewItemRequest: true, canApproveProjects: true, canCloseProjects: true, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: false, canHoldKey: true, canManageInventoryStock: false, canManageUsers: true, canMarkNewItemOrdered: true, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: true, canViewAllUsers: true, canViewDashboardMetrics: true, canViewFinanceSummary: true, canViewInventoryLogs: true },
        drone_lead: { canApproveInventory: false, canApproveNewItemRequest: false, canApproveProjects: true, canCloseProjects: true, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: false, canHoldKey: true, canManageInventoryStock: false, canManageUsers: false, canMarkNewItemOrdered: false, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: false, canViewAllUsers: false, canViewDashboardMetrics: true, canViewFinanceSummary: false, canViewInventoryLogs: false },
        inventory_manager: { canApproveInventory: true, canApproveNewItemRequest: true, canApproveProjects: false, canCloseProjects: false, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: false, canHoldKey: true, canManageInventoryStock: true, canManageUsers: false, canMarkNewItemOrdered: true, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: true, canViewAllUsers: false, canViewDashboardMetrics: true, canViewFinanceSummary: false, canViewInventoryLogs: true },
        member: { canApproveInventory: false, canApproveNewItemRequest: false, canApproveProjects: false, canCloseProjects: false, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: false, canHoldKey: false, canManageInventoryStock: false, canManageUsers: false, canMarkNewItemOrdered: false, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: false, canViewAllUsers: false, canViewDashboardMetrics: false, canViewFinanceSummary: false, canViewInventoryLogs: false },
        plane_lead: { canApproveInventory: false, canApproveNewItemRequest: false, canApproveProjects: true, canCloseProjects: true, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: false, canHoldKey: true, canManageInventoryStock: false, canManageUsers: false, canMarkNewItemOrdered: false, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: false, canViewAllUsers: false, canViewDashboardMetrics: true, canViewFinanceSummary: false, canViewInventoryLogs: false },
        probationary: { canApproveInventory: false, canApproveNewItemRequest: false, canApproveProjects: false, canCloseProjects: false, canCreateBuckets: false, canCreateProjects: false, canExportFinanceLogs: false, canHoldKey: false, canManageInventoryStock: false, canManageUsers: false, canMarkNewItemOrdered: false, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: false, canViewAllUsers: false, canViewDashboardMetrics: false, canViewFinanceSummary: false, canViewInventoryLogs: false },
        treasurer: { canApproveInventory: true, canApproveNewItemRequest: true, canApproveReimbursements: true, canApproveProjects: false, canCloseProjects: false, canCreateBuckets: true, canCreateProjects: true, canExportFinanceLogs: true, canHoldKey: true, canManageInventoryStock: true, canManageUsers: false, canMarkNewItemOrdered: true, canRequestInventory: true, canRequestNewItem: true, canSubmitReimbursements: true, canViewAllProjects: true, canViewAllUsers: true, canViewDashboardMetrics: true, canViewFinanceSummary: true, canViewInventoryLogs: true }
    };
    const promises = Object.entries(permissionsByRole).map(([role, permissions]) => {
        const docRef = doc(db, 'permissions', role);
        return setDoc(docRef, permissions);
    });
    await Promise.all(promises);
    console.log('Permissions seeded successfully.');
};


const seedDatabase = async () => {
  try {
    await seedCollection('chart_of_accounts', chartOfAccounts);
    await seedCollection('inventory_items', inventoryItems);
    await seedPermissions();
    
    console.log('\n✅ Database seeded with new finance schema!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase().then(() => {
    if (typeof process !== 'undefined') {
        process.exit(0);
    }
});
