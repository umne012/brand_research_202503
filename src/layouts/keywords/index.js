import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

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
      const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
        method: "POST",
        headers: {
          "X-Naver-Client-Id": process.env.REACT_APP_NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.REACT_APP_NAVER_CLIENT_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          timeUnit: "date",
          keywordGroups: searchGroups.map(({ groupName, keywords }) => ({
            groupName,
            keywords,
          })),
        }),
      });

      const result = await response.json();

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
    const categories = {
      뉴스: "https://openapi.naver.com/v1/search/news.json",
      블로그: "https://openapi.naver.com/v1/search/blog.json",
    };

    const getTotal = async (query, exclude, url, date) => {
      const excludeQuery = exclude.map((word) => `-${word}`).join(" ");
      const fullQuery = `${query} ${excludeQuery} ${date}`;

      const params = new URLSearchParams({
        query: fullQuery,
        display: 1,
        start: 1,
        sort: "date",
      });

      const res = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "X-Naver-Client-Id": process.env.REACT_APP_NAVER_CLIENT_ID_2,
          "X-Naver-Client-Secret": process.env.REACT_APP_NAVER_CLIENT_SECRET_2,
        },
      });

      if (!res.ok) return 0;
      const json = await res.json();
      return json.total || 0;
    };

    const dateList = getDateList(startDate, endDate);
    const datasetsMap = {};

    for (const { groupName, keywords, exclude } of searchGroups) {
      for (const category in categories) {
        let total = 0;
        for (const date of dateList) {
          for (const keyword of keywords) {
            total += await getTotal(keyword, exclude, categories[category], date);
            await sleep(300); // 요청 간격
          }
        }

        const datasetKey = `${groupName} (${category})`;
        datasetsMap[datasetKey] = total;
      }
    }

    const labels = Object.keys(datasetsMap);
    const data = Object.values(datasetsMap);

    setMentionVolumeData({
      labels,
      datasets: [{ label: "언급량 합계", data }],
    });
  };

  const getDateList = (start, end) => {
    const dates = [];
    const s = new Date(start);
    const e = new Date(end);
    while (s <= e) {
      dates.push(s.toISOString().slice(0, 10));
      s.setDate(s.getDate() + 1);
    }
    return dates;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 날짜 바뀔 때마다 데이터 다시 요청
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

          {/* 뉴스·블로그 언급량 막대차트 */}
          <Grid item xs={12}>
            <MDBox mb={3}>
              <ReportsBarChart
                color="dark"
                title="뉴스·블로그 언급량"
                description="브랜드별 카테고리별 언급량 합계"
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
