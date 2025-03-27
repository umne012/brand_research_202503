// api/getMentionCounts.js

export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }
  
    const { startDate, endDate, searchGroups } = req.body;
    // 뉴스/블로그 API URL
    const categories = {
      "뉴스": "https://openapi.naver.com/v1/search/news.json",
      "블로그": "https://openapi.naver.com/v1/search/blog.json",
    };
  
    // Helper: 날짜 목록 생성 (YYYY-MM-DD 형식)
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
  
    // Helper: sleep(ms)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
    // Helper: 특정 키워드에 대한 총 건수 조회
    async function getTotal(query, exclude, url, date) {
      const excludeQuery = exclude.map(word => `-${word}`).join(" ");
      const fullQuery = `${query} ${excludeQuery} ${date}`;
      const params = new URLSearchParams({
        query: fullQuery,
        display: 1,
        start: 1,
        sort: "date",
      });
      try {
        const response = await fetch(`${url}?${params.toString()}`, {
          method: "GET",
          headers: {
            "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID_2,
            "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET_2,
          },
        });
        if (!response.ok) return 0;
        const json = await response.json();
        return json.total || 0;
      } catch (error) {
        console.error(`Error fetching total for query "${fullQuery}":`, error);
        return 0;
      }
    }
  
    const dateList = getDateList(startDate, endDate);
    const datasetsMap = {};
  
    // 각 그룹과 카테고리에 대해 날짜별 언급 건수를 합산
    for (const group of searchGroups) {
      const { groupName, keywords, exclude } = group;
      for (const category in categories) {
        let total = 0;
        for (const date of dateList) {
          for (const keyword of keywords) {
            total += await getTotal(keyword, exclude, categories[category], date);
            await sleep(300); // 요청 간격 조절
          }
        }
        const key = `${groupName} (${category})`;
        datasetsMap[key] = total;
      }
    }
  
    const labels = Object.keys(datasetsMap);
    const data = Object.values(datasetsMap);
  
    res.status(200).json({
      labels,
      datasets: [
        {
          label: "언급량 합계",
          data,
        },
      ],
    });
  }
  