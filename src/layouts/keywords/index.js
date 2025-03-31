import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";

function Keywords() {
  const [searchVolumeData, setSearchVolumeData] = useState(null);
  const [mentionVolumeData, setMentionVolumeData] = useState(null);
  const [startDate, setStartDate] = useState("2025-03-12");
  const [endDate, setEndDate] = useState("2025-03-18");

  const searchGroups = [
    { groupName: "Skylife", keywords: ["스카이라이프", "skylife"], exclude: [] },
    { groupName: "KT", keywords: ["KT", "케이티", "기가지니", "지니티비"], exclude: ["SKT"] },
    { groupName: "SKB", keywords: ["skb", "브로드밴드", "btv", "비티비", "b티비"], exclude: [] },
    { groupName: "LGU", keywords: ["LGU+", "유플러스", "유플"], exclude: [] },
  ];

  const fetchSearchTrends = async () => {
    try {
      const response = await fetch("/api/getSearchTrends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          keywordGroups: searchGroups.map(({ groupName, keywords }) => ({ groupName, keywords })),
        }),
      });

      const result = await response.json();

      if (!result?.results || result.results.length === 0) return;

      const labels = result.results[0].data.map((item) => item.period);
      const datasets = result.results.map((group) => ({
        label: group.title,
        data: group.data.map((d) => d.ratio),
      }));

      setSearchVolumeData({ labels, datasets });
    } catch (error) {
      console.error("🔴 검색트렌드 API 오류:", error);
    }
  };

  const fetchMentionCounts = async () => {
    try {
      const response = await fetch("/api/getMentionCounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, searchGroups }),
      });

      const result = await response.json();

      if (!result?.labels || !result?.datasets) return;

      setMentionVolumeData(result);
    } catch (error) {
      console.error("🔴 언급량 API 오류:", error);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchSearchTrends();
      fetchMentionCounts();
    }
  }, [startDate, endDate]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* 날짜 선택기 */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <TextField
              label="시작일"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="종료일"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* 검색 트렌드 라인차트 */}
          <Grid item xs={12}>
            <MDBox mb={3}>
              <ReportsLineChart
                color="info"
                title="네이버 검색 트렌드"
                description="선택한 기간 동안 브랜드별 검색량 추이"
                date={`${startDate} ~ ${endDate}`}
                chart={searchVolumeData || { labels: [], datasets: [] }}
              />
            </MDBox>
          </Grid>

          {/* 뉴스·블로그 언급량 라인차트 */}
          <Grid item xs={12}>
            <MDBox mb={3}>
              <ReportsLineChart
                color="dark"
                title="뉴스·블로그 언급량"
                description="브랜드별 카테고리별 언급량 추이"
                date={`${startDate} ~ ${endDate}`}
                chart={mentionVolumeData || { labels: [], datasets: [] }}
              />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Keywords;
