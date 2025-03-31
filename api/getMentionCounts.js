export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { startDate, endDate, searchGroups } = req.body;
  console.log("🔁 전체 요청 시작", { startDate, endDate, groupCount: searchGroups.length });

  const categories = {
    뉴스: "https://openapi.naver.com/v1/search/news.json",
    블로그: "https://openapi.naver.com/v1/search/blog.json",
  };

  const getDateList = (start, end) => {
    const dates = [];
    let s = new Date(start);
    const e = new Date(end);
    while (s <= e) {
      dates.push(s.toISOString().slice(0, 10));
      s.setDate(s.getDate() + 1);
    }
    return dates;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function getTotal(query, exclude, url, date) {
    const excludeQuery = exclude.map((word) => `-${word}`).join(" ");
    const fullQuery = `${query} ${excludeQuery} ${date}`;
    const params = new URLSearchParams({
      query: fullQuery,
      display: 1,
      start: 1,
      sort: "date",
    });

    const fullURL = `${url}?${params.toString()}`;
    console.log("🌐 요청 URL:", fullURL);

    try {
      const response = await fetch(fullURL, {
        method: "GET",
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID_2,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET_2,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API 응답 실패:", response.status, errorText);
        return 0;
      }

      const json = await response.json();
      return json.total || 0;
    } catch (error) {
      console.error(`⚠️ [${query}] 요청 실패:`, error.message);
      return 0;
    }
  }

  const dateList = getDateList(startDate, endDate);
  const datasetsMap = {}; // { `${groupName}_${category}`: [날짜별 total 수] }

  for (const group of searchGroups) {
    const { groupName, keywords, exclude } = group;

    for (const category in categories) {
      const url = categories[category];
      const dailyTotals = [];

      for (const date of dateList) {
        let totalForDate = 0;
        for (const keyword of keywords) {
          const total = await getTotal(keyword, exclude, url, date);
          totalForDate += total;
          await sleep(600); // 너무 짧으면 504 발생 가능
        }
        dailyTotals.push(totalForDate);
      }

      const key = `${groupName} (${category})`;
      datasetsMap[key] = dailyTotals;
    }
  }

  const labels = dateList;
  const datasets = Object.entries(datasetsMap).map(([label, data]) => ({ label, data }));

  console.log("✅ 언급량 결과 전송:", datasets.length, "개 라인");

  res.status(200).json({ labels, datasets });
}
