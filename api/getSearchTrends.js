// api/getSearchTrends.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { startDate, endDate, keywordGroups } = req.body;

  try {
    const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: "date",
        keywordGroups,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("📛 검색 트렌드 오류:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 getSearchTrends 서버 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
}
