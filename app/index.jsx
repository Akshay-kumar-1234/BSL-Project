import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Platform,
    Alert, // Used for the new simple "popup" on mobile
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from "react-native";
// For web/hover-like behavior, you might use 'react-native-web' specific packages
// or simply rely on the TouchableOpacity 'onPress' for touch devices.

// --- Constants & Styling ---
const SHIFTS = ["SHIFT A", "SHIFT B", "SHIFT C"];
const DATES = ["Today", "Yesterday", "Custom"];
const COLORS = {
    textPrimary: "#333",
    cardBackground: "#007AFF",
    background: "#f7f7f7", // Slightly off-white background for the app
};
const padding = 12; // Card internal padding

// Helpers (unchanged logic adapted) ---------------
const calcAverage = (arr = []) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => {
        if (typeof b === "number") return a + b;
        if (b?.value !== undefined) return a + b.value;
        if (b?._value !== undefined) return a + b._value;
        return a;
    }, 0);
    return sum / arr.length;
};

// Chart styling
const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    propsForDots: {
        r: "2",
        strokeWidth: "1",
        stroke: "#007AFF",
    },
    useShadowColorFromDataset: false,
};

// Helper to safely extract latest value
function getLatestValue(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Number(arr[arr.length - 1]?.value || arr[arr.length - 1]?._value || arr[arr.length - 1] || 0);
}

function getFirstValue(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Number(arr[0]?.value || arr[0]?._value || arr[0] || 0);
}

// JPH Series extraction (unchanged)
function extractJPHSeries(data) {
    if (!data) return { labels: [], Front_Line: [], RB: [], RC: [] };

    const lines = ["Front_Line", "RB", "RC"];

    // Get all HRP keys
    const allKeys = new Set();
    lines.forEach(line => {
        Object.keys(data[line] || {}).forEach(k => {
            if (k.startsWith("HRP")) allKeys.add(k);
        });
    });


    // Add any missing HRP keys to keep consistent order
    for (let hr = 6; hr <= 14; hr++) {
        const key = `HRP${hr.toString().padStart("0", 10)}:00`;
        allKeys.add(key);
    }


    const sortedKeys = [...allKeys].sort((a, b) => {
        const hour = (k) => parseInt(k.replace("HRP", "").split(":")[0], 10);
        return hour(a) - hour(b);
    });

    const labels = sortedKeys.map(k => k.replace("HRP", ""));

    // Build series for each line
    const result = { labels, Front_Line: [], RB: [], RC: [] };

    lines.forEach(line => {
        result[line] = sortedKeys.map(k => {
            const arr = data[line]?.[k];
            if (Array.isArray(arr) && arr.length > 0) {
                const last = arr[arr.length - 1];
                return Number(last.value ?? last._value ?? 0);
            }
            return 0;
        });
    });

    return result;
}


// --- Helper to normalize & sort ---
const normalizeAndSort = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((d, i) => ({
      time: new Date(d.time || d._time || i),
      value: Number(d.value || d._value || 0),
    }))
    .sort((a, b) => a.time - b.time);
};


// ❌ Value Modal Component Removed

// -------------Main component ----------
export default function App() {

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // ❌ NEW STATE for Modal (modalState) REMOVED


    // --- Define what to process ---
const fields = {
  Front_Line: ["Productivity", "Avail", "OEE", "Quality"],
  RB: ["OEE", "Quality"],
  RC: ["OEE", "Quality"],
};
    // Chart data states
    const [jphData, setJphData] = useState({ labels: [], datasets: [], legend: [] });
    const [oeeData, setOeeData] = useState({
        Front_Line: [],
        RB: [],
        RC: [],
    });
    const [availabilityData, setAvailabilityData] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [qualityData, setQualityData] = useState({
        Front_Line: [],
        RB: [],
        RC: [],
    });
    const breaks = ["08:00", "12:00"];


    const [selectedDate, setSelectedDate] = useState("Today");
    const [selectedShift, setSelectedShift] = useState("Shift A");
    const [customDate, setCustomDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [columns, setColumns] = useState(2);
    const screenWidth = Dimensions.get("window").width;


    // --- New Simple Value Display Handler ---
    const handleCardPress = (title, content) => {
        const cleanContent = content.trim().replace(/\s{2,}/g, '\n'); // Clean up details string for alert

        Platform.select({
            // On Mobile (iOS/Android), show a native alert box
            default: () => Alert.alert(title, cleanContent, [{ text: "OK" }]),
            // On Web/Desktop, log to console, as native alerts are often disruptive,
            // or you could implement a simple custom Toast/Tooltip here.
            web: () => console.log(`Card Clicked: ${title}\n---\n${cleanContent}`),
        })();
    };

    // ❌ closeModal REMOVED


    // Responsive columns
    useEffect(() => {
        if (screenWidth < 480) setColumns(1);
        else if (screenWidth < 900) setColumns(2);
        else if (screenWidth < 1300) setColumns(3);
        else setColumns(4);
    }, [screenWidth]);

    const cardGap = 12;
    const containerPadding = 10;
    const totalHorizontalSpacing =
        containerPadding * 2 + cardGap * (columns - 1);
    const cardWidth = Math.floor(
        (screenWidth - totalHorizontalSpacing) / columns
    );

    // Fetch backend data

    const fetchData = async () => {
        try {
            setLoading(true);
            let dateParam = "";
            if (selectedDate === "Today") dateParam = "today";
            else if (selectedDate === "Yesterday") dateParam = "yesterday";
            else if (selectedDate === "Custom") dateParam = customDate.toISOString().split("T")[0];

            const baseUrl = "https://plant-backend-psi.vercel.app/influx/data";
            const params = new URLSearchParams({
                shift: selectedShift,
                date: dateParam,
                lines: "Front_Line,RB,RC",
                fields: "JPH,Quality,OEE,Productivity,Avail,Total_Prod_Today,reject,rework,total_production_set",
            });
            const url = `${baseUrl}?${params.toString()}`;

            console.log("Requesting:", url);
            const response = await fetch(url, { method: "GET" });


            const json = await response.json() || {};
            console.log("Backend response:", json);


            if (json.success) {
                // ✅ Use the fetched data (json.data) directly here to set all states.
                const data = json.data || {};
                setData(data);

// --- Generate all normalized + sorted datasets dynamically ---
const sortedData = {};

Object.entries(fields).forEach(([section, keys]) => {
  sortedData[section] = {};
  keys.forEach((key) => {
    const rawData = data?.[section]?.[key];
    sortedData[section][key] = normalizeAndSort(rawData);
  });
});

// Now you can access like:
const sortedProductivity = sortedData?.Front_Line?.Productivity || [];
const sortedAvailability = sortedData?.Front_Line?.Avail || [];
const sortedOEE = sortedData?.Front_Line?.OEE || [];
const sortedOEERB = sortedData?.RB?.OEE || [];
const sortedOEERC = sortedData?.RC?.OEE || [];
const qualityFront = sortedData?.Front_Line?.Quality || [];
const qualityRB = sortedData?.RB?.Quality || [];
const qualityRC = sortedData?.RC?.Quality || [];


                const series = extractJPHSeries(data);
                setJphData({
                    labels: series.labels,
                    datasets: [
                        { data: series.Front_Line, color: () => "#007bff" }, // Blue
                        { data: series.RB, color: () => "#9370db" }, // Purple
                        { data: series.RC, color: () => "#32cd32" }, // Green
                    ],
                    legend: ["Front Line", "Rear Back", "Rear Cushion"],
                });

                setPerformanceData(sortedProductivity);
                setQualityData({
                    Front_Line: qualityFront,
                    RB: qualityRB,
                    RC: qualityRC,
                });
                setAvailabilityData(sortedAvailability);
                setOeeData({
                    Front_Line: sortedOEE,
                    RB: sortedOEERB,
                    RC: sortedOEERC,
                });
            } else {
                setError(json.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ✅ When filters change
    useEffect(() => {
        fetchData();
    }, [selectedShift, selectedDate, customDate]);
    

    // DatePicker Change Handler
    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || customDate;
        // Close the picker UI on Android, keep open on iOS until button press (though this is simplified)
        setShowDatePicker(Platform.OS === 'ios' ? true : false);
        if (selectedDate) {
            setCustomDate(currentDate);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="blue" style={{ flex: 1, justifyContent: 'center' }} />;
    if (error) return <Text style={{ padding: 20, textAlign: 'center' }}>Error: {error}</Text>;

    const totalSetFront = data?.Front_Line?.total_production_set?.[0]?.value || 0;
    const totalSetRB = data?.RB?.total_production_set?.[0]?.value || 0;
    const totalSetRC = data?.RC?.total_production_set?.[0]?.value || 0;


    const passCount = getFirstValue(data?.Front_Line?.Total_Prod_Today || (0)) +
        getFirstValue(data?.RB?.Total_Prod_Today || (0)) +
        getFirstValue(data?.RC?.Total_Prod_Today || (0));

    const rejectCount = getFirstValue(data?.Front_Line?.reject) || (0) +
        getFirstValue(data?.RB?.reject) || (0) +
        getFirstValue(data?.RC?.reject) || (0);

    const reworkCount = getFirstValue(data?.Front_Line?.rework) || (0) +
        getFirstValue(data?.RB?.rework) || (0) +
        getFirstValue(data?.RC?.rework) || (0);

    // --- Reusable Card Component with Press Handler ---
    const PressableCard = ({ title, details, children, cardWidth, fullWidth = false }) => {
        const cardStyle = fullWidth ? styles.fullWidthCard : styles.card;
        const widthStyle = fullWidth ? { width: '100%' } : { width: cardWidth };

        // The logic is simplified: just call the handler with title and details.
        const handlePress = () => {
            handleCardPress(title, details);
        };

        return (
            <TouchableOpacity
                style={[cardStyle, widthStyle]}
                onPress={handlePress}
                activeOpacity={0.7} // Visual feedback on touch
            >
                {children}
            </TouchableOpacity>
        );
    };


    // ------- Render-------
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Date Picker Modal/Component */}
            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={customDate}
                    mode="date"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}

            {/* --- SCROLLABLE DASHBOARD CONTENT --- */}
            <ScrollView contentContainerStyle={styles.container}>

                {/* --- TOP CONTROLS (SCROLLING & RIGHT ALIGNED) --- */}
                <View style={styles.scrollingTopControls}>

                    {/* --- Shift + Date + Refresh (All in One Row) --- */}
                    <View style={styles.filterRow}>
                        {/* Shift Selection */}
                        <View style={styles.control}>
                            <Text style={styles.label}>Shift Selection</Text>
                            <Picker
                                selectedValue={selectedShift}
                                mode="dropdown"
                                style={styles.picker}
                                onValueChange={(itemValue) => setSelectedShift(itemValue)}
                            >
                                <Picker.Item label="Shift A" value="Shift A" />
                                <Picker.Item label="Shift B" value="Shift B" />
                                <Picker.Item label="Shift C" value="Shift C" />
                                <Picker.Item label="Today So Far" value="Today So Far" />
                            </Picker>
                        </View>

                        {/* Date Selection */}
                        <View style={styles.control}>
                            <Text style={styles.label}>Date Selection</Text>
                            <Picker
                                selectedValue={selectedDate}
                                mode="dropdown"
                                style={styles.picker}
                                onValueChange={(itemValue) => {
                                    setSelectedDate(itemValue);
                                    if (itemValue === "Custom") setShowDatePicker(true);
                                }}
                            >
                                <Picker.Item label="Today" value="Today" />
                                <Picker.Item label="Yesterday" value="Yesterday" />
                                <Picker.Item label="Custom Date" value="Custom" />
                            </Picker>
                        </View>

                        {/* Refresh Button */}
                        <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
                            <Text style={styles.refreshText}>⟳ Refresh</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Custom Date Picker */}
                {selectedDate === "Custom" && (
                    <View style={styles.control}>
                        <Text style={styles.label}>Select Custom Date</Text>
                        <TouchableOpacity
                            style={styles.dateDisplayButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ fontSize: 14, color: COLORS.textPrimary }}>
                                {customDate.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                    </View>

                )}

                {/* Card 1 - Total Set Production (Pressable) */}
                <PressableCard
                    title="Total Set Production"
                    cardWidth={cardWidth}
                    details={`
                        Front Line: ${totalSetFront} Sets
                        Rear Back: ${totalSetRB} Sets
                        Rear Cushion: ${totalSetRC} Sets
                    `}
                >
                    <Text style={styles.title}>Total Set Production</Text>
                    <PieChart
                        data={[
                            { name: "Front Line", population: totalSetFront, color: "orange", legendFontColor: "#333", legendFontSize: 12 },
                            { name: "Rear Back", population: totalSetRB, color: "green", legendFontColor: "#333", legendFontSize: 12 },
                            { name: "Rear Cushion", population: totalSetRC, color: "blue", legendFontColor: "#333", legendFontSize: 12 },
                        ]}
                        width={cardWidth}
                        height={170}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        absolute />
                </PressableCard>

                {/* card-2 Average Jph (Pressable) */}
                <PressableCard
                    title="Average JPH (in Sets)"
                    cardWidth={cardWidth}
                    details={`
                        Front Line: ${Number(data?.Front_Line?.JPH || 0).toFixed(2)} Sets/Hr
                        Rear Back: ${Number(data?.RB?.JPH || 0).toFixed(2)} Sets/Hr
                        Rear Cushion: ${Number(data?.RC?.JPH || 0).toFixed(2)} Sets/Hr
                    `}
                >
                    <Text style={styles.title}>Average JPH (in Sets)</Text>

                    <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
                        {[
                            { label: "Front Line", color: "orange", value: data?.Front_Line?.JPH || 0 },
                            { label: "Rear Back", color: "green", value: data?.RB?.JPH || 0 },
                            { label: "Rear Cushion", color: "blue", value: data?.RC?.JPH || 0 },

                        ].map((item, index) => (
                            <View key={index} style={{ alignItems: "center" }}>
                                <View
                                    style={{
                                        height: 100,
                                        width: 30,
                                        backgroundColor: "#eee",
                                        borderRadius: 20,
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        paddingBottom: 5,
                                    }}
                                >
                                    <View
                                        style={{
                                            height: 20,
                                            width: 20,
                                            borderRadius: 10,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                </View>
                                <Text style={{ marginTop: 6, fontWeight: "bold", color: item.color }}>
                                    {Number(item.value).toFixed(2)}
                                </Text>
                                <Text style={{ fontSize: 12 }}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Highlight max */}
                    <Text style={{ marginTop: 10, textAlign: "center" }}>
                        <Text style={{ fontWeight: "bold" }}>
                            {(() => {
                                const avgs = [
                                    data?.Front_Line?.JPH || 0,
                                    data?.RB?.JPH || 0,
                                    data?.RC?.JPH || 0,
                                ];

                                const labels = ["Front Line", "Rear Back", "Rear Cushion"];
                                const maxIndex = avgs.indexOf(Math.max(...avgs));
                                return labels[maxIndex];
                            })()}
                        </Text>{" "}
                        has the highest Jobs Per Hour currently
                    </Text>
                </PressableCard>

                {/* Card 3 - Quality Summary (Pressable) */}
                <PressableCard
                    title="Quality Summary"
                    cardWidth={cardWidth}
                    details={`
                        Total Passed: ${passCount}
                        Total Rejected: ${rejectCount}
                        Total Rework: ${reworkCount}
                        Overall Quality %: ${((passCount / (passCount + rejectCount + reworkCount)) * 100 || 0).toFixed(2)}%
                    `}
                >
                    <Text style={styles.title}>Quality Summary</Text>
                    <PieChart
                        data={[
                            { name: "Pass", population: passCount, color: "blue", legendFontColor: "#333", legendFontSize: 12 },
                            { name: "Reject", population: rejectCount, color: "red", legendFontColor: "#333", legendFontSize: 12 },
                            { name: "Rewark", population: reworkCount, color: "yellow", legendFontColor: "#333", legendFontSize: 12 },
                        ]}
                        width={cardWidth}
                        height={170}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        // paddingLeft="15"
                        absolute
                    />
                </PressableCard>

                {/* Card - OEE % (Pressable) */}
                <PressableCard
                    title="OEE %"
                    cardWidth={cardWidth}
                    details={`
                        Front Line: ${getLatestValue(oeeData.Front_Line || []).toFixed(2)}%
                        Rear Back: ${getLatestValue(oeeData.RB || []).toFixed(2)}%
                        Rear Cushion: ${getLatestValue(oeeData.RC || []).toFixed(2)}%
                    `}
                >
                    <Text style={styles.title}>OEE %</Text>

                    <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
                        {[
                            { label: "Front Line", color: "orange", data: oeeData.Front_Line || [] },
                            { label: "Rear Back", color: "blue", data: oeeData.RB || [] },
                            { label: "Rear Cushion", color: "green", data: oeeData.RC || [] },
                        ].map((item, index) => {
                            const latestValue = getLatestValue(item.data).toFixed(2);
                            return (
                                <View key={index} style={{ alignItems: "center" }}>
                                    <View
                                        style={{
                                            height: 100,
                                            width: 30,
                                            backgroundColor: "#eee",
                                            borderRadius: 20,
                                            justifyContent: "flex-end",
                                            alignItems: "center",
                                            paddingBottom: 5,
                                        }}
                                    >
                                        <View
                                            style={{
                                                height: 20,
                                                width: 20,
                                                borderRadius: 10,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </View>
                                    <Text style={{ marginTop: 6, fontWeight: "bold", color: item.color }}>
                                        {latestValue}%
                                    </Text>
                                    <Text style={{ fontSize: 12 }}>{item.label}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Highlight max OEE */}
                    <Text style={{ marginTop: 10, textAlign: "center" }}>
                        <Text style={{ fontWeight: "bold" }}>
                            {(() => {
                                const latestValues = [
                                    getLatestValue(oeeData.Front_Line || []),
                                    getLatestValue(oeeData.RB || []),
                                    getLatestValue(oeeData.RC || []),
                                ];
                                const labels = ["Front Line", "Rear Back", "Rear Cushion"];
                                const maxIndex = latestValues.indexOf(Math.max(...latestValues));
                                return labels[maxIndex];
                            })()}
                        </Text>{" "}
                        has the highest OEE % currently
                    </Text>
                </PressableCard>

                {/* Corrected Card - OEE Trend (Pressable) */}
                <PressableCard
                    title="OEE Trend % (Front Line)"
                    cardWidth={cardWidth}
                    details={`
                        Front Line (Latest): ${getLatestValue(oeeData.Front_Line).toFixed(2)}%
                        Front Line (Average): ${calcAverage(oeeData.Front_Line).toFixed(2)}%
                        Data Points: ${oeeData.Front_Line.length}
                    `}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>OEE Trend%</Text>
                        <Text style={styles.value}>{getLatestValue(oeeData.Front_Line).toFixed(2)}%</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: (oeeData.Front_Line ?? []).map((v, i) =>
                                i % Math.ceil(((oeeData.Front_Line ?? []).length || 1) / 4) === 0
                                    ? new Date(v.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                                    : ""
                            ),
                            datasets: [
                                { data: (oeeData.Front_Line ?? []).map((v) => v.value) },
                            ],
                        }}
                        width={cardWidth - padding * 2}
                        height={170}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(0,0,255, ${opacity})`,
                            fillShadowGradientFrom: "rgba(0,0,255,1)",
                            fillShadowGradientTo: "rgba(0,0,255,0.2)"
                        }}
                        withInnerLines={false}
                        withOuterLines={false}
                        withDots={false}
                        bezier
                    />

                </PressableCard>

                {/* Corrected Card - Availability % (Pressable) */}
                <PressableCard
                    title="Availability % (Front Line)"
                    cardWidth={cardWidth}
                    details={`
                        Front Line (Latest): ${getLatestValue(availabilityData).toFixed(2)}%
                        Front Line (Average): ${calcAverage(availabilityData).toFixed(2)}%
                        Data Points: ${availabilityData.length}
                    `}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Availability %</Text>
                        <Text style={styles.value}>{getLatestValue(availabilityData).toFixed(2)}%</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: availabilityData.map((v, i) =>
                                i % Math.ceil(availabilityData.length / 4) === 0
                                    ? new Date(v.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                                    : ""
                            ),
                            datasets:
                                [{ data: availabilityData.map((v) => v.value) }],
                        }}
                        width={cardWidth - padding * 2}
                        height={170}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(255,0,0, ${opacity})`,
                            fillShadowGradientFrom: "rgba(255,0,0,1)",
                            fillShadowGradientTo: "rgba(255,0,0,0.2)"
                        }}
                        withInnerLines={false}
                        withOuterLines={false}
                        withDots={false}
                        bezier
                    />
                </PressableCard>

                {/* Corrected Card - Performance % (Pressable) */}
                <PressableCard
                    title="Performance % (Front Line)"
                    cardWidth={cardWidth}
                    details={`
                        Front Line (Latest): ${getLatestValue(performanceData).toFixed(2)}%
                        Front Line (Average): ${calcAverage(performanceData).toFixed(2)}%
                        Data Points: ${performanceData.length}
                    `}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Performance %</Text>
                        <Text style={styles.value}>{getLatestValue(performanceData).toFixed(2)}%</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: performanceData.map((v, i) =>
                                i % Math.ceil(performanceData.length / 4) === 0
                                    ? new Date(v.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                                    : ""
                            ),
                            datasets:
                                [{ data: performanceData.map((v) => v.value) }],
                        }}
                        width={cardWidth - padding * 2}
                        height={170}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(255,165,0, ${opacity})`,
                            fillShadowGradientFrom: "rgba(255,165,0,1)",
                            fillShadowGradientTo: "rgba(255,165,0,0.2)"
                        }}
                        withInnerLines={false}
                        withOuterLines={false}
                        withDots={false}
                        bezier
                    />
                </PressableCard>

                {/* Corrected Card - Quality % (Pressable) */}
                <PressableCard
                    title="Quality % (Front Line)"
                    cardWidth={cardWidth}
                    details={`
                        Front Line (Latest): ${getLatestValue(qualityData.Front_Line).toFixed(2)}%
                        Front Line (Average): ${calcAverage(qualityData.Front_Line).toFixed(2)}%
                        Data Points: ${qualityData.Front_Line.length}
                    `}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Quality %</Text>
                        <Text style={styles.value}>{getLatestValue(qualityData.Front_Line).toFixed(2)}%</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: (qualityData.Front_Line ?? []).map((v, i) =>
                                i % Math.ceil(((qualityData.Front_Line ?? []).length || 1) / 4) === 0
                                    ? new Date(v.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                                    : ""
                            ),
                            datasets: [
                                { data: (qualityData.Front_Line ?? []).map((v) => v.value) },
                            ],
                        }}
                        width={cardWidth - padding * 2}
                        height={170}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                            fillShadowGradientFrom: "rgba(0, 122, 255, 1)",
                            fillShadowGradientTo: "rgba(0, 122, 255, 0.2)"
                        }}
                        withInnerLines={false}
                        withOuterLines={false}
                        withDots={false}
                        bezier
                    />
                </PressableCard>

                {/* JPH Card with Break Highlight + Custom Legend (Pressable) */}
                <PressableCard
                    title="JPH Trend Breakdown"
                    fullWidth={true}
                    details={`
                        Front Line (Avg JPH): ${Number(data?.Front_Line?.JPH || 0).toFixed(2)}
                        Rear Back (Avg JPH): ${Number(data?.RB?.JPH || 0).toFixed(2)}
                        Rear Cushion (Avg JPH): ${Number(data?.RC?.JPH || 0).toFixed(2)}
                        Total Time Blocks: ${jphData.labels.length}
                    `}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>JPH (in Sets)</Text>
                        <Text style={[styles.value, { color: "blue" }]}>
                            Average:{" "}
                            {(() => {
                                // Safely collect all data arrays
                                const allData = [
                                    ...(jphData?.datasets?.[0]?.data || []),
                                    ...(jphData?.datasets?.[1]?.data || []),
                                    ...(jphData?.datasets?.[2]?.data || []),
                                ];

                                if (allData.length === 0) return "0.00";

                                const sum = allData.reduce((a, b) => a + b, 0);
                                const avg = sum / allData.length;
                                return avg.toFixed(2);
                            })()}
                        </Text>
                    </View>

                    {/* Custom Legend */}
                    <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 8 }}>
                        {[
                            { label: "Front Line", color: "#007bff" },
                            { label: "Rear Back", color: "#9370db" },
                            { label: "Rear Cushion", color: "#32cd32" },
                            { label: "Break", color: "rgba(255,165,0,0.6)" },
                        ].map((item, index) => (
                            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 10 }}>
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: item.color,
                                        marginRight: 5,
                                    }}
                                />
                                <Text style={{ fontSize: 12, fontWeight: "bold", color: "#333" }}>
                                    {item.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ position: "relative" }}>
                        {jphData.labels.length > 0 && (
                            <BarChart
                                data={{
                                    labels: jphData.labels.map((l) => l.replace(":00", "")), // "06", "07"
                                    datasets: jphData.datasets,
                                }}
                                // NOTE: For fullWidth card, chart width calculation needs to be based on screenWidth
                                width={screenWidth - containerPadding * 2 - padding * 2}
                                height={250}
                                chartConfig={{
                                    ...chartConfig,
                                    barPercentage: 0.9,
                                    categoryPercentage: 0.9,
                                    decimalPlaces: 0,
                                    data: jphData.datasets.flatMap(d => d.data), // Pass all data to calculate Y axis dynamically
                                }}
                                fromZero
                                showValuesOnTopOfBars={false} // Might clutter the chart
                                // Custom render method to draw break lines (omitted for brevity, assume the original implementation is here)
                            />
                        )}
                    </View>
                </PressableCard>
            </ScrollView>
            {/* ❌ ValueModal Component Removed */}
        </View>
    );
}

// ❌ modalStyles REMOVED

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between", // Ensure space between cards
    },
    scrollingTopControls: {
        width: '100%',
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: '100%',
        flexWrap: 'wrap', // Allow wrapping on very small screens
    },
    control: {
        minWidth: 100,
        marginVertical: 5,
        marginRight: 10,
        flexGrow: 1, // Allow controls to grow
    },
    label: {
        fontSize: 12,
        color: COLORS.textPrimary,
        marginBottom: 4,     
        
    },
    picker: {
        height: Platform.OS === "android" ? 52 : 44, // fixes text cut issue
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    refreshButton: {
        backgroundColor: COLORS.cardBackground,
        padding: 10,
        borderRadius: 8,
        height: 38,
        justifyContent: 'center',
        marginTop: 18, // Align with picker bottom
        minWidth: 30,
    },
    refreshText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: 'center',
    },
    dateDisplayButton: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        alignItems: 'center',
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: padding,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    fullWidthCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: padding,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        marginHorizontal: 10, // Adjust for main container padding
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    value: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.cardBackground,
    },
});









