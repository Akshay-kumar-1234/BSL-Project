import { useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart, ProgressChart } from "react-native-chart-kit";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

const screenWidth = Dimensions.get("window").width;
const isLargeScreen = screenWidth >= 768; // breakpoint for tablet/laptop
const padding = 16;
const cardWidth = screenWidth / 2 - padding * 2;

// ------------------ Helper functions ------------------
function getLatestValue(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const last = arr[arr.length - 1];
  const value = Number(last?.value ?? last?._value ?? last ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getSafeChartData(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [0];
  return arr.map(v => {
    let value = Number(v?.value ?? v?._value ?? v ?? 0);
    return Number.isFinite(value) ? value : 0;
  });
}

function getSafeChartLabels(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [""];
  const step = Math.ceil(arr.length / 4) || 1;
  return arr.map((v, i) =>
    i % step === 0
      ? v?.time ? new Date(v.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
      : ""
  );
}

// ------------------ Main Component ------------------
export default function Dashboard() {
  // Chart data states
  const [oeeData, setOeeData] = useState({ Front_Line: [], RB: [], RC: [] });
  const [availabilityData, setAvailabilityData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [qualityData, setQualityData] = useState({ Front_Line: [], RB: [], RC: [] });

  return (
    <ScrollView style={styles.container}>
      {/* ---------- Section 1: Dashboard Cards ---------- */}
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: "#E3F2FD" }]}>
          <Text style={styles.cardTitle}>Total Parts</Text>
          <Text style={styles.cardValue}>95</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#E8F5E9" }]}>
          <Text style={styles.cardTitle}>Average Cycle Time (s)</Text>
          <Text style={styles.cardValue}>204.32</Text>
          <Text>Min: 25.09 | Max: 2246.36</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: "#FFFDE7" }]}>
          <Text style={styles.cardTitle}>Average JPH</Text>
          <Text style={styles.cardValue}>11.90</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#FFEBEE" }]}>
          <Text style={styles.cardTitle}>Running Product</Text>
          <Text style={styles.cardValue}>LXI_RC</Text>
        </View>
      </View>

      {/* Pie Chart */}
      <View style={styles.row}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Seat Production Details</Text>
          <PieChart
            data={[
              { name: "Actual Production", population: 30, color: "gold", legendFontColor: "#333", legendFontSize: 12 },
              { name: "Backlog PSN", population: 20, color: "skyblue", legendFontColor: "#333", legendFontSize: 12 },
              { name: "Today PSN Remaining", population: 15, color: "navy", legendFontColor: "#333", legendFontSize: 12 },
              { name: "Today PSN", population: 25, color: "orange", legendFontColor: "#333", legendFontSize: 12 },
              { name: "Target (Today+Backlog) PSN", population: 40, color: "grey", legendFontColor: "#333", legendFontSize: 12 },
            ]}
            width={screenWidth * 0.9}
            height={180}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        </View>
      </View>

      {/* Running Product + OEE */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Running Product</Text>
          <Image
            source={{ uri: "https://via.placeholder.com/150" }}
            style={{ width: "100%", height: 120, borderRadius: 8, marginVertical: 5 }}
          />
          <Text style={{ textAlign: "center" }}>Current model LXI_RC</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>OEE %</Text>
          <ProgressChart
            data={{ labels: ["OEE"], data: [0.1146] }}
            width={screenWidth * 0.4}
            height={150}
            strokeWidth={12}
            radius={40}
            chartConfig={chartConfig}
            hideLegend={true}
          />
          <Text style={{ textAlign: "center", fontWeight: "bold" }}>11.46%</Text>
        </View>
      </View>

      {/* ---------- Section 2: Performance Charts ---------- */}
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      <View style={[styles.performanceWrapper, isLargeScreen ? styles.performanceWrapperLarge : {}]}>

        {/* OEE Trend */}
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.header}>
            <Text style={styles.title}>OEE Trend%</Text>
            <Text style={styles.value}>{getLatestValue(oeeData.Front_Line).toFixed(2)}%</Text>
          </View>
          <LineChart
            data={{
              labels: getSafeChartLabels(oeeData.Front_Line),
              datasets: [{ data: getSafeChartData(oeeData.Front_Line) }],
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
        </View>

        {/* Availability % */}
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Availability %</Text>
            <Text style={styles.value}>{getLatestValue(availabilityData).toFixed(2)}%</Text>
          </View>
          <LineChart
            data={{
              labels: getSafeChartLabels(availabilityData),
              datasets: [{ data: getSafeChartData(availabilityData) }],
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
        </View>

        {/* Performance % */}
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Performance %</Text>
            <Text style={styles.value}>{getLatestValue(performanceData).toFixed(2)}%</Text>
          </View>
          <LineChart
            data={{
              labels: getSafeChartLabels(performanceData),
              datasets: [{ data: getSafeChartData(performanceData) }],
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
        </View>

        {/* Quality % */}
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Quality %</Text>
            <Text style={styles.value}>{getLatestValue(qualityData.Front_Line).toFixed(2)}%</Text>
          </View>
          <LineChart
            data={{
              labels: getSafeChartLabels(qualityData.Front_Line),
              datasets: [{ data: getSafeChartData(qualityData.Front_Line) }],
            }}
            width={cardWidth - padding * 2}
            height={170}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(0,122,255, ${opacity})`,
              fillShadowGradientFrom: "rgba(0,122,255,1)",
              fillShadowGradientTo: "rgba(0,122,255,0.2)"
            }}
            withInnerLines={false}
            withOuterLines={false}
            withDots={false}
            bezier
          />
        </View>

      </View>
    </ScrollView>
  );
}

// ------------------ Chart Config ------------------
const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

// ------------------ Styles ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: wp("2%") },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  cardValue: { fontSize: 22, fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  performanceWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  performanceWrapperLarge: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-around",
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  title: { fontSize: 14, fontWeight: "600" },
  value: { fontSize: 14, fontWeight: "600" },
});
