import { useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native";
const { width } = Dimensions.get('window');
const isSmallScreen = width < 400;

// --- Colors ---
const COLORS = {
  background: '#F9F9F9',
  cardBackground: '#FFFFFF',
  textPrimary: '#333333',
  textSecondary: '#666666',
  blueLight: '#E6F0FF',
  greenLight: '#EAF9E6',
  yellowLight: '#FFFBEA',
  redLight: '#FFF4F4',
  bluePrimary: '#007AFF',
  greenPrimary: '#28A745', // Added for 'Running' status text/dot
  orangeStatus: '#FF6347',
  chartLine: '#999999',
  chartSpike: '#FF6347',
  borderLight: '#DDDDDD',
};

// Define available options (moved outside App component)
const SHIFTS = ['Current', 'Shift A', 'Shift B', 'Shift C'];
const DATES = ['Today', 'Yesterday', 'Custom Date'];


// --- Utility Components ---

/**
 * Reusable Dropdown Menu component.
 */
const CustomDropdown = ({ options, onSelect, selectedValue, onClose }) => (
  <View style={styles.dropdownMenu}>
    {options.map((option, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.dropdownItem,
          selectedValue === option && styles.dropdownItemSelected,
        ]}
        onPress={() => onSelect(option)}
      >
        <Text style={[
          styles.dropdownItemText,
          selectedValue === option && styles.dropdownItemTextSelected,
        ]}>
          {option}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

/**
 * Renders a single summary card (Total Drives, Online Drives, etc.).
 */
const SummaryCard = ({ title, value, color }) => (
  <View style={[styles.summaryCard, { backgroundColor: color }]}>
    <Text style={styles.summaryTitle}>{title}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

/**
 * Renders a mocked line chart for the drive details.
 */
const MockChart = () => {
  // Mock data representing the spikes in the graph
  const spikes = [0.1, 0.8, 0.4, 0.1, 0.1, 0.8, 0.1, 0.3, 0.1, 0.5];
  
  return (
    <View style={styles.chartContainer}>
      {/* Y-axis labels (Mocked) */}
      <View style={styles.yAxis}>
        <Text style={styles.yLabel}>1.5</Text>
        <Text style={styles.yLabel}>0.8</Text>
        <Text style={styles.yLabel}>0.4</Text>
        <Text style={styles.yLabel}>0</Text>
      </View>
      
      {/* Chart area */}
      <View style={styles.chartArea}>
        {spikes.map((heightFactor, index) => (
          <View
            key={index}
            style={[
              styles.chartBar,
              { 
                height: heightFactor * 60, // Scale the height
                // Add gap between bars
                marginRight: 4, 
                backgroundColor: heightFactor > 0.4 ? COLORS.orangeStatus : COLORS.chartLine,
              },
            ]}
          />
        ))}
        {/* X-axis label (Mocked) */}
        <Text style={styles.xAxisLabel}>15:00</Text>
      </View>
    </View>
  );
};


/**
 * Renders the drive details card (Drive 1, Drive 2).
 * The status color is determined here based on the 'status' prop.
 */
const DriveDetailCard = ({ driveNumber, current, voltage, frequency, status }) => {
  const isRunning = status === 'Running';
  const statusColor = isRunning ? COLORS.greenPrimary : COLORS.orangeStatus;
  const statusBgColor = isRunning ? COLORS.greenLight : COLORS.yellowLight;

  return (
    <View style={styles.driveCard}>
      {/* Title and Status */}
      <View style={styles.driveHeader}>
        <Text style={styles.driveTitle}>{`Drive ${driveNumber}`}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusBgColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.driveMetrics}>
        {/* Current (Replaced Ionicons flash-outline with Unicode ⚡) */}
        <View style={styles.metricItem}>
          <Text style={[styles.metricIcon, { fontSize: isSmallScreen ? 18 : 22, color: COLORS.textSecondary }]}>⚡</Text>
          <Text style={styles.metricTitle}>Current</Text>
          <Text style={styles.metricValue}>{current}</Text>
        </View>

        {/* Voltage (Replaced Ionicons disc-outline with Unicode ⦿) */}
        <View style={styles.metricItem}>
          <Text style={[styles.metricIcon, { fontSize: isSmallScreen ? 18 : 22, color: COLORS.textSecondary }]}>⦿</Text>
          <Text style={styles.metricTitle}>Voltage</Text>
          <Text style={styles.metricValue}>{voltage}</Text>
        </View>

        {/* Frequency (Replaced Ionicons pulse-outline with Unicode 〰) */}
        <View style={styles.metricItem}>
          <Text style={[styles.metricIcon, { fontSize: isSmallScreen ? 18 : 22, color: COLORS.textSecondary }]}>〰</Text>
          <Text style={styles.metricTitle}>Frequency</Text>
          <Text style={styles.metricValue}>{frequency}</Text>
        </View>
      </View>

      {/* Chart */}
      <MockChart />
    </View>
  );
};

// --- Main App Component ---

const App = () => {
  // State for Shift and Date Selection
  const [selectedShift, setSelectedShift] = useState('Current');
  const [selectedDate, setSelectedDate] = useState('Today');
  
  // State for dropdown visibility
  const [isShiftDropdownVisible, setIsShiftDropdownVisible] = useState(false);
  const [isDateDropdownVisible, setIsDateDropdownVisible] = useState(false);

  // Function to toggle shift dropdown visibility
  const toggleShiftDropdown = () => {
    setIsShiftDropdownVisible(prev => !prev);
    // Close the other dropdown when opening one
    setIsDateDropdownVisible(false); 
  };

  // Function to toggle date dropdown visibility
  const toggleDateDropdown = () => {
    setIsDateDropdownVisible(prev => !prev);
    // Close the other dropdown when opening one
    setIsShiftDropdownVisible(false); 
  };
  
  // Handle shift selection from the dropdown
  const handleShiftSelect = (shift) => {
    setSelectedShift(shift);
    setIsShiftDropdownVisible(false); // Close dropdown after selection
  };
  
  // Handle date selection from the dropdown
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDateDropdownVisible(false); // Close dropdown after selection
  };

  
  return (
    // Replaced SafeAreaView with View for compatibility
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* --- Controls Section --- */}
        <View style={styles.controlsRow}>
          
          {/* Shift Selection */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Shift Selection</Text>
            <TouchableOpacity style={styles.dropdown} onPress={toggleShiftDropdown}>
              <Text style={styles.dropdownText}>{selectedShift}</Text>
              {/* Conditional chevron direction based on visibility */}
              <Text style={{ fontSize: 16, color: COLORS.textPrimary }}>{isShiftDropdownVisible ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {/* Conditional Dropdown Menu for Shifts */}
            {isShiftDropdownVisible && (
              <CustomDropdown
                options={SHIFTS}
                onSelect={handleShiftSelect}
                selectedValue={selectedShift}
                onClose={() => setIsShiftDropdownVisible(false)}
              />
            )}
          </View>

          {/* Date Selection */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Date Selection</Text>
            <TouchableOpacity style={styles.dropdown} onPress={toggleDateDropdown}>
              <Text style={styles.dropdownText}>{selectedDate}</Text>
              {/* Conditional chevron direction based on visibility */}
              <Text style={{ fontSize: 16, color: COLORS.textPrimary }}>{isDateDropdownVisible ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {/* Conditional Dropdown Menu for Dates */}
            {isDateDropdownVisible && (
              <CustomDropdown
                options={DATES}
                onSelect={handleDateSelect}
                selectedValue={selectedDate}
                onClose={() => setIsDateDropdownVisible(false)}
              />
            )}
          </View>

          {/* Refresh Button */}
          <TouchableOpacity style={styles.refreshButton}>
            {/* Replaced Ionicons refresh-outline with Unicode ↻ */}
            <Text style={{ fontSize: 20, color: COLORS.cardBackground }}>↻</Text>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* --- Summary Cards Section --- */}
        <View style={styles.summaryGrid}>
          {/* UPDATED COUNTS for 32 total drives (8 online, 24 offline) */}
          <SummaryCard title="Total Drives" value="32" color={COLORS.blueLight} /> 
          <SummaryCard title="Online Drives" value="8" color={COLORS.greenLight} /> 
          <SummaryCard title="Offline Drives" value="24" color={COLORS.yellowLight} />
          <SummaryCard title="Alerts" value="0" color={COLORS.redLight} />
        </View>

        {/* --- Drive Details Section --- */}
        <View style={styles.driveDetailsSection}>
          {/* Drive 1 (Stopped) */}
          <DriveDetailCard
            driveNumber={1}
            current="0.75 amp"
            voltage="225.4 volts"
            frequency="57.6 hertz"
            status="Stopped"
          />
          {/* Drive 2 (Stopped) */}
          <DriveDetailCard
            driveNumber={2}
            current="0.72 amp"
            voltage="227.7 volts"
            frequency="59.58 hertz"
            status="Stopped"
          />
          {/* Drive 3 (Running) */}
          <DriveDetailCard
            driveNumber={3}
            current="1.18 amp"
            voltage="388 volts"
            frequency="49.92 hertz"
            status="Running"
          />
          {/* Drive 4 (Running) */}
          <DriveDetailCard
            driveNumber={4}
            current="1.17 amp"
            voltage="376.6 volts"
            frequency="48.04 hertz"
            status="Running"
          />
          {/* Drive 5 (Running) */}
          <DriveDetailCard
            driveNumber={5}
            current="1.18 amp"
            voltage="350 volts"
            frequency="44.57 hertz"
            status="Running"
          />
          {/* Drive 6 (Running) */}
          <DriveDetailCard
            driveNumber={6}
            current="1.1 amp"
            voltage="336.8 volts"
            frequency="42.66 hertz"
            status="Running"
          />
          {/* Drive 7 (Stopped) */}
          <DriveDetailCard
            driveNumber={7}
            current="0.77 amp"
            voltage="348.4 volts"
            frequency="45 hertz"
            status="Stopped"
          />
          {/* Drive 8 (Stopped) */}
          <DriveDetailCard
            driveNumber={8}
            current="0.87 amp"
            voltage="401 volts"
            frequency="50 hertz"
            status="Stopped"
          />
          {/* Drive 9 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={9}
            current="0 amp"
            voltage="0 volts"
            frequency="0 hertz"
            status="Stopped"
          />
          {/* Drive 10 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={10}
            current="0 amp"
            voltage="5 volts"
            frequency="4.12 hertz"
            status="Running"
          />
          {/* Drive 11 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={11}
            current="0.81 amp"
            voltage="383.2 volts"
            frequency="50 hertz"
            status="Running"
          />
          {/* Drive 12 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={12}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 13 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={13}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 14(Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={14}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 15 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={15}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 16 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={16}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 17 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={17}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 18 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={18}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 19 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={19}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 20 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={20}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 21 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={21}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
                {/* Drive 22 (Stopped - NEW) */}
          <DriveDetailCard
            driveNumber={22}
            current="0.76 amp"
            voltage="377 volts"
            frequency="49 hertz"
            status="Running"
          />
        </View>

      </ScrollView>
    </View>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 0, 
  },
  container: {
    padding: isSmallScreen ? 12 : 20,
  },
  
  // --- Header Styles ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 12 : 20,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerFactory: {
    fontSize: isSmallScreen ? 14 : 16,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },

  // --- Controls Styles ---
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginVertical: 15,
    flexWrap: 'wrap', 
    zIndex: 10, // Ensure dropdowns are above other content
  },
  controlGroup: {
    flexGrow: 1,
    minWidth: isSmallScreen ? '45%' : 150, 
    marginRight: 10,
    marginBottom: 10,
    position: 'relative', // IMPORTANT: Allows dropdown menu to be absolutely positioned relative to this container
    zIndex: 10,
  },
  controlLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isSmallScreen ? 8 : 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
  },
  dropdownText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: COLORS.textPrimary,
  },
  
  // --- Dropdown Menu Styles ---
  dropdownMenu: {
    position: 'absolute',
    top: '100%', // Position right below the TouchableOpacity
    left: 0,
    right: 0,
    marginTop: 4, // Small gap between button and menu
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    // Shadow for Android
    elevation: 5,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 20, // Must be higher than controlsRow zIndex
  },
  dropdownItem: {
    padding: isSmallScreen ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.blueLight,
  },
  dropdownItemText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: COLORS.textPrimary,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: COLORS.bluePrimary,
  },

  // --- Refresh Button Styles (unchanged) ---
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bluePrimary,
    borderRadius: 8,
    paddingVertical: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 15 : 20,
    marginBottom: 10, 
    minWidth: 100, 
  },
  refreshText: {
    color: COLORS.cardBackground,
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    marginLeft: 5,
  },

  // --- Summary Cards Styles (unchanged) ---
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    width: isSmallScreen ? '48%' : '23.5%',
    aspectRatio: 1.5,
    borderRadius: 12,
    padding: isSmallScreen ? 15 : 20,
    marginBottom: 10,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: isSmallScreen ? 32 : 40,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // --- Drive Details Styles (updated for dynamic color) ---
  driveDetailsSection: {
    // Check for large width to determine horizontal layout
    flexDirection: width > 700 ? 'row' : 'column', 
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Allow cards to wrap if screen is wide enough for multiple columns
    gap: 15, 
  },
  driveCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: isSmallScreen ? 15 : 20,
    marginBottom: 15,
    flex: width > 700 ? 1 : undefined, 
    minWidth: width > 700 ? '48%' : '100%', // Take up half the space horizontally on wide screens
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driveTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    // Background color is now set inline in DriveDetailCard
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
    // Background color is now set inline in DriveDetailCard
  },
  statusText: {
    fontSize: isSmallScreen ? 12 : 14,
    // Text color is now set inline in DriveDetailCard
  },
  driveMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metricItem: {
    alignItems: 'flex-start',
    width: '33%',
  },
  metricIcon: { 
    lineHeight: isSmallScreen ? 18 : 22, 
  },
  metricTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  metricValue: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  
  // --- Chart Styles (unchanged) ---
  chartContainer: {
    flexDirection: 'row',
    height: 100,
    paddingRight: 10,
    marginTop:10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: 30,
    marginRight: 5,
    height: 70,
    position: 'relative',
    top: -10,
  },
  yLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.chartLine,
    paddingBottom: 5,
    justifyContent: 'space-around',
    overflow: 'hidden',
    position: 'relative',
  },
  chartBar: {
    width: isSmallScreen ? 4 : 6,
    borderRadius: 2,
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: -15,
    right: 0,
    fontSize: 10,
    color: COLORS.textSecondary,
  }
});

export default App;
